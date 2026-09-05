'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { validate, schemas } = require('../validators');

router.get('/summary', ctrl.summary);
router.get('/my-pending', ctrl.myPending);
router.get('/all', ctrl.all);
router.get('/menu/:menuId', ctrl.forMenu);
router.post('/', validate(schemas.review), ctrl.add);
router.delete('/:id', ctrl.remove);

module.exports = router;
