'use strict';

const express = require('express');
const router = express.Router();
const { db, schema } = require('../db');
const { eq, asc, sql } = require('drizzle-orm');
const { menuItems } = schema;

function mapItem(row) {
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

const noCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

router.use(noCache);

router.get('/', async (_req, res) => {
  try {
    const rows = await db.select().from(menuItems).orderBy(asc(menuItems.createdAt));
    res.json(rows.map(mapItem));
  } catch (e) {
    console.error('menu all:', e.message);
    res.status(500).json({ error: 'Menu yuklanmadi' });
  }
});

router.get('/hits', async (_req, res) => {
  try {
    const rows = await db.select().from(menuItems)
      .where(eq(menuItems.hit, true)).orderBy(asc(menuItems.createdAt));
    res.json(rows.map(mapItem));
  } catch (e) {
    console.error('menu hits:', e.message);
    res.status(500).json({ error: 'Hits yuklanmadi' });
  }
});

router.get('/category/:cat', async (req, res) => {
  try {
    const cat = String(req.params.cat || '').toLowerCase();
    const rows = await db.select().from(menuItems)
      .where(sql`LOWER(${menuItems.cat}) = ${cat}`).orderBy(asc(menuItems.createdAt));
    res.json(rows.map(mapItem));
  } catch (e) {
    console.error('menu category:', e.message);
    res.status(500).json({ error: 'Category yuklanmadi' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const raw = String(req.query.q || '').toLowerCase();

    if (!raw) {
      const rows = await db.select().from(menuItems).orderBy(asc(menuItems.createdAt));
      return res.json(rows.map(mapItem));
    }

    const like = `%${raw}%`;
    const rows = await db.select().from(menuItems)
      .where(sql`LOWER(${menuItems.name}::text) LIKE ${like} OR LOWER(${menuItems.description}::text) LIKE ${like}`)
      .orderBy(asc(menuItems.createdAt));
    res.json(rows.map(mapItem));
  } catch (e) {
    console.error('menu search:', e.message);
    res.status(500).json({ error: 'Search xatosi' });
  }
});

module.exports = router;
