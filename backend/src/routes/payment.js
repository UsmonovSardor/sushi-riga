'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');

router.post('/create-intent', ctrl.createIntent);
router.post('/webhook',       express.raw({ type: 'application/json' }), ctrl.webhook);
module.exports = router;
