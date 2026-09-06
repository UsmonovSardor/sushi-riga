'use strict';

const jwt = require('jsonwebtoken');
const { db, schema } = require('../db');
const { eq, and, or, inArray, desc, sql } = require('drizzle-orm');
const { reviews, orders, usersData } = schema;

const JWT_SECRET = process.env.JWT_SECRET;

async function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const [row] = await db.select().from(usersData)
      .where(eq(usersData.id, String(payload.id))).limit(1);
    return row || null;
  } catch {
    return null;
  }
}

function isAdmin(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
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
    menuId: row.menuId,
    orderId: row.orderId,
    userId: row.userId,
    rating: Number(row.rating),
    comment: row.comment || '',
    createdAt: row.createdAt,
  };
}

exports.summary = async (_req, res) => {
  try {
    const rows = await db.select({
      menuId: reviews.menuId,
      count: sql`count(*)::int`,
      avg: sql`round(avg(${reviews.rating})::numeric, 1)`,
    }).from(reviews).groupBy(reviews.menuId);

    const summary = {};
    rows.forEach(row => {
      summary[row.menuId] = {
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
    const rows = await db.select().from(reviews)
      .where(eq(reviews.menuId, String(req.params.menuId)))
      .orderBy(desc(reviews.createdAt)).limit(100);
    res.json(rows.map(publicReview));
  } catch (err) {
    console.error('reviews forMenu:', err.message);
    res.status(500).json({ error: 'Reviews load error' });
  }
};

exports.all = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Admin required' });
    const rows = await db.select().from(reviews)
      .orderBy(desc(reviews.createdAt)).limit(1000);
    res.json(rows.map(publicReview));
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

    const orderRows = await db.select({ orderId: orders.id, items: orders.items })
      .from(orders)
      .where(and(
        or(
          eq(orders.customerId, String(user.id)),
          sql`REGEXP_REPLACE(${orders.phone},'[^0-9]','','g') = ${phone}`,
          sql`REGEXP_REPLACE(${orders.customerPhone},'[^0-9]','','g') = ${phone}`,
        ),
        inArray(orders.status, ['ready', 'delivered']),
      ))
      .orderBy(desc(orders.createdAt)).limit(50);

    const done = await db.select({ orderId: reviews.orderId, menuId: reviews.menuId })
      .from(reviews).where(eq(reviews.userId, String(user.id)));

    const doneSet = new Set(done.map(x => `${x.orderId}_${x.menuId}`));
    const pending = [];

    orderRows.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach(item => {
        const menuId = String(item.id || item.menuId || item.productId || '');
        if (!menuId) return;
        const key = `${order.orderId}_${menuId}`;
        if (doneSet.has(key)) return;
        pending.push({
          orderId: order.orderId,
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

    const check = await db.select({ id: orders.id }).from(orders)
      .where(and(
        eq(orders.id, String(orderId)),
        eq(orders.customerId, String(user.id)),
        inArray(orders.status, ['ready', 'delivered']),
      )).limit(1);

    if (check.length === 0) {
      return res.status(403).json({ error: 'You can review only completed own orders' });
    }

    const [row] = await db.insert(reviews).values({
      id: String(Date.now()),
      menuId: String(menuId),
      orderId: String(orderId),
      userId: String(user.id),
      rating: n,
      comment: String(comment).slice(0, 400),
    }).returning();

    res.status(201).json(publicReview(row));
  } catch (err) {
    // Drizzle wraps the pg error, so the unique-violation code (23505) lands on
    // err.cause.code rather than err.code.
    if (err.code === '23505' || err.cause?.code === '23505') {
      return res.status(409).json({ error: 'Already reviewed' });
    }
    console.error('reviews add:', err.message);
    res.status(500).json({ error: 'Review add error' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Admin required' });
    const del = await db.delete(reviews).where(eq(reviews.id, String(req.params.id)))
      .returning({ id: reviews.id });
    if (del.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('reviews remove:', err.message);
    res.status(500).json({ error: 'Review delete error' });
  }
};
