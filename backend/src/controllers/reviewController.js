'use strict';
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const cfg = require('../config');

const REVIEWS_FILE = path.join(cfg.DATA_PATH, 'reviews.json');
const ORDERS_FILE = path.join(cfg.DATA_PATH, 'orders.json');
const MENU_FILE = path.join(cfg.DATA_PATH, 'menu.json');
const USERS_FILE = path.join(cfg.DATA_PATH, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'sushi-riga-secret-2026';
const ADMIN_KEY = process.env.ADMIN_SECRET || 'admin2026';

const load = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; } };
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    return load(USERS_FILE).find(u => u.id === payload.id) || null;
  } catch {
    return null;
  }
}

function isAdmin(req) {
  const auth = req.headers.authorization || '';
  if (auth === `Bearer ${ADMIN_KEY}`) return true;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function publicReview(r) {
  return {
    id: r.id,
    menuId: r.menuId,
    orderId: r.orderId,
    rating: r.rating,
    comment: r.comment || '',
    createdAt: r.createdAt,
  };
}

exports.summary = (_req, res) => {
  const reviews = load(REVIEWS_FILE);
  const summary = {};
  reviews.forEach(r => {
    if (!summary[r.menuId]) summary[r.menuId] = { count: 0, avg: 0, sum: 0 };
    summary[r.menuId].count += 1;
    summary[r.menuId].sum += Number(r.rating) || 0;
    summary[r.menuId].avg = Number((summary[r.menuId].sum / summary[r.menuId].count).toFixed(1));
  });
  Object.values(summary).forEach(x => delete x.sum);
  res.json(summary);
};

exports.forMenu = (req, res) => {
  const reviews = load(REVIEWS_FILE)
    .filter(r => String(r.menuId) === String(req.params.menuId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(publicReview);
  res.json(reviews);
};

exports.all = (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Admin required' });
  res.json(load(REVIEWS_FILE).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};

exports.myPending = (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });

  const reviews = load(REVIEWS_FILE);
  const menu = load(MENU_FILE);
  const phone = String(user.phone || '').replace(/\s+/g, '');
  const done = new Set(reviews.map(r => `${r.orderId}_${r.menuId}`));

  const pending = [];
  load(ORDERS_FILE)
    .filter(o => o.customerId === user.id || String(o.phone || o.customerPhone || '').replace(/\s+/g, '') === phone)
    .filter(o => ['ready', 'delivered'].includes(o.status))
    .forEach(o => {
      (o.items || []).forEach(item => {
        const key = `${o.id}_${item.id}`;
        if (done.has(key)) return;
        const mi = menu.find(m => String(m.id) === String(item.id));
        pending.push({
          orderId: o.id,
          menuId: item.id,
          itemName: item.name || mi?.name,
          itemEmoji: item.e || mi?.e,
        });
      });
    });

  res.json(pending.slice(0, 20));
};

exports.add = (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });

  const { menuId, orderId, rating, comment = '' } = req.body;
  const n = Number(rating);
  if (!menuId || !orderId || !Number.isInteger(n) || n < 1 || n > 5) {
    return res.status(400).json({ error: 'Invalid review' });
  }

  const reviews = load(REVIEWS_FILE);
  if (reviews.some(r => String(r.menuId) === String(menuId) && String(r.orderId) === String(orderId))) {
    return res.status(409).json({ error: 'Already reviewed' });
  }

  const review = {
    id: Date.now(),
    menuId,
    orderId,
    rating: n,
    comment: String(comment).slice(0, 400),
    userId: user.id,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(review);
  save(REVIEWS_FILE, reviews.slice(0, 2000));
  res.status(201).json(publicReview(review));
};

exports.remove = (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Admin required' });
  const reviews = load(REVIEWS_FILE);
  const next = reviews.filter(r => String(r.id) !== String(req.params.id));
  if (next.length === reviews.length) return res.status(404).json({ error: 'Not found' });
  save(REVIEWS_FILE, next);
  res.json({ ok: true });
};
