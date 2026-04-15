'use strict';
const { validationResult } = require('express-validator');
const tg   = require('../services/telegramService');
const menu = require('../data/menu.json');

exports.createOrder = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const { name, phone, address, note, items, lang = 'ru' } = req.body;
  const enriched = items.map(({ id, qty }) => {
    const p = menu.find(m => m.id === id);
    if (!p) throw new Error('Product not found: ' + id);
    return { ...p, qty };
  });
  const sub = enriched.reduce((s, i) => s + i.price * i.qty, 0);
  const del = sub >= 25 ? 0 : 2;
  try {
    await tg.sendOrder({ name, phone, address, note, items: enriched, sub, del, lang });
    res.status(201).json({ success: true });
  } catch (err) { next(err); }
};
