'use strict';
const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/orderController');
const v = [
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('items.*.id').isInt(),
  body('items.*.qty').isInt({ min: 1 }),
];
router.post('/', v, ctrl.createOrder);
module.exports = router;
