'use strict';
const jwt  = require('jsonwebtoken');
const fs   = require('fs');
const path = require('path');

const MENU_FILE  = path.join(__dirname, '../data/menu.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'sushi-riga-secret-2026';
const ADMIN_KEY  = process.env.ADMIN_SECRET || 'admin2026';

function loadMenu() { try { return JSON.parse(fs.readFileSync(MENU_FILE, 'utf8')); } catch { return []; } }
function saveMenu(m) { fs.writeFileSync(MENU_FILE, JSON.stringify(m, null, 2)); }
function loadUsers() { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return []; } }

function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  // Support both admin key and JWT admin role
  if (auth === `Bearer ${ADMIN_KEY}`) return next();
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Admin login with secret key
exports.adminLogin = (req, res) => {
  const { secret } = req.body;
  if (!secret || secret !== ADMIN_KEY) return res.status(401).json({ error: 'Wrong secret' });
  res.json({ token: ADMIN_KEY, role: 'admin' });
};

// Menu CRUD
exports.getMenu     = [authAdmin, (req, res) => res.json(loadMenu())];
exports.addItem     = [authAdmin, (req, res) => {
  const menu = loadMenu();
  const item = { ...req.body, id: Date.now() };
  menu.push(item);
  saveMenu(menu);
  res.status(201).json(item);
}];
exports.updateItem  = [authAdmin, (req, res) => {
  const menu = loadMenu();
  const idx  = menu.findIndex(i => i.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  menu[idx] = { ...menu[idx], ...req.body, id: menu[idx].id };
  saveMenu(menu);
  res.json(menu[idx]);
}];
exports.deleteItem  = [authAdmin, (req, res) => {
  let menu = loadMenu();
  const before = menu.length;
  menu = menu.filter(i => i.id != req.params.id);
  if (menu.length === before) return res.status(404).json({ error: 'Not found' });
  saveMenu(menu);
  res.json({ ok: true });
}];
exports.toggleHit   = [authAdmin, (req, res) => {
  const menu = loadMenu();
  const item = menu.find(i => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.hit = !item.hit;
  saveMenu(menu);
  res.json(item);
}];
exports.getStats    = [authAdmin, (req, res) => {
  const menu  = loadMenu();
  const users = loadUsers();
  res.json({ totalItems: menu.length, totalUsers: users.length, categories: [...new Set(menu.map(i => i.cat))].length });
}];

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');
function loadOrders() { try { return JSON.parse(require('fs').readFileSync(ORDERS_FILE,'utf8')); } catch { return []; } }

exports.getOrders   = [authAdmin, (req, res) => res.json(loadOrders())];
exports.updateOrder = [authAdmin, (req, res) => {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  orders[idx] = { ...orders[idx], ...req.body };
  require('fs').writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  res.json(orders[idx]);
}];
