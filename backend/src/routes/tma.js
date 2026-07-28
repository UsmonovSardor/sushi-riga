'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/tmaController');

router.post('/auth', ctrl.auth);
router.get('/config', ctrl.config);
router.post('/pay/invoice', ctrl.invoice);

module.exports = router;
