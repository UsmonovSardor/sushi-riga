'use strict';
const router = require('express').Router();
const bot = require('../services/botService');

// Telegram webhook. Verified via secret token header.
router.post('/webhook', async (req, res) => {
  const secret = req.get('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== bot.webhookSecret()) {
    return res.sendStatus(401);
  }
  // Respond immediately; process asynchronously.
  res.sendStatus(200);
  bot.handleUpdate(req.body).catch(() => {});
});

module.exports = router;
