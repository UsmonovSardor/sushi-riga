'use strict';
const config = require('../config');

async function post(method, body) {
  const fetch = (await import('node-fetch')).default;
  const r = await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return r.json();
}

exports.sendOrder = async ({ id, name, phone, note, items, total, payMethod, lang }) => {
  const now = new Date().toLocaleString('ru-RU', { timeZone:'Europe/Riga' });

  const payLabel = payMethod === 'card' ? '💳 Karta' : '💵 Naqd';

  const lines = (items || []).map(i => {
    const nm = (i.name && (i.name[lang] || i.name.lv || i.name.ru || i.name.en)) || String(i.id);
    return `  ${i.e || '🍣'} ${nm} × ${i.qty}  —  €${(i.price * i.qty).toFixed(2)}`;
  }).join('\n');

  const text = [
    `🍣 *SUSHI RĪGA — Zakaz #${id}*`,
    ``,
    `👤 *${name}*`,
    `📞 ${phone}`,
    note ? `💬 ${note}` : null,
    ``,
    `📦 *Buyurtma:*`,
    lines,
    ``,
    `💰 *JAMI: €${Number(total).toFixed(2)}*`,
    `${payLabel}`,
    ``,
    `🕐 ${now}`,
  ].filter(l => l !== null).join('\n');

  const r = await post('sendMessage', {
    chat_id: config.CHAT_ID,
    text,
    parse_mode: 'Markdown',
  });

  if (!r.ok) console.error('Telegram error:', r.description);
  return r;
};
