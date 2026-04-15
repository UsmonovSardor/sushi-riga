'use strict';
const { validationResult } = require('express-validator');
module.exports = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(422).json({ errors: e.array() });
  next();
};
