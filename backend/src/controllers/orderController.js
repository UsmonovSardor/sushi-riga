'use strict';
const { validationResult } = require('express-validator');
const tg   = require('../services/telegramService');
const fs   = require('fs');
const path = require('path');

const MENU_FILE   = path.join(__dirname, '../data/menu.json');
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

function loadMenu() {
  try { return JSON.parse(fs.readFileSync(MENU_FILE, 'utf8')); } catch { return []; }
}
function saveOrder(order) {
  try {
    let orders = [];
    try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch {}
    orders.unshift(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0, 500), null, 2));
  } catch(e) { console.error('Save order error:', e.message); }
}

exports.createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, phone, address, note, items, lang = 'ru', payMethod = 'cash' } = req.body;

    const menu = loadMenu();
    const enriched = items.map(({ id, qty }) => {
      // Support both number and string IDs
      const p = menu.find(m => String(m.id) === String(id));
      if (!p) throw new Error('Product not found: ' + id);
      return { ...p, qty };
    });

    const sub   = enriched.reduce((s, i) => s + i.price * i.qty, 0);
    const del   = sub >= 25 ? 0 : 2;
    const total = sub + del;
    const num   = Math.floor(Math.random() * 9000) + 1000;

    const order = {
      id: num,
      createdAt: new Date().toISOString(),
      name, phone, address, note,
      items: enriched, sub, del, total,
      payMethod, lang, status: 'new'
    };

    // Save to file (always)
    saveOrder(order);

    // Send to Telegram (don't fail if it errors)
    try {
      await tg.sendOrder({ ...order, num });
    } catch(tgErr) {
      console.error('Telegram error (order still saved):', tgErr.message);
    }

    res.status(201).json({ success: true, orderId: num });
  } catch(err) {
    console.error('Order error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = (req, res) => {
  try {
    let orders = [];
    try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch {}
    res.json(orders);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
