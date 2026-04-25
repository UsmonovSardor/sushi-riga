'use strict';

const { query } = require('../db');

// DB → frontend format
function mapItem(row) {
  return {
    id: row.id,
    cat: row.cat,
    e: row.e,
    name: row.name,
    desc: row.description,
    price: parseFloat(row.price),
    old: row.old_price ? parseFloat(row.old_price) : null,
    img: row.img,
    hit: row.hit,
  };
}

// 🔥 GET ALL
exports.getAll = async (_req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM menu_items ORDER BY id DESC`);
    res.json(rows.map(mapItem));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
};

// 🔥 GET HITS
exports.getHits = async (_req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM menu_items WHERE hit = true`);
    res.json(rows.map(mapItem));
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
};

// 🔥 GET BY CATEGORY
exports.getByCategory = async (req, res) => {
  try {
    const { cat } = req.params;

    const { rows } = await query(
      `SELECT * FROM menu_items WHERE cat = $1`,
      [cat]
    );

    res.json(rows.map(mapItem));
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
};

// 🔥 SEARCH
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();

    const { rows } = await query(`SELECT * FROM menu_items`);

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
