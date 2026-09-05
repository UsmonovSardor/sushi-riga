'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { validate, schemas } = require('../validators');
router.post('/register', validate(schemas.register), ctrl.register);
router.post('/login',    validate(schemas.login),    ctrl.login);
router.get('/me',        ctrl.me);
module.exports = router;
