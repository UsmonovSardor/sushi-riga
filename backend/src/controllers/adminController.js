'use strict';

const jwt        = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { query }  = require('../db');

const JWT_SECRET = process.env.JWT_SECRET  || 'sushi-riga-secret-2026';
const ADMIN_KEY  = process.env.ADMIN_SECRET || 'admin2026';

function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  if (auth === `Bearer ${ADMIN_KEY}`) return next();
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function rowToItem(row) {
  return {
    id:    row.id,
    cat:   row.cat,
    e:     row.e,
    name:  row.name,
    desc:  row.description,
    price: parseFloat(row.price),
    old:   row.old_price != null ? parseFloat(row.old_price) : null,
    img:   row.img,
    hit:   row.hit,
  };
}

function rowToOrder(row) {
  return {
    id:            row.id,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
    name:          row.name,
    surname:       row.surname       || '',
    phone:         row.phone,
    note:          row.note          || '',
    address:       row.address       || '',
    items:         row.items         || [],
    total:         parseFloat(row.total),
    payMethod:     row.pay_method,
    lang:          row.lang,
    status:        row.status,
    statusHistory: row.status_history || [],
    customerId:    row.customer_id,
    customerPhone: row.customer_phone,
    readyAt:       row.ready_at      || null,
    deliveredAt:   row.delivered_at  || null,
  };
}

let _cache = null, _cacheAt = 0;
const CACHE_TTL = 60_000;
function invalidateCache() { _cache = null; _cacheAt = 0; }

exports.adminLogin = (req, res) => {
  const { secret } = req.body;
  if (!secret || secret !== ADMIN_KEY) return res.status(401).json({ error: 'Wrong secret' });
  res.json({ token: ADMIN_KEY, role: 'admin' });
};

exports.getStats = [authAdmin, async (_req, res) => {
  try {
    const [menuR, usersR, ordersR] = await Promise.all([
      query('SELECT COUNT(*)::int AS n FROM menu_items'),
      query('SELECT COUNT(*)::int AS n FROM users_data'),
      query('SELECT * FROM orders ORDER BY created_at DESC'),
    ]);
    const orders = ordersR.rows.map(rowToOrder);
    const now    = new Date(), today = now.toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => (o.createdAt || '').slice(0, 10) === today);
    const last7 = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dr  = orders.filter(o => (o.createdAt || '').slice(0, 10) === key && o.status !== 'cancelled');
      last7[key] = { orders: dr.length, revenue: dr.reduce((s, o) => s + (o.total || 0), 0) };
    }
    const byStatus = {}, byPay = {}, itemCount = {};
    orders.forEach(o => {
      byStatus[o.status || 'new']    = (byStatus[o.status || 'new']    || 0) + 1;
      byPay[o.payMethod || 'cash']   = (byPay[o.payMethod || 'cash']   || 0) + 1;
      (o.items || []).forEach(i => { const k = i.name?.ru || String(i.id); itemCount[k] = (itemCount[k] || 0) + (i.qty || 1); });
    });
    const topItems = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
    const catR = await query('SELECT DISTINCT cat FROM menu_items');
    res.json({
      totalOrders: orders.length,
      totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
      totalItems: menuR.rows[0].n, totalUsers: usersR.rows[0].n,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
      byStatus, byPay, last7, topItems, categories: catR.rows.length,
    });
  } catch (err) { console.error('getStats:', err.message); res.status(500).json({ error: 'Stats yuklanmadi' }); }
}];

exports.uploadImage = [authAdmin, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'No image data' });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)
      return res.status(500).json({ error: 'Cloudinary env missing' });
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    const result = await cloudinary.uploader.upload(base64, { folder: 'cherry-sushi/menu', resource_type: 'image', overwrite: false });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) { console.error('Cloudinary:', e); res.status(500).json({ error: e.message || 'Upload failed' }); }
}];

// ── MENU CRUD ──────────────────────────────────────────────────────────────────
exports.getMenu = [authAdmin, async (_req, res) => {
  try {
    if (_cache && Date.now() - _cacheAt < CACHE_TTL) return res.json(_cache);
    const r = await query('SELECT * FROM menu_items ORDER BY cat, created_at ASC');
    _cache = r.rows.map(rowToItem); _cacheAt = Date.now();
    res.json(_cache);
  } catch (err) { console.error('getMenu:', err.message); res.status(500).json({ error: 'Menyu yuklanmadi' }); }
}];

exports.addItem = [authAdmin, async (req, res) => {
  try {
    const { id, cat, e, name, desc, price, old, img, hit } = req.body;
    if (!cat || !name || price == null) return res.status(400).json({ error: 'cat, name, price majburiy' });
    const itemId = id ? String(id) : String(Date.now());
    const dup = await query('SELECT id FROM menu_items WHERE id=$1', [itemId]);
    if (dup.rows.length > 0) return res.status(409).json({ error: 'Bu ID allaqachon mavjud' });
    const r = await query(
      `INSERT INTO menu_items (id,cat,e,name,description,price,old_price,img,hit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [itemId, cat, e||'', JSON.stringify(name), JSON.stringify(desc||{}),
       parseFloat(price), old!=null?parseFloat(old):null, img||'', hit===true||hit==='true']
    );
    invalidateCache();
    res.status(201).json(rowToItem(r.rows[0]));
  } catch (err) { console.error('addItem:', err.message); res.status(500).json({ error: "Ovqat qo'shilmadi" }); }
}];

exports.updateItem = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { cat, e, name, desc, price, old, img, hit } = req.body;
    const cur = await query('SELECT * FROM menu_items WHERE id=$1', [id]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const c = cur.rows[0];
    const r = await query(
      `UPDATE menu_items SET cat=$1,e=$2,name=$3,description=$4,price=$5,old_price=$6,img=$7,hit=$8,updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [
        cat  !=null?cat             :c.cat,
        e    !=null?e               :c.e,
        name !=null?JSON.stringify(name):c.name,
        desc !=null?JSON.stringify(desc):c.description,
        price!=null?parseFloat(price):parseFloat(c.price),
        old!==undefined?(old!=null?parseFloat(old):null):c.old_price,
        img  !=null?img             :c.img,
        hit  !=null?(hit===true||hit==='true'):c.hit,
        id,
      ]
    );
    invalidateCache();
    res.json(rowToItem(r.rows[0]));
  } catch (err) { console.error('updateItem:', err.message); res.status(500).json({ error: 'Yangilanmadi' }); }
}];

exports.deleteItem = [authAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM menu_items WHERE id=$1 RETURNING id', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    invalidateCache();
    res.json({ ok: true });
  } catch (err) { console.error('deleteItem:', err.message); res.status(500).json({ error: "O'chirilmadi" }); }
}];

exports.toggleHit = [authAdmin, async (req, res) => {
  try {
    const cur = await query('SELECT hit FROM menu_items WHERE id=$1', [req.params.id]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = await query('UPDATE menu_items SET hit=$1,updated_at=NOW() WHERE id=$2 RETURNING *', [!cur.rows[0].hit, req.params.id]);
    invalidateCache();
    res.json(rowToItem(r.rows[0]));
  } catch (err) { console.error('toggleHit:', err.message); res.status(500).json({ error: 'Toggle xatosi' }); }
}];

// ── ORDERS (admin) ─────────────────────────────────────────────────────────────
exports.getOrders = [authAdmin, async (_req, res) => {
  try {
    const r = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000');
    res.json(r.rows.map(rowToOrder));
  } catch (err) { console.error('getOrders:', err.message); res.status(500).json({ error: 'Zakazlar yuklanmadi' }); }
}];

exports.updateOrder = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = req.body.status;
    const allowed = ['new','cooking','ready','delivered','cancelled'];
    if (!allowed.includes(nextStatus)) return res.status(400).json({ error: 'Invalid status' });
    const cur = await query('SELECT * FROM orders WHERE id=$1', [id]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const c = cur.rows[0], now = new Date().toISOString();
    const history     = [...(c.status_history||[]), { status: nextStatus, at: now, by: 'admin' }];
    const readyAt     = nextStatus==='ready'     && c.status!=='ready'     ? now : c.ready_at;
    const deliveredAt = nextStatus==='delivered' && c.status!=='delivered' ? now : c.delivered_at;
    const r = await query(
      `UPDATE orders SET status=$1,status_history=$2,ready_at=$3,delivered_at=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,
      [nextStatus, JSON.stringify(history), readyAt, deliveredAt, id]
    );
    res.json(rowToOrder(r.rows[0]));
  } catch (err) { console.error('updateOrder:', err.message); res.status(500).json({ error: 'Zakaz yangilanmadi' }); }
}];

exports.deleteOrder = [authAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM orders WHERE id=$1 RETURNING id', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { console.error('deleteOrder:', err.message); res.status(500).json({ error: "O'chirilmadi" }); }
}];

exports.deleteOrders = [authAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      const ph = ids.map((_, i) => `$${i+1}`).join(',');
      await query(`DELETE FROM orders WHERE id IN (${ph})`, ids.map(String));
    } else {
      await query('DELETE FROM orders');
    }
    const cnt = await query('SELECT COUNT(*)::int AS n FROM orders');
    res.json({ ok: true, remaining: cnt.rows[0].n });
  } catch (err) { console.error('deleteOrders:', err.message); res.status(500).json({ error: "O'chirilmadi" }); }
}];
