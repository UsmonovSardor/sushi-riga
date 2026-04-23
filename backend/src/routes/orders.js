'use strict';
const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/orderController');

const v = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('phone').trim().notEmpty().withMessage('Phone required'),
  body('items').isArray({ min: 1 }).withMessage('Cart is empty'),
];

router.post('/',   v, ctrl.createOrder);
router.get('/',    ctrl.getOrders);
module.exports = router;

router.get('/my', ctrl.getMyOrders);
