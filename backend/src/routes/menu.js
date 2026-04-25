'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db');

function mapItem(row) {
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

const noCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

router.use(noCache);

router.get('/', async (_req, res) => {
  try {
    const r = await query('SELECT * FROM menu_items ORDER BY created_at ASC');
    res.json(r.rows.map(mapItem));
  } catch (e) {
    console.error('menu all:', e.message);
    res.status(500).json({ error: 'Menu yuklanmadi' });
  }
});

router.get('/hits', async (_req, res) => {
  try {
    const r = await query('SELECT * FROM menu_items WHERE hit = true ORDER BY created_at ASC');
    res.json(r.rows.map(mapItem));
  } catch (e) {
    console.error('menu hits:', e.message);
    res.status(500).json({ error: 'Hits yuklanmadi' });
  }
});

router.get('/category/:cat', async (req, res) => {
  try {
    const cat = String(req.params.cat || '').toLowerCase();

    const r = await query(
      'SELECT * FROM menu_items WHERE LOWER(cat) = $1 ORDER BY created_at ASC',
      [cat]
    );

    res.json(r.rows.map(mapItem));
  } catch (e) {
    console.error('menu category:', e.message);
    res.status(500).json({ error: 'Category yuklanmadi' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = `%${String(req.query.q || '').toLowerCase()}%`;

    if (q === '%%') {
      const r = await query('SELECT * FROM menu_items ORDER BY created_at ASC');
      return res.json(r.rows.map(mapItem));
    }

    const r = await query(
      `
      SELECT * FROM menu_items
      WHERE
        LOWER(name::text) LIKE $1
        OR LOWER(description::text) LIKE $1
      ORDER BY created_at ASC
      `,
      [q]
    );

    res.json(r.rows.map(mapItem));
  } catch (e) {
    console.error('menu search:', e.message);
    res.status(500).json({ error: 'Search xatosi' });
  }
});

module.exports = router;
