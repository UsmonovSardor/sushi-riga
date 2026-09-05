'use strict';

const jwt = require('jsonwebtoken');
const tg = require('../services/telegramService');
const { db, schema } = require('../db');
const { eq, inArray, desc, or, sql } = require('drizzle-orm');
const { t } = require('../utils/i18n');
const { orders, menuItems, usersData } = schema;

const JWT_SECRET = process.env.JWT_SECRET;

function normalizeName(name, fallback = 'Product') {
  if (name && typeof name === 'object') {
    return {
      ru: name.ru || name.lv || name.en || fallback,
      lv: name.lv || name.ru || name.en || fallback,
      en: name.en || name.lv || name.ru || fallback,
    };
  }
  return {
    ru: String(name || fallback),
    lv: String(name || fallback),
    en: String(name || fallback),
  };
}

function rowToPublicOrder(row) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    name: row.name,
    surname: row.surname || '',
    phone: row.phone,
    items: row.items || [],
    total: Number(row.total) || 0,
    payMethod: row.payMethod || 'cash',
    source: row.source || 'web',
    lang: row.lang || 'lv',
    status: row.status || 'new',
    statusHistory: row.statusHistory || [],
    readyAt: row.readyAt || null,
    deliveredAt: row.deliveredAt || null,
  };
}

async function getUserFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const [row] = await db.select().from(usersData)
      .where(eq(usersData.id, String(payload.id))).limit(1);
    if (!row) return null;
    // The user's fields (phone, name, telegram_id, …) live inside the `data`
    // JSONB column. Flatten them so callers can read user.phone directly.
    return { ...(row.data || {}), id: row.id };
  } catch {
    return null;
  }
}

exports.createOrder = async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    const {
      name, surname = '', phone, note = '', items, lang = 'lv',
      address = '', payMethod = 'cash',
    } = req.body;
    const pay = payMethod === 'card' ? 'card' : 'cash';

    // Channel is inferred server-side (not trusted from the client): a Telegram
    // Mini App user's record carries a telegram id; website/guest orders do not.
    const tgId = user?.telegramId || user?.telegram_id || null;
    const source = tgId ? 'tma' : 'web';

    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    if (items.length > 100) return res.status(400).json({ error: 'Too many items' });

    const ids = items
      .map(item => String(item.id || item.menuId || item.productId || ''))
      .filter(Boolean);

    const dbProducts = ids.length
      ? await db.select().from(menuItems).where(inArray(menuItems.id, ids))
      : [];

    const productMap = new Map(dbProducts.map(p => [String(p.id), p]));

    // Senior-level integrity: every line must map to a real menu item. Price and
    // name come from the DB (never trust client-sent values); qty is clamped 1..99.
    const enriched = [];
    for (const item of items) {
      const id = String(item.id || item.menuId || item.productId || '');
      const p = productMap.get(id);

      if (!p) {
        console.warn('Rejected order — unknown item id:', id || '(empty)');
        return res.status(400).json({ error: 'Some items are no longer available. Please refresh your cart.' });
      }

      const qty = Math.min(99, Math.max(1, Math.floor(Number(item.qty ?? item.quantity ?? 1)) || 1));
      enriched.push({
        id: p.id,
        e: p.e || '🍣',
        name: normalizeName(p.name, 'Product'),
        price: Number(p.price) || 0,
        qty,
      });
    }

    const total = enriched.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const num = String(Date.now() % 100000);
    const now = new Date();
    const statusHistory = [{ status: 'new', at: now.toISOString(), by: 'system' }];

    await db.insert(orders).values({
      id: num,
      name,
      surname,
      phone,
      note,
      address,
      items: enriched,
      total: String(total),
      payMethod: pay,
      lang,
      status: 'new',
      statusHistory,
      customerId: user?.id ? String(user.id) : null,
      customerPhone: user?.phone || phone,
      telegramId: tgId,
      source,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await tg.sendOrder({
        id: num, num, name, surname, phone, note, address,
        items: enriched, total, payMethod: pay, lang,
        status: 'new', statusHistory, createdAt: now.toISOString(),
      });
    } catch (e) {
      console.error('TG error:', e.message);
    }

    res.status(201).json({
      success: true,
      orderId: num,
      order: rowToPublicOrder({
        id: num, createdAt: now.toISOString(), name, surname, phone,
        items: enriched, total, payMethod: pay, source, lang,
        status: 'new', statusHistory, readyAt: null, deliveredAt: null,
      }),
    });
  } catch (e) {
    console.error('createOrder:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.getOrders = async (_req, res) => {
  try {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
    res.set('Cache-Control', 'no-store');
    res.json(rows.map(rowToPublicOrder));
  } catch (err) {
    console.error('getOrders:', err.message);
    res.status(500).json({ error: t('orders_load_failed', 'lv') });
  }
};

exports.getMyOrders = async (req, res) => {
  const lang = req.query.lang || 'lv';
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const phone = String(user.phone || '').replace(/[^\d]/g, '');

    const rows = await db.select().from(orders)
      .where(or(
        eq(orders.customerId, String(user.id)),
        sql`REGEXP_REPLACE(${orders.phone},'[^0-9]','','g') = ${phone}`,
        sql`REGEXP_REPLACE(${orders.customerPhone},'[^0-9]','','g') = ${phone}`,
      ))
      .orderBy(desc(orders.createdAt));

    res.set('Cache-Control', 'no-store');
    res.json(rows.map(rowToPublicOrder));
  } catch (err) {
    console.error('getMyOrders:', err.message);
    res.status(500).json({ error: t('orders_load_failed', lang) });
  }
};
