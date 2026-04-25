'use strict';
const router = require('express').Router();
router.use('/menu',    require('./menu'));
router.use('/orders',  require('./orders'));
router.use('/auth',    require('./auth'));
router.use('/admin',   require('./admin'));
router.use('/payment', require('./payment'));
router.use('/reviews', require('./reviews'));
module.exports = router;
