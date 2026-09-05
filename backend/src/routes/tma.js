'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/tmaController');
const { validate, schemas } = require('../validators');

router.post('/auth', validate(schemas.tmaAuth), ctrl.auth);
router.get('/config', ctrl.config);
router.post('/pay/invoice', validate(schemas.tmaInvoice), ctrl.invoice);

module.exports = router;
