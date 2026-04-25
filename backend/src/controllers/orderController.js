'use strict';

const { validationResult } = require('express-validator');
const jwt     = require('jsonwebtoken');
const tg      = require('../services/telegramService');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'sushi-riga-secret-2026';

function normalizeName(name, fallback = 'Product') {
  if (name && typeof name === 'object') {
    return {
      ru: name.ru || name.lv || name.en || fallback,
      lv: name.lv || name.ru || name.en || fallback,
      en: name.en || name.lv || name.ru || fallback,
    };
  }
  return { ru: String(name||fallback), lv: String(name||fallback), en: String(name||fallback) };
}

function rowToPublicOrder(row) {
  return {
    id:            row.id,
    createdAt:     row.created_at,
    name:          row.name,
    surname:       row.surname       || '',
    phone:         row.phone,
    items:         row.items         || [],
    total:         parseFloat(row.total),
    payMethod:     row.pay_method,
    lang:          row.lang,
    status:        row.status,
    statusHistory: row.status_history || [],
    readyAt:       row.ready_at      || null,
    deliveredAt:   row.delivered_at  || null,
  };
}

async function getUserFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const r = await query('SELECT * FROM users_data WHERE id=$1', [String(payload.id)]);
    return r.rows[0] || null;
  } catch { return null; }
}

// ── CREATE ORDER ───────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const user = await getUserFromReq(req);
    const { name, surname = '', phone, note = '', items, lang = 'lv' } = req.body;

    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Load menu from DB
    const menuResult = await query('SELECT * FROM menu_items');
    const menu = menuResult.rows;

    const enriched = items.map(item => {
      const id  = item.id || item.menuId || item.productId;
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));
      const p   = menu.find(m => String(m.id) === String(id));
      if (p) {
        return { id: p.id, e: p.e||item.e||'🍣', name: normalizeName(p.name, item.name||'Product'), price: Number(p.price)||0, qty };
      }
      // Fallback: frontend data
      if (item.name && item.price) {
        return { id, e: item.e||'🍣', name: normalizeName(item.name, 'Product'), price: Number(item.price)||0, qty };
      }
      throw new Error('Product not found: ' + id);
    });

    const total = enriched.reduce((s, i) => s + (Number(i.price)||0) * (Number(i.qty)||1), 0);
    const num   = String(Date.now() % 100000);
    const now   = new Date().toISOString();
    const statusHistory = [{ status: 'new', at: now, by: 'system' }];

    await query(
      `INSERT INTO orders
         (id,name,surname,phone,note,address,items,total,pay_method,lang,
          status,status_history,customer_id,customer_phone,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
      [
        num, name, surname, phone, note, '',
        JSON.stringify(enriched), total, 'cash', lang,
        'new', JSON.stringify(statusHistory),
        user?.id ? String(user.id) : null,
        user?.phone || phone,
        now,
      ]
    );

    try {
      console.log('TG sending order #' + num);
      await tg.sendOrder({ id: num, num, name, surname, phone, note, address: '', items: enriched, total, payMethod: 'cash', lang, status: 'new', statusHistory, createdAt: now });
    } catch (e) { console.error('TG error:', e.message); }

    res.status(201).json({
      success: true, orderId: num,
      order: rowToPublicOrder({
        id: num, created_at: now, name, surname, phone,
        items: enriched, total, pay_method: 'cash', lang,
        status: 'new', status_history: statusHistory,
        ready_at: null, delivered_at: null,
      }),
    });
  } catch (e) {
    console.error('createOrder:', e.message);
    res.status(500).json({ error: e.message });
  }
};

// ── GET ORDERS (public) ────────────────────────────────────────────────────────
exports.getOrders = async (_req, res) => {
  try {
    const r = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500');
    res.set('Cache-Control', 'no-store');
    res.json(r.rows.map(rowToPublicOrder));
  } catch (err) { console.error('getOrders:', err.message); res.status(500).json({ error: 'Zakazlar yuklanmadi' }); }
};

// ── GET MY ORDERS ──────────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const normalizePhone = v => String(v||'').replace(/[^\d]/g, '');
    const phone = normalizePhone(user.phone);

    const r = await query(
      `SELECT * FROM orders
       WHERE customer_id=$1
          OR REGEXP_REPLACE(phone,'[^0-9]','','g')=$2
          OR REGEXP_REPLACE(customer_phone,'[^0-9]','','g')=$2
       ORDER BY created_at DESC`,
      [String(user.id), phone]
    );

    res.set('Cache-Control', 'no-store');
    res.json(r.rows.map(rowToPublicOrder));
  } catch (err) { console.error('getMyOrders:', err.message); res.status(500).json({ error: 'Zakazlar yuklanmadi' }); }
};
