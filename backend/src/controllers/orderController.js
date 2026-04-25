'use strict';
const { validationResult } = require('express-validator');
const jwt  = require('jsonwebtoken');
const tg   = require('../services/telegramService');
const fs   = require('fs');

const MENU_FILE   = require('path').join(require('../config').DATA_PATH, 'menu.json');
const ORDERS_FILE = require('path').join(require('../config').DATA_PATH, 'orders.json');
const USERS_FILE  = require('path').join(require('../config').DATA_PATH, 'users.json');
const JWT_SECRET  = process.env.JWT_SECRET || 'sushi-riga-secret-2026';

function loadMenu()   { try { return JSON.parse(fs.readFileSync(MENU_FILE,'utf8')); } catch { return []; } }
function loadOrders() { try { return JSON.parse(fs.readFileSync(ORDERS_FILE,'utf8')); } catch { return []; } }
function loadUsers()  { try { return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')); } catch { return []; } }

function saveOrders(orders) {
  try { fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0,1000),null,2)); } catch(e) { console.error('Save err:',e.message); }
}

function publicOrder(order) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    name: order.name,
    phone: order.phone,
    items: order.items || [],
    total: order.total || 0,
    payMethod: order.payMethod || 'cash',
    lang: order.lang || 'lv',
    status: order.status || 'new',
    statusHistory: order.statusHistory || [],
    readyAt: order.readyAt || null,
    deliveredAt: order.deliveredAt || null,
  };
}

function getUserFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const users = loadUsers();
    return users.find(u => u.id === payload.id) || null;
  } catch {
    return null;
  }
}

function requireUser(req, res) {
  const user = getUserFromReq(req);
  if (!user) {
    res.status(401).json({ error: 'Login required' });
    return null;
  }
  return user;
}

exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const user = getUserFromReq(req);
    const { name, surname='', phone, note='', items, lang='lv' } = req.body;

    const menu = loadMenu();
    const enriched = items.map(({ id, qty }) => {
      const p = menu.find(m => String(m.id) === String(id));
      if (!p) throw new Error('Product not found: ' + id);
      return { id: p.id, e: p.e, name: p.name, price: p.price, qty };
    });

    const total = enriched.reduce((s,i) => s + i.price * i.qty, 0);
    const num = Date.now() % 100000;
    const now = new Date().toISOString();

    const order = {
      id: num,
      createdAt: now,
      name, surname, address: '', phone, note,
      items: enriched,
      total,
      payMethod: 'cash',
      lang,
      customerId: user?.id || null,
      customerPhone: user?.phone || phone,
      status: 'new',
      statusHistory: [{ status: 'new', at: now, by: 'system' }],
    };

    const orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);

    try {
      console.log('Sending TG for order #' + num + ' to chat ' + process.env.TELEGRAM_CHAT_ID);
      await tg.sendOrder({ ...order, num });
    } catch(e) { console.error('TG send error:', e.message); }

    res.status(201).json({ success: true, orderId: num, order: publicOrder(order) });
  } catch(e) {
    console.error('Order error:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.getOrders = (_req, res) => res.json(loadOrders());

exports.getMyOrders = (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

const normalizePhone = v => String(v || '').replace(/[^\d]/g, '');

const phone = normalizePhone(user.phone);

const orders = loadOrders()
  .filter(o =>
    String(o.customerId || '') === String(user.id || '') ||
    normalizePhone(o.phone) === phone ||
    normalizePhone(o.customerPhone) === phone
  )
  .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  .map(publicOrder);

  res.set('Cache-Control','no-store');
  res.json(orders);
};
