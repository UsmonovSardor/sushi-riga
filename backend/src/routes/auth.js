'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { validate, schemas } = require('../validators');
const { authLimiter } = require('../middleware/rateLimiters');
router.post('/register', authLimiter, validate(schemas.register), ctrl.register);
router.post('/login',    authLimiter, validate(schemas.login),    ctrl.login);
router.get('/me',        ctrl.me);
module.exports = router;
