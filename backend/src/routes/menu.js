'use strict';
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const MENU_FILE = require('path').join(require('../config').DATA_PATH, 'menu.json');
const load = () => { try { return JSON.parse(fs.readFileSync(MENU_FILE,'utf8')); } catch { return []; } };

// No-cache headers for all menu routes
const noCache = (_, res, next) => {
  res.set('Cache-Control','no-store');
  next();
};

router.use(noCache);

router.get('/', (_, res) => res.json(load()));

router.get('/hits', (_, res) => {
  const menu = load();
  res.json(menu.filter(i => i.hit));
});

router.get('/category/:cat', (req, res) => {
  const menu = load();
  const cat = req.params.cat.toLowerCase();
  res.json(menu.filter(i => i.cat?.toLowerCase() === cat));
});

router.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json(load());
  const menu = load();
  res.json(menu.filter(i =>
    i.name?.ru?.toLowerCase().includes(q) ||
    i.name?.lv?.toLowerCase().includes(q) ||
    i.name?.en?.toLowerCase().includes(q) ||
    i.desc?.ru?.toLowerCase().includes(q)
  ));
});

module.exports = router;
