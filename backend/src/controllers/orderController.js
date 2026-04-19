'use strict';
const { validationResult } = require('express-validator');
const tg   = require('../services/telegramService');
const fs   = require('fs');
const path = require('path');

const MENU_FILE   = path.join(__dirname, '../data/menu.json');
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

function loadMenu()  { try { return JSON.parse(fs.readFileSync(MENU_FILE,'utf8')); } catch { return []; } }
function loadOrders(){ try { return JSON.parse(fs.readFileSync(ORDERS_FILE,'utf8')); } catch { return []; } }
function saveOrders(orders) { fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0,1000),null,2)); }

exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, phone, note, items, lang='ru', payMethod='cash' } = req.body;

    const menu     = loadMenu();
    const enriched = items.map(({ id, qty }) => {
      const p = menu.find(m => String(m.id) === String(id));
      if (!p) throw new Error('Product not found: ' + id);
      return { id: p.id, e: p.e, name: p.name, price: p.price, qty };
    });

    const total = enriched.reduce((s,i) => s + i.price * i.qty, 0);
    const num   = Date.now() % 100000; // unique short order number

    const order = {
      id:        num,
      createdAt: new Date().toISOString(),
      name, phone, note,
      items:     enriched,
      total,
      payMethod,
      lang,
      status:   'new',
    };

    const orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);

    // Telegram (non-blocking)
    try { await tg.sendOrder({ ...order, num }); }
    catch(e) { console.error('TG:', e.message); }

    res.status(201).json({ success:true, orderId: num });
  } catch(e) {
    console.error('Order error:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.getOrders = (_req, res) => {
  res.json(loadOrders());
};
