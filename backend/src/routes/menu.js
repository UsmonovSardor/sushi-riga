'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/menuController');
router.get('/', ctrl.getAll);
router.get('/category/:cat', ctrl.getByCategory);
router.get('/hits', ctrl.getHits);
module.exports = router;
