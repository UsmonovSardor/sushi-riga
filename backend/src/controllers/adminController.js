'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { db, schema } = require('../db');
const { eq, desc, asc, inArray, sql } = require('drizzle-orm');
const bot = require('../services/botService');
const orderEvents = require('../services/orderEvents');
const { menuItems, orders, usersData } = schema;

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY = process.env.ADMIN_SECRET;

// Constant-time secret comparison (avoids leaking the secret via response timing).
function secretMatches(input) {
  if (!ADMIN_KEY || typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  // Admins present a short-lived JWT (role:'admin'), issued by adminLogin. The
  // raw ADMIN_SECRET is NEVER accepted as a bearer token — it only proves
  // identity once, at /admin/login, in exchange for a token.
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function rowToItem(row) {
  return {
    id: row.id,
    cat: row.cat,
    e: row.e,
    name: row.name,
    desc: row.description,
    price: parseFloat(row.price),
    old: row.oldPrice != null ? parseFloat(row.oldPrice) : null,
    img: row.img,
    hit: row.hit,
  };
}

function rowToOrder(row) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    name: row.name,
    surname: row.surname || '',
    phone: row.phone,
    note: row.note || '',
    address: row.address || '',
    items: row.items || [],
    total: parseFloat(row.total),
    payMethod: row.payMethod,
    source: row.source || 'web',
    lang: row.lang,
    status: row.status,
    statusHistory: row.statusHistory || [],
    customerId: row.customerId,
    customerPhone: row.customerPhone,
    readyAt: row.readyAt || null,
    deliveredAt: row.deliveredAt || null,
  };
}

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL = 60_000;

function invalidateCache() {
  _cache = null;
  _cacheAt = 0;
}

exports.adminLogin = (req, res) => {
  const { secret } = req.body;
  if (!secretMatches(secret)) {
    return res.status(401).json({ error: 'Wrong secret' });
  }
  // Exchange the secret for a short-lived admin JWT. The secret itself is never
  // sent back or stored client-side.
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: 'admin' });
};

exports.getStats = [authAdmin, async (_req, res) => {
  try {
    const [ordersRows, menuCount, usersCount] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1000),
      db.select({ n: sql`count(*)::int` }).from(menuItems),
      db.select({ n: sql`count(*)::int` }).from(usersData),
    ]);

    const list = ordersRows.map(rowToOrder);
    const today = new Date().toISOString().slice(0, 10);
    const getDateKey = v => (v ? new Date(v).toISOString().slice(0, 10) : '');

    const validOrders = list.filter(o => o.status !== 'cancelled');
    const todayOrders = validOrders.filter(o => getDateKey(o.createdAt) === today);

    const byStatus = {};
    const byPay = {};
    list.forEach(o => {
      byStatus[o.status || 'new'] = (byStatus[o.status || 'new'] || 0) + 1;
      byPay[o.payMethod || 'cash'] = (byPay[o.payMethod || 'cash'] || 0) + 1;
    });

    res.json({
      totalOrders: list.length,
      totalRevenue: validOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      totalItems: Number(menuCount[0].n) || 0,
      totalUsers: Number(usersCount[0].n) || 0,
      categories: 0,
      byStatus,
      byPay,
      last7: {},
      topItems: [],
    });
  } catch (err) {
    console.error('getStats:', err);
    res.status(500).json({ error: err.message || 'Stats yuklanmadi' });
  }
}];

// Full customer base: everyone who has ordered (keyed by phone, so guests count
// too) enriched with their registration profile.
exports.getCustomers = [authAdmin, async (_req, res) => {
  try {
    const [ordersRows, usersRows] = await Promise.all([
      db.select({
        name: orders.name, surname: orders.surname, phone: orders.phone,
        customerPhone: orders.customerPhone, address: orders.address,
        total: orders.total, status: orders.status, source: orders.source,
        createdAt: orders.createdAt,
      }).from(orders).orderBy(asc(orders.createdAt)),
      db.select({
        phoneNorm: usersData.phoneNorm, data: usersData.data, createdAt: usersData.createdAt,
      }).from(usersData),
    ]);

    const norm = v => String(v || '').replace(/[^\d]/g, '');
    const map = new Map();
    const ensure = (key) => {
      if (!map.has(key)) {
        map.set(key, {
          phone: '', name: '', surname: '', address: '', username: '',
          registered: false, registeredAt: null,
          ordersCount: 0, totalSpent: 0, firstOrder: null, lastOrder: null,
          webOrders: 0, tmaOrders: 0,
        });
      }
      return map.get(key);
    };

    // Orders are ASC, so the last write wins → latest name/surname/address.
    for (const o of ordersRows) {
      const raw = o.customerPhone || o.phone || '';
      const key = norm(raw);
      if (!key) continue;
      const c = ensure(key);
      c.phone = raw || c.phone;
      if (o.name) c.name = o.name;
      if (o.surname) c.surname = o.surname;
      if (o.address) c.address = o.address;
      c.ordersCount += 1;
      if (o.source === 'tma') c.tmaOrders += 1; else c.webOrders += 1;
      if (o.status !== 'cancelled') c.totalSpent += Number(o.total) || 0;
      const at = o.createdAt;
      if (!c.firstOrder || new Date(at) < new Date(c.firstOrder)) c.firstOrder = at;
      if (!c.lastOrder || new Date(at) > new Date(c.lastOrder)) c.lastOrder = at;
    }

    for (const u of usersRows) {
      const d = u.data || {};
      const key = u.phoneNorm || norm(d.phone);
      if (!key) continue;
      const c = ensure(key);
      c.registered = true;
      c.registeredAt = u.createdAt;
      if (d.name) c.name = d.name;
      if (d.surname) c.surname = d.surname;
      if (d.address) c.address = d.address;
      if (d.username) c.username = d.username;
      c.phone = c.phone || d.phone || '';
    }

    const customers = [...map.values()]
      .map(c => ({
        ...c,
        avgOrder: c.ordersCount ? c.totalSpent / c.ordersCount : 0,
        channel: c.tmaOrders > c.webOrders ? 'tma' : 'web',
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent || new Date(b.lastOrder || 0) - new Date(a.lastOrder || 0));

    res.json(customers);
  } catch (err) {
    console.error('getCustomers:', err.message);
    res.status(500).json({ error: 'Mijozlar yuklanmadi' });
  }
}];

exports.uploadImage = [authAdmin, async (req, res) => {
  try {
    const { base64, resourceType } = req.body;
    if (!base64) return res.status(400).json({ error: 'No image data' });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary env missing' });
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const isVideo = resourceType === 'video';
    const opts = isVideo
      ? { folder: 'cherry-sushi/hero', resource_type: 'video', overwrite: false }
      : { folder: 'cherry-sushi/menu', resource_type: 'image', overwrite: false,
          transformation: [{ width: 1400, height: 900, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }] };

    const result = await cloudinary.uploader.upload(base64, opts);
    res.json({ url: result.secure_url, publicId: result.public_id, resourceType: isVideo ? 'video' : 'image' });
  } catch (e) {
    console.error('Cloudinary:', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
}];

exports.getMenu = [authAdmin, async (_req, res) => {
  try {
    if (_cache && Date.now() - _cacheAt < CACHE_TTL) return res.json(_cache);

    const rows = await db.select().from(menuItems)
      .orderBy(asc(menuItems.cat), asc(menuItems.createdAt));

    _cache = rows.map(rowToItem);
    _cacheAt = Date.now();
    res.json(_cache);
  } catch (err) {
    console.error('getMenu:', err.message);
    res.status(500).json({ error: 'Menyu yuklanmadi' });
  }
}];

exports.addItem = [authAdmin, async (req, res) => {
  try {
    const { id, cat, e, name, desc: description, price, old, img, hit } = req.body;

    if (!cat || !name || price == null) {
      return res.status(400).json({ error: 'cat, name, price majburiy' });
    }

    const itemId = id ? String(id) : String(Date.now());

    const dup = await db.select({ id: menuItems.id }).from(menuItems)
      .where(eq(menuItems.id, itemId)).limit(1);
    if (dup.length > 0) {
      return res.status(409).json({ error: 'Bu ID allaqachon mavjud' });
    }

    const [row] = await db.insert(menuItems).values({
      id: itemId,
      cat,
      e: e || '',
      name,
      description: description || {},
      price: String(parseFloat(price)),
      oldPrice: old != null ? String(parseFloat(old)) : null,
      img: img || '',
      hit: hit === true || hit === 'true',
    }).returning();

    invalidateCache();
    res.status(201).json(rowToItem(row));
  } catch (err) {
    console.error('addItem:', err.message);
    res.status(500).json({ error: "Ovqat qo'shilmadi" });
  }
}];

exports.updateItem = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { cat, e, name, desc: description, price, old, img, hit } = req.body;

    const [c] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!c) return res.status(404).json({ error: 'Not found' });

    const [row] = await db.update(menuItems).set({
      cat:         cat != null ? cat : c.cat,
      e:           e != null ? e : c.e,
      name:        name != null ? name : c.name,
      description: description != null ? description : c.description,
      price:       price != null ? String(parseFloat(price)) : c.price,
      oldPrice:    old !== undefined ? (old != null ? String(parseFloat(old)) : null) : c.oldPrice,
      img:         img != null ? img : c.img,
      hit:         hit != null ? (hit === true || hit === 'true') : c.hit,
      updatedAt:   new Date(),
    }).where(eq(menuItems.id, id)).returning();

    invalidateCache();
    res.json(rowToItem(row));
  } catch (err) {
    console.error('updateItem:', err.message);
    res.status(500).json({ error: 'Yangilanmadi' });
  }
}];

exports.deleteItem = [authAdmin, async (req, res) => {
  try {
    const del = await db.delete(menuItems).where(eq(menuItems.id, req.params.id))
      .returning({ id: menuItems.id });
    if (del.length === 0) return res.status(404).json({ error: 'Not found' });

    invalidateCache();
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteItem:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];

exports.toggleHit = [authAdmin, async (req, res) => {
  try {
    const [cur] = await db.select({ hit: menuItems.hit }).from(menuItems)
      .where(eq(menuItems.id, req.params.id)).limit(1);
    if (!cur) return res.status(404).json({ error: 'Not found' });

    const [row] = await db.update(menuItems)
      .set({ hit: !cur.hit, updatedAt: new Date() })
      .where(eq(menuItems.id, req.params.id)).returning();

    invalidateCache();
    res.json(rowToItem(row));
  } catch (err) {
    console.error('toggleHit:', err.message);
    res.status(500).json({ error: 'Toggle xatosi' });
  }
}];

exports.getOrders = [authAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1000);
    res.json(rows.map(rowToOrder));
  } catch (err) {
    console.error('getOrders:', err.message);
    res.status(500).json({ error: 'Zakazlar yuklanmadi' });
  }
}];

exports.updateOrder = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = req.body.status;
    const allowed = ['new', 'cooking', 'ready', 'delivered', 'cancelled'];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [c] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!c) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    const history = [
      ...(c.statusHistory || []),
      { status: nextStatus, at: now.toISOString(), by: 'admin' },
    ];
    const readyAt = nextStatus === 'ready' && c.status !== 'ready' ? now : c.readyAt;
    const deliveredAt = nextStatus === 'delivered' && c.status !== 'delivered' ? now : c.deliveredAt;

    const [row] = await db.update(orders).set({
      status: nextStatus,
      statusHistory: history,
      readyAt,
      deliveredAt,
      updatedAt: now,
    }).where(eq(orders.id, id)).returning();

    // Push status update to the customer's Telegram (Mini App orders) and to any
    // open web SSE stream (instant status on the site — no polling wait).
    if (c.status !== nextStatus) {
      bot.sendStatusUpdate(row, nextStatus).catch(() => {});
      const evt = { type: 'status', orderId: row.id, status: nextStatus };
      if (row.customerId) orderEvents.publish(row.customerId, evt);
      if (row.telegramId && String(row.telegramId) !== String(row.customerId)) {
        orderEvents.publish(row.telegramId, evt);
      }
    }

    res.json(rowToOrder(row));
  } catch (err) {
    console.error('updateOrder:', err.message);
    res.status(500).json({ error: 'Zakaz yangilanmadi' });
  }
}];

exports.deleteOrder = [authAdmin, async (req, res) => {
  try {
    const del = await db.delete(orders).where(eq(orders.id, req.params.id))
      .returning({ id: orders.id });
    if (del.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteOrder:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];

exports.deleteOrders = [authAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      await db.delete(orders).where(inArray(orders.id, ids.map(String)));
    } else {
      await db.delete(orders);
    }
    const [{ n }] = await db.select({ n: sql`count(*)::int` }).from(orders);
    res.json({ ok: true, remaining: Number(n) });
  } catch (err) {
    console.error('deleteOrders:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];
