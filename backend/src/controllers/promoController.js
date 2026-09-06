'use strict';

const jwt = require('jsonwebtoken');
const { db, schema } = require('../db');
const { eq, and, or, isNull, lte, gte, asc, desc, sql } = require('drizzle-orm');
const { promos } = schema;

const JWT_SECRET = process.env.JWT_SECRET;

// Same admin gate the menu/order admin routes use: a JWT with role:'admin'
// (issued by adminLogin). The raw secret is never accepted as a bearer token.
function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function rowToPromo(row) {
  return {
    id: row.id,
    title: row.title || {},
    subtitle: row.subtitle || {},
    badge: row.badge || {},
    cta: row.cta || {},
    img: row.img || '',
    video: row.video || '',
    link: row.link || '',
    theme: row.theme || 'red',
    active: row.active !== false,
    sort: Number(row.sort) || 0,
    startsAt: row.startsAt || null,
    endsAt: row.endsAt || null,
  };
}

const asObj = v => (v && typeof v === 'object' ? v : {});

// ── PUBLIC: only active promos that are inside their schedule window ──
exports.getPublic = async (_req, res) => {
  try {
    const rows = await db.select().from(promos)
      .where(and(
        eq(promos.active, true),
        or(isNull(promos.startsAt), lte(promos.startsAt, sql`NOW()`)),
        or(isNull(promos.endsAt), gte(promos.endsAt, sql`NOW()`)),
      ))
      .orderBy(asc(promos.sort), desc(promos.createdAt));
    res.set('Cache-Control', 'no-store');
    res.json(rows.map(rowToPromo));
  } catch (err) {
    console.error('promos public:', err.message);
    res.status(500).json({ error: 'Promo yuklanmadi' });
  }
};

// ── ADMIN ──
exports.getAll = [authAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(promos)
      .orderBy(asc(promos.sort), desc(promos.createdAt));
    res.json(rows.map(rowToPromo));
  } catch (err) {
    console.error('promos all:', err.message);
    res.status(500).json({ error: 'Promo yuklanmadi' });
  }
}];

exports.create = [authAdmin, async (req, res) => {
  try {
    const { title, subtitle, badge, cta, img, video, link, theme, active, sort, startsAt, endsAt } = req.body;
    const [row] = await db.insert(promos).values({
      id: String(Date.now()),
      title: asObj(title),
      subtitle: asObj(subtitle),
      badge: asObj(badge),
      cta: asObj(cta),
      img: img || '',
      video: video || '',
      link: link || '',
      theme: theme || 'red',
      active: active !== false,
      sort: Number(sort) || 0,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
    }).returning();
    res.status(201).json(rowToPromo(row));
  } catch (err) {
    console.error('promo create:', err.message);
    res.status(500).json({ error: "Promo qo'shilmadi" });
  }
}];

exports.update = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [c] = await db.select().from(promos).where(eq(promos.id, id)).limit(1);
    if (!c) return res.status(404).json({ error: 'Not found' });
    const b = req.body;

    const [row] = await db.update(promos).set({
      title:    b.title !== undefined ? asObj(b.title) : c.title,
      subtitle: b.subtitle !== undefined ? asObj(b.subtitle) : c.subtitle,
      badge:    b.badge !== undefined ? asObj(b.badge) : c.badge,
      cta:      b.cta !== undefined ? asObj(b.cta) : c.cta,
      img:      b.img !== undefined ? b.img : c.img,
      video:    b.video !== undefined ? b.video : c.video,
      link:     b.link !== undefined ? b.link : c.link,
      theme:    b.theme !== undefined ? b.theme : c.theme,
      active:   b.active !== undefined ? (b.active !== false) : c.active,
      sort:     b.sort !== undefined ? Number(b.sort) || 0 : c.sort,
      startsAt: b.startsAt !== undefined ? (b.startsAt || null) : c.startsAt,
      endsAt:   b.endsAt !== undefined ? (b.endsAt || null) : c.endsAt,
      updatedAt: new Date(),
    }).where(eq(promos.id, id)).returning();
    res.json(rowToPromo(row));
  } catch (err) {
    console.error('promo update:', err.message);
    res.status(500).json({ error: 'Yangilanmadi' });
  }
}];

exports.remove = [authAdmin, async (req, res) => {
  try {
    const del = await db.delete(promos).where(eq(promos.id, req.params.id))
      .returning({ id: promos.id });
    if (del.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('promo delete:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];
