'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/promoController');

router.get('/', ctrl.getPublic);

module.exports = router;
