'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
router.post('/login',          ctrl.adminLogin);
router.get('/stats',           ctrl.getStats);
router.get('/menu',            ctrl.getMenu);
router.post('/menu',           ctrl.addItem);
router.put('/menu/:id',        ctrl.updateItem);
router.delete('/menu/:id',     ctrl.deleteItem);
router.patch('/menu/:id/hit',  ctrl.toggleHit);
module.exports = router;

router.get('/orders',        ctrl.getOrders);
router.patch('/orders/:id',  ctrl.updateOrder);
