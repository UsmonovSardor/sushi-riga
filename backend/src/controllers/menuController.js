'use strict';
const menu = require('../data/menu.json');
exports.getAll        = (_req, res) => res.json(menu);
exports.getByCategory = (req, res) => {
  const items = menu.filter(i => i.cat === req.params.cat);
  if (!items.length) return res.status(404).json({ error: 'Category not found' });
  res.json(items);
};
exports.getHits = (_req, res) => res.json(menu.filter(i => i.hit));
