'use strict';

const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY = process.env.ADMIN_SECRET;

async function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const r = await query('SELECT * FROM users_data WHERE id=$1', [String(payload.id)]);
    return r.rows[0] || null;
  } catch {
    return null;
  }
}

function isAdmin(req) {
  const auth = req.headers.authorization || '';

  if (ADMIN_KEY && auth === `Bearer ${ADMIN_KEY}`) return true;

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function publicReview(row) {
  return {
    id: row.id,
    menuId: row.menu_id,
    orderId: row.order_id,
    userId: row.user_id,
    rating: Number(row.rating),
    comment: row.comment || '',
    createdAt: row.created_at,
  };
}

exports.summary = async (_req, res) => {
  try {
    const r = await query(`
      SELECT menu_id, COUNT(*)::int AS count, ROUND(AVG(rating)::numeric, 1) AS avg
      FROM reviews
      GROUP BY menu_id
    `);

    const summary = {};
    r.rows.forEach(row => {
      summary[row.menu_id] = {
        count: Number(row.count) || 0,
        avg: Number(row.avg) || 0,
      };
    });

    res.json(summary);
  } catch (err) {
    console.error('reviews summary:', err.message);
    res.status(500).json({ error: 'Reviews summary error' });
  }
};

exports.forMenu = async (req, res) => {
  try {
    const r = await query(
      `SELECT * FROM reviews
       WHERE menu_id=$1
       ORDER BY created_at DESC
       LIMIT 100`,
      [String(req.params.menuId)]
    );

    res.json(r.rows.map(publicReview));
  } catch (err) {
    console.error('reviews forMenu:', err.message);
    res.status(500).json({ error: 'Reviews load error' });
  }
};

exports.all = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Admin required' });

    const r = await query(`
      SELECT * FROM reviews
      ORDER BY created_at DESC
      LIMIT 1000
    `);

    res.json(r.rows.map(publicReview));
  } catch (err) {
    console.error('reviews all:', err.message);
    res.status(500).json({ error: 'Reviews admin load error' });
  }
};

exports.myPending = async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const userData = user.data || {};
    const phone = String(userData.phone || '').replace(/[^\d]/g, '');

    const r = await query(
      `
      SELECT o.id AS order_id, o.items
      FROM orders o
      WHERE (
        o.customer_id=$1
        OR REGEXP_REPLACE(o.phone,'[^0-9]','','g')=$2
        OR REGEXP_REPLACE(o.customer_phone,'[^0-9]','','g')=$2
      )
      AND o.status IN ('ready', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT 50
      `,
      [String(user.id), phone]
    );

    const done = await query(
      `SELECT order_id, menu_id FROM reviews WHERE user_id=$1`,
      [String(user.id)]
    );

    const doneSet = new Set(done.rows.map(x => `${x.order_id}_${x.menu_id}`));
    const pending = [];

    r.rows.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];

      items.forEach(item => {
        const menuId = String(item.id || item.menuId || item.productId || '');
        if (!menuId) return;

        const key = `${order.order_id}_${menuId}`;
        if (doneSet.has(key)) return;

        pending.push({
          orderId: order.order_id,
          menuId,
          itemName:
            typeof item.name === 'object'
              ? item.name.ru || item.name.lv || item.name.en
              : item.name || 'Product',
          itemEmoji: item.e || '🍣',
        });
      });
    });

    res.json(pending.slice(0, 20));
  } catch (err) {
    console.error('reviews myPending:', err.message);
    res.status(500).json({ error: 'Pending reviews error' });
  }
};

exports.add = async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const { menuId, orderId, rating, comment = '' } = req.body;
    const n = Number(rating);

    if (!menuId || !orderId || !Number.isInteger(n) || n < 1 || n > 5) {
      return res.status(400).json({ error: 'Invalid review' });
    }

    const check = await query(
      `
      SELECT id FROM orders
      WHERE id=$1
        AND customer_id=$2
        AND status IN ('ready', 'delivered')
      LIMIT 1
      `,
      [String(orderId), String(user.id)]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'You can review only completed own orders' });
    }

    const id = String(Date.now());

    const r = await query(
      `
      INSERT INTO reviews (id, menu_id, order_id, user_id, rating, comment, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
      `,
      [
        id,
        String(menuId),
        String(orderId),
        String(user.id),
        n,
        String(comment).slice(0, 400),
      ]
    );

    res.status(201).json(publicReview(r.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already reviewed' });
    }

    console.error('reviews add:', err.message);
    res.status(500).json({ error: 'Review add error' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Admin required' });

    const r = await query(
      `DELETE FROM reviews WHERE id=$1 RETURNING id`,
      [String(req.params.id)]
    );

    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    res.json({ ok: true });
  } catch (err) {
    console.error('reviews remove:', err.message);
    res.status(500).json({ error: 'Review delete error' });
  }
};
