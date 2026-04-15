'use strict';
const menu = require('../data/menu.json');

exports.getAll = (_req, res) => res.json(menu);

exports.getHits = (_req, res) => res.json(menu.filter(i => i.hit));

exports.getByCategory = (req, res) => {
  const { cat } = req.params;
  const items = menu.filter(i => i.cat === cat);
  if (!items.length) return res.status(404).json({ error: `Category '${cat}' not found` });
  res.json(items);
};

exports.search = (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json(menu);
  const results = menu.filter(i =>
    i.name.en.toLowerCase().includes(q) ||
    i.name.ru.toLowerCase().includes(q) ||
    i.name.lv.toLowerCase().includes(q) ||
    i.desc.en.toLowerCase().includes(q)
  );
  res.json(results);
};
