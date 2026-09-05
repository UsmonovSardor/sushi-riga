'use strict';

const { db, schema } = require('../db');
const { eq } = require('drizzle-orm');
const { menuItems } = schema;

// DB → frontend format
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

// 🔥 GET ALL
exports.getAll = async (_req, res) => {
  try {
    const rows = await db.select().from(menuItems).orderBy(menuItems.id);
    res.json(rows.reverse().map(mapItem)); // id DESC
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
};

// 🔥 GET HITS
exports.getHits = async (_req, res) => {
  try {
    const rows = await db.select().from(menuItems).where(eq(menuItems.hit, true));
    res.json(rows.map(mapItem));
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
};

// 🔥 GET BY CATEGORY
exports.getByCategory = async (req, res) => {
  try {
    const rows = await db.select().from(menuItems).where(eq(menuItems.cat, req.params.cat));
    res.json(rows.map(mapItem));
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
};

// 🔥 SEARCH
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const rows = await db.select().from(menuItems);

    const filtered = rows.filter(r => {
      const name = JSON.stringify(r.name).toLowerCase();
      const desc = JSON.stringify(r.description).toLowerCase();
      return name.includes(q) || desc.includes(q);
    });

    res.json(filtered.map(mapItem));
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
};
