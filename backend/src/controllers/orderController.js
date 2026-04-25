'use strict';

const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const tg = require('../services/telegramService');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const MENU_FILE = path.join(config.DATA_PATH, 'menu.json');
const ORDERS_FILE = path.join(config.DATA_PATH, 'orders.json');
const USERS_FILE = path.join(config.DATA_PATH, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'sushi-riga-secret-2026';

function readJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Read JSON error:', file, e.message);
    return fallback;
  }
}

function normalizeMenu(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.menu)) return data.menu;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function loadMenu() {
  return normalizeMenu(readJson(MENU_FILE, []));
}

function loadOrders() {
  return readJson(ORDERS_FILE, []);
}

function loadUsers() {
  return readJson(USERS_FILE, []);
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0, 1000), null, 2));
  } catch (e) {
    console.error('Save err:', e.message);
  }
}

function publicOrder(order) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    name: order.name,
    surname: order.surname || '',
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
    return users.find(u => String(u.id) === String(payload.id)) || null;
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

function normalizeName(name, fallback = 'Product') {
  if (name && typeof name === 'object') {
    return {
      ru: name.ru || name.lv || name.en || fallback,
      lv: name.lv || name.ru || name.en || fallback,
      en: name.en || name.lv || name.ru || fallback,
    };
  }

  return {
    ru: String(name || fallback),
    lv: String(name || fallback),
    en: String(name || fallback),
  };
}

exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const user = getUserFromReq(req);
    const { name, surname = '', phone, note = '', items, lang = 'lv' } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const menu = loadMenu();

    const enriched = items.map(item => {
      const id = item.id || item.menuId || item.productId;
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));

      const p = menu.find(m => String(m.id) === String(id));

      if (p) {
        return {
          id: p.id,
          e: p.e || item.e || '🍣',
          name: normalizeName(p.name, item.name || 'Product'),
          price: Number(p.price) || 0,
          qty,
        };
      }

      if (item.name && item.price) {
        return {
          id,
          e: item.e || '🍣',
          name: normalizeName(item.name, 'Product'),
          price: Number(item.price) || 0,
          qty,
        };
      }

      throw new Error('Product not found: ' + id);
    });

    const total = enriched.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const num = Date.now() % 100000;
    const now = new Date().toISOString();

    const order = {
      id: num,
      createdAt: now,
      name,
      surname,
      address: '',
      phone,
      note,
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
    } catch (e) {
      console.error('TG send error:', e.message);
    }

    res.status(201).json({
      success: true,
      orderId: num,
      order: publicOrder(order),
    });
  } catch (e) {
    console.error('Order error:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.getOrders = (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(loadOrders());
};

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
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map(publicOrder);

  res.set('Cache-Control', 'no-store');
  res.json(orders);
};
