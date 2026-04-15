'use strict';
const express = require('express');
const router  = express.Router();
router.use('/menu',   require('./menu'));
router.use('/orders', require('./orders'));
module.exports = router;
