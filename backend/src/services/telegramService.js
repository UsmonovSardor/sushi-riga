'use strict';
const config = require('../config');
const TG_BASE = () => `https://api.telegram.org/bot${config.BOT_TOKEN}`;

async function post(method, body) {
  const fetch = (await import('node-fetch')).default;
  const r = await fetch(`${TG_BASE()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

exports.sendOrder = async ({ name, phone, address, note, items, sub, del, lang }) => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  const lines = items.map(i =>
    `  - ${i.e} ${i.name[lang] || i.name.ru} x${i.qty}  EUR${(i.price*i.qty).toFixed(2)}`
  ).join('\n');
  const now   = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Riga' });
  const total = (sub + del).toFixed(2);

  const text = [
    `SUSHI RIGA - ZAKAZ #${num}`,
    `Ism: ${name}`,
    `Tel: ${phone}`,
    `Manzil: ${address}`,
    note ? `Izoh: ${note}` : null,
    ``,
    `Buyurtma:`,
    lines,
    ``,
    `Yetkazib berish: ${del === 0 ? 'Bepul' : 'EUR' + del.toFixed(2)}`,
    `JAMI: EUR${total}`,
    `Vaqt: ${now}`,
  ].filter(l => l !== null).join('\n');

  const r = await post('sendMessage', { chat_id: config.CHAT_ID, text });
  if (!r.ok) throw new Error('Telegram error: ' + r.description);
};
