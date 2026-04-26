'use strict';

const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY = process.env.ADMIN_SECRET;

function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });

  if (ADMIN_KEY && auth === `Bearer ${ADMIN_KEY}`) return next();

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
    old: row.old_price != null ? parseFloat(row.old_price) : null,
    img: row.img,
    hit: row.hit,
  };
}

function rowToOrder(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    surname: row.surname || '',
    phone: row.phone,
    note: row.note || '',
    address: row.address || '',
    items: row.items || [],
    total: parseFloat(row.total),
    payMethod: row.pay_method,
    lang: row.lang,
    status: row.status,
    statusHistory: row.status_history || [],
    customerId: row.customer_id,
    customerPhone: row.customer_phone,
    readyAt: row.ready_at || null,
    deliveredAt: row.delivered_at || null,
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

  if (!secret || secret !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Wrong secret' });
  }

  res.json({ token: ADMIN_KEY, role: 'admin' });
};

exports.getStats = [authAdmin, async (_req, res) => {
  try {
    const [
      totalR,
      todayR,
      menuR,
      usersR,
      statusR,
      payR,
      catR,
      last7R,
      topItemsR,
    ] = await Promise.all([
      query(`
        SELECT 
          COUNT(*)::int AS total_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0)::float AS total_revenue
        FROM orders
      `),

      query(`
        SELECT 
          COUNT(*)::int AS today_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0)::float AS today_revenue
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'Europe/Riga') = DATE(NOW() AT TIME ZONE 'Europe/Riga')
      `),

      query(`SELECT COUNT(*)::int AS n FROM menu_items`),
      query(`SELECT COUNT(*)::int AS n FROM users_data`),

      query(`
        SELECT status, COUNT(*)::int AS n
        FROM orders
        GROUP BY status
      `),

      query(`
        SELECT pay_method, COUNT(*)::int AS n
        FROM orders
        GROUP BY pay_method
      `),

      query(`SELECT COUNT(DISTINCT cat)::int AS n FROM menu_items`),

      query(`
        SELECT 
          TO_CHAR(d.day, 'YYYY-MM-DD') AS day,
          COUNT(o.id)::int AS orders,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0)::float AS revenue
        FROM generate_series(
          DATE(NOW() AT TIME ZONE 'Europe/Riga') - INTERVAL '6 days',
          DATE(NOW() AT TIME ZONE 'Europe/Riga'),
          INTERVAL '1 day'
        ) d(day)
        LEFT JOIN orders o 
          ON DATE(o.created_at AT TIME ZONE 'Europe/Riga') = d.day
        GROUP BY d.day
        ORDER BY d.day
      `),

      query(`
        SELECT 
          COALESCE(item->'name'->>'ru', item->>'name', item->>'id', 'Product') AS name,
          SUM(COALESCE((item->>'qty')::int, 1))::int AS qty
        FROM orders,
        LATERAL jsonb_array_elements(items::jsonb) AS item
        WHERE status != 'cancelled'
        GROUP BY name
        ORDER BY qty DESC
        LIMIT 5
      `),
    ]);

    const byStatus = {};
    statusR.rows.forEach(r => {
      byStatus[r.status || 'new'] = Number(r.n) || 0;
    });

    const byPay = {};
    payR.rows.forEach(r => {
      byPay[r.pay_method || 'cash'] = Number(r.n) || 0;
    });

    const last7 = {};
    last7R.rows.forEach(r => {
      last7[r.day] = {
        orders: Number(r.orders) || 0,
        revenue: Number(r.revenue) || 0,
      };
    });

    const topItems = topItemsR.rows.map(r => ({
      name: r.name,
      qty: Number(r.qty) || 0,
    }));

    res.json({
      totalOrders: Number(totalR.rows[0].total_orders) || 0,
      totalRevenue: Number(totalR.rows[0].total_revenue) || 0,
      todayOrders: Number(todayR.rows[0].today_orders) || 0,
      todayRevenue: Number(todayR.rows[0].today_revenue) || 0,
      totalItems: Number(menuR.rows[0].n) || 0,
      totalUsers: Number(usersR.rows[0].n) || 0,
      categories: Number(catR.rows[0].n) || 0,
      byStatus,
      byPay,
      last7,
      topItems,
    });
  } catch (err) {
    console.error('getStats:', err.message);
    res.status(500).json({ error: 'Stats yuklanmadi' });
  }
}];

exports.uploadImage = [authAdmin, async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) return res.status(400).json({ error: 'No image data' });

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({ error: 'Cloudinary env missing' });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'cherry-sushi/menu',
      resource_type: 'image',
      overwrite: false,
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    console.error('Cloudinary:', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
}];

exports.getMenu = [authAdmin, async (_req, res) => {
  try {
    if (_cache && Date.now() - _cacheAt < CACHE_TTL) return res.json(_cache);

    const r = await query('SELECT * FROM menu_items ORDER BY cat, created_at ASC');

    _cache = r.rows.map(rowToItem);
    _cacheAt = Date.now();

    res.json(_cache);
  } catch (err) {
    console.error('getMenu:', err.message);
    res.status(500).json({ error: 'Menyu yuklanmadi' });
  }
}];

exports.addItem = [authAdmin, async (req, res) => {
  try {
    const { id, cat, e, name, desc, price, old, img, hit } = req.body;

    if (!cat || !name || price == null) {
      return res.status(400).json({ error: 'cat, name, price majburiy' });
    }

    const itemId = id ? String(id) : String(Date.now());

    const dup = await query('SELECT id FROM menu_items WHERE id=$1', [itemId]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'Bu ID allaqachon mavjud' });
    }

    const r = await query(
      `INSERT INTO menu_items (id, cat, e, name, description, price, old_price, img, hit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        itemId,
        cat,
        e || '',
        JSON.stringify(name),
        JSON.stringify(desc || {}),
        parseFloat(price),
        old != null ? parseFloat(old) : null,
        img || '',
        hit === true || hit === 'true',
      ]
    );

    invalidateCache();
    res.status(201).json(rowToItem(r.rows[0]));
  } catch (err) {
    console.error('addItem:', err.message);
    res.status(500).json({ error: "Ovqat qo'shilmadi" });
  }
}];

exports.updateItem = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { cat, e, name, desc, price, old, img, hit } = req.body;

    const cur = await query('SELECT * FROM menu_items WHERE id=$1', [id]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const c = cur.rows[0];

    const r = await query(
      `UPDATE menu_items 
       SET cat=$1, e=$2, name=$3, description=$4, price=$5, old_price=$6, img=$7, hit=$8, updated_at=NOW()
       WHERE id=$9
       RETURNING *`,
      [
        cat != null ? cat : c.cat,
        e != null ? e : c.e,
        name != null ? JSON.stringify(name) : c.name,
        desc != null ? JSON.stringify(desc) : c.description,
        price != null ? parseFloat(price) : parseFloat(c.price),
        old !== undefined ? (old != null ? parseFloat(old) : null) : c.old_price,
        img != null ? img : c.img,
        hit != null ? (hit === true || hit === 'true') : c.hit,
        id,
      ]
    );

    invalidateCache();
    res.json(rowToItem(r.rows[0]));
  } catch (err) {
    console.error('updateItem:', err.message);
    res.status(500).json({ error: 'Yangilanmadi' });
  }
}];

exports.deleteItem = [authAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM menu_items WHERE id=$1 RETURNING id', [req.params.id]);

    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    invalidateCache();
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteItem:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];

exports.toggleHit = [authAdmin, async (req, res) => {
  try {
    const cur = await query('SELECT hit FROM menu_items WHERE id=$1', [req.params.id]);

    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const r = await query(
      'UPDATE menu_items SET hit=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [!cur.rows[0].hit, req.params.id]
    );

    invalidateCache();
    res.json(rowToItem(r.rows[0]));
  } catch (err) {
    console.error('toggleHit:', err.message);
    res.status(500).json({ error: 'Toggle xatosi' });
  }
}];

exports.getOrders = [authAdmin, async (_req, res) => {
  try {
    const r = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000');
    res.json(r.rows.map(rowToOrder));
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

    const cur = await query('SELECT * FROM orders WHERE id=$1', [id]);

    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const c = cur.rows[0];
    const now = new Date().toISOString();

    const history = [
      ...(c.status_history || []),
      { status: nextStatus, at: now, by: 'admin' },
    ];

    const readyAt = nextStatus === 'ready' && c.status !== 'ready' ? now : c.ready_at;
    const deliveredAt = nextStatus === 'delivered' && c.status !== 'delivered' ? now : c.delivered_at;

    const r = await query(
      `UPDATE orders 
       SET status=$1, status_history=$2, ready_at=$3, delivered_at=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING *`,
      [nextStatus, JSON.stringify(history), readyAt, deliveredAt, id]
    );

    res.json(rowToOrder(r.rows[0]));
  } catch (err) {
    console.error('updateOrder:', err.message);
    res.status(500).json({ error: 'Zakaz yangilanmadi' });
  }
}];

exports.deleteOrder = [authAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM orders WHERE id=$1 RETURNING id', [req.params.id]);

    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });

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
      const ph = ids.map((_, i) => `$${i + 1}`).join(',');
      await query(`DELETE FROM orders WHERE id IN (${ph})`, ids.map(String));
    } else {
      await query('DELETE FROM orders');
    }

    const cnt = await query('SELECT COUNT(*)::int AS n FROM orders');
    res.json({ ok: true, remaining: cnt.rows[0].n });
  } catch (err) {
    console.error('deleteOrders:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];
