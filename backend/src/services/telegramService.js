'use strict';
const config = require('../config');

async function post(method, body) {
  const fetch = (await import('node-fetch')).default;
  const r = await fetch(
    `https://api.telegram.org/bot${config.BOT_TOKEN}/${method}`,
    { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }
  );
  return r.json();
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

exports.sendOrder = async ({ id, name, phone, note, items, total, payMethod, lang }) => {
  if (!config.BOT_TOKEN || !config.CHAT_ID) {
    console.log('Telegram not configured, skipping');
    return;
  }

  const now = new Date().toLocaleString('ru-RU', { timeZone:'Europe/Riga' });
  const payLabel = payMethod === 'card' ? '💳 Karta' : '💵 Naqd';

  const lines = (items || []).map(i => {
    const nm = esc((i.name && (i.name[lang] || i.name.lv || i.name.ru || i.name.en)) || String(i.id));
    return `  ${i.e||'🍒'} ${nm} × ${i.qty} — €${(i.price*i.qty).toFixed(2)}`;
  }).join('\n');

  const text = [
    `🍒 <b>Cherry Sushi — Zakaz #${id}</b>`,
    ``,
    `👤 <b>${esc(name)}</b>`,
    `📞 ${esc(phone)}`,
    note ? `💬 ${esc(note)}` : null,
    ``,
    `📦 <b>Buyurtma:</b>`,
    lines,
    ``,
    `💰 <b>JAMI: €${Number(total).toFixed(2)}</b>`,
    `${payLabel}`,
    ``,
    `🕐 ${now}`,
  ].filter(l => l !== null).join('\n');

  try {
    const r = await post('sendMessage', {
      chat_id: config.CHAT_ID,
      text,
      parse_mode: 'HTML',
    });
    if (!r.ok) {
      console.error('Telegram error:', r.description, '| chat_id:', config.CHAT_ID);
    } else {
      console.log('✅ Telegram sent, order #' + id);
    }
    return r;
  } catch(e) {
    console.error('Telegram fetch error:', e.message);
  }
};
