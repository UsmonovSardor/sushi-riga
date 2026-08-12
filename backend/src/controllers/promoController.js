'use strict';

const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY = process.env.ADMIN_SECRET;

// Same admin gate the menu/order admin routes use.
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
    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,
  };
}

const asJson = v => (v && typeof v === 'object' ? JSON.stringify(v) : '{}');

// ── PUBLIC: only active promos that are inside their schedule window ──
exports.getPublic = async (_req, res) => {
  try {
    const r = await query(
      `SELECT * FROM promos
       WHERE active = true
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at   IS NULL OR ends_at   >= NOW())
       ORDER BY sort ASC, created_at DESC`
    );
    res.set('Cache-Control', 'no-store');
    res.json(r.rows.map(rowToPromo));
  } catch (err) {
    console.error('promos public:', err.message);
    res.status(500).json({ error: 'Promo yuklanmadi' });
  }
};

// ── ADMIN ──
exports.getAll = [authAdmin, async (_req, res) => {
  try {
    const r = await query('SELECT * FROM promos ORDER BY sort ASC, created_at DESC');
    res.json(r.rows.map(rowToPromo));
  } catch (err) {
    console.error('promos all:', err.message);
    res.status(500).json({ error: 'Promo yuklanmadi' });
  }
}];

exports.create = [authAdmin, async (req, res) => {
  try {
    const { title, subtitle, badge, cta, img, video, link, theme, active, sort, startsAt, endsAt } = req.body;
    const id = String(Date.now());
    const r = await query(
      `INSERT INTO promos (id, title, subtitle, badge, cta, img, video, link, theme, active, sort, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        id, asJson(title), asJson(subtitle), asJson(badge), asJson(cta),
        img || '', video || '', link || '', theme || 'red',
        active !== false, Number(sort) || 0,
        startsAt || null, endsAt || null,
      ]
    );
    res.status(201).json(rowToPromo(r.rows[0]));
  } catch (err) {
    console.error('promo create:', err.message);
    res.status(500).json({ error: "Promo qo'shilmadi" });
  }
}];

exports.update = [authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const cur = await query('SELECT * FROM promos WHERE id=$1', [id]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const c = cur.rows[0];
    const b = req.body;

    const r = await query(
      `UPDATE promos SET
         title=$1, subtitle=$2, badge=$3, cta=$4, img=$5, video=$6, link=$7, theme=$8,
         active=$9, sort=$10, starts_at=$11, ends_at=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [
        b.title !== undefined ? asJson(b.title) : c.title,
        b.subtitle !== undefined ? asJson(b.subtitle) : c.subtitle,
        b.badge !== undefined ? asJson(b.badge) : c.badge,
        b.cta !== undefined ? asJson(b.cta) : c.cta,
        b.img !== undefined ? b.img : c.img,
        b.video !== undefined ? b.video : c.video,
        b.link !== undefined ? b.link : c.link,
        b.theme !== undefined ? b.theme : c.theme,
        b.active !== undefined ? (b.active !== false) : c.active,
        b.sort !== undefined ? Number(b.sort) || 0 : c.sort,
        b.startsAt !== undefined ? (b.startsAt || null) : c.starts_at,
        b.endsAt !== undefined ? (b.endsAt || null) : c.ends_at,
        id,
      ]
    );
    res.json(rowToPromo(r.rows[0]));
  } catch (err) {
    console.error('promo update:', err.message);
    res.status(500).json({ error: 'Yangilanmadi' });
  }
}];

exports.remove = [authAdmin, async (req, res) => {
  try {
    const r = await query('DELETE FROM promos WHERE id=$1 RETURNING id', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('promo delete:', err.message);
    res.status(500).json({ error: "O'chirilmadi" });
  }
}];
