'use strict';
const jwt  = require('jsonwebtoken');
const fs   = require('fs');
const path = require('path');

const MENU_FILE   = path.join(__dirname, '../data/menu.json');
const USERS_FILE  = path.join(__dirname, '../data/users.json');
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');
const JWT_SECRET  = process.env.JWT_SECRET  || 'sushi-riga-secret-2026';
const ADMIN_KEY   = process.env.ADMIN_SECRET || 'admin2026';

const load = f => { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return []; } };
const save = (f,d) => fs.writeFileSync(f, JSON.stringify(d,null,2));

function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error:'No token' });
  if (auth === `Bearer ${ADMIN_KEY}`) return next();
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.role !== 'admin') return res.status(403).json({ error:'Forbidden' });
    next();
  } catch { res.status(401).json({ error:'Invalid token' }); }
}

// Admin login
exports.adminLogin = (req, res) => {
  const { secret } = req.body;
  if (!secret || secret !== ADMIN_KEY) return res.status(401).json({ error:'Wrong secret' });
  res.json({ token: ADMIN_KEY, role:'admin' });
};

// ── STATS ──
exports.getStats = [authAdmin, (req, res) => {
  const menu   = load(MENU_FILE);
  const users  = load(USERS_FILE);
  const orders = load(ORDERS_FILE);

  const now   = new Date();
  const today = now.toISOString().slice(0,10);
  const todayOrders = orders.filter(o => o.createdAt?.slice(0,10) === today);

  // Revenue by day (last 7 days)
  const last7 = {};
  for (let i=6; i>=0; i--) {
    const d = new Date(now); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const dayOrders = orders.filter(o => o.createdAt?.slice(0,10) === key && o.status !== 'cancelled');
    last7[key] = { orders: dayOrders.length, revenue: dayOrders.reduce((s,o)=>s+(o.total||0),0) };
  }

  // Status breakdown
  const byStatus = {};
  orders.forEach(o => { byStatus[o.status||'new'] = (byStatus[o.status||'new']||0)+1; });

  // Payment methods
  const byPay = {};
  orders.forEach(o => { byPay[o.payMethod||'cash'] = (byPay[o.payMethod||'cash']||0)+1; });

  // Top items
  const itemCount = {};
  orders.forEach(o => o.items?.forEach(i => {
    const key = i.name?.ru || String(i.id);
    itemCount[key] = (itemCount[key]||0) + (i.qty||1);
  }));
  const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,qty])=>({name,qty}));

  res.json({
    totalOrders:   orders.length,
    totalRevenue:  orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.total||0),0),
    totalItems:    menu.length,
    totalUsers:    users.length,
    todayOrders:   todayOrders.length,
    todayRevenue:  todayOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.total||0),0),
    byStatus, byPay, last7, topItems,
    categories:    [...new Set(menu.map(i=>i.cat))].length,
  });
}];

// ── MENU ──
exports.getMenu    = [authAdmin, (_,res) => res.json(load(MENU_FILE))];
exports.addItem    = [authAdmin, (req,res) => {
  const menu = load(MENU_FILE);
  const item = { ...req.body, id: Date.now() };
  menu.push(item); save(MENU_FILE, menu);
  res.status(201).json(item);
}];
exports.updateItem = [authAdmin, (req,res) => {
  const menu = load(MENU_FILE);
  const idx  = menu.findIndex(i => i.id == req.params.id);
  if (idx===-1) return res.status(404).json({error:'Not found'});
  menu[idx] = { ...menu[idx], ...req.body, id: menu[idx].id };
  save(MENU_FILE, menu);
  res.json(menu[idx]);
}];
exports.deleteItem = [authAdmin, (req,res) => {
  let menu = load(MENU_FILE);
  const before = menu.length;
  menu = menu.filter(i => i.id != req.params.id);
  if (menu.length===before) return res.status(404).json({error:'Not found'});
  save(MENU_FILE, menu);
  res.json({ok:true});
}];
exports.toggleHit  = [authAdmin, (req,res) => {
  const menu = load(MENU_FILE);
  const item = menu.find(i => i.id == req.params.id);
  if (!item) return res.status(404).json({error:'Not found'});
  item.hit = !item.hit; save(MENU_FILE, menu);
  res.json(item);
}];

// ── ORDERS ──
exports.getOrders   = [authAdmin, (_,res) => res.json(load(ORDERS_FILE))];
exports.updateOrder = [authAdmin, (req,res) => {
  const orders = load(ORDERS_FILE);
  const idx    = orders.findIndex(o => o.id == req.params.id);
  if (idx===-1) return res.status(404).json({error:'Not found'});
  orders[idx] = { ...orders[idx], ...req.body };
  save(ORDERS_FILE, orders);
  res.json(orders[idx]);
}];
