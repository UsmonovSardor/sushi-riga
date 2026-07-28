'use strict';

const config = require('../config');

async function post(method, body) {
  const fetch = (await import('node-fetch')).default;

  const r = await fetch(
    `https://api.telegram.org/bot${config.BOT_TOKEN}/${method}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  return r.json();
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function discoverChatId() {
  try {
    const fetch = (await import('node-fetch')).default;

    const r = await fetch(
      `https://api.telegram.org/bot${config.BOT_TOKEN}/getUpdates?limit=100&offset=-100`
    );

    const data = await r.json();

    if (data.ok && data.result?.length > 0) {
      for (const update of data.result.reverse()) {
        const chat = update.message?.chat || update.channel_post?.chat;

        if (
          chat &&
          (chat.type === 'group' ||
            chat.type === 'supergroup' ||
            chat.type === 'channel')
        ) {
          console.log(`🔍 Auto-discovered chat_id: ${chat.id} (${chat.title})`);
          return String(chat.id);
        }
      }
    }
  } catch (e) {
    console.error('Auto-discover error:', e.message);
  }

  return null;
}

exports.sendOrder = async ({
  id,
  name,
  phone,
  note,
  address,
  items,
  total,
  payMethod,
  lang,
}) => {
  if (!config.BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not set, skipping');
    return;
  }

  let chatId = config.CHAT_ID;

  if (!chatId || (!chatId.startsWith('-') && chatId.length < 12)) {
    console.log('⚠️ TELEGRAM_CHAT_ID may be wrong, trying auto-discover...');
    const discovered = await discoverChatId();
    if (discovered) chatId = discovered;
  }

  if (!chatId) {
    console.log(
      '❌ No valid TELEGRAM_CHAT_ID found. Please set it in Railway variables.'
    );
    return;
  }

  const now = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Riga',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const payLabel = payMethod === 'card' ? '💳 Карта' : '💵 Наличные';

  const lines = (items || [])
    .map(i => {
      const nm = esc(
        (i.name && (i.name.ru || i.name.lv || i.name.en)) || String(i.id)
      );

      const qty = Number(i.qty || 1);
      const price = Number(i.price || 0);
      const sum = price * qty;

      return `  ${i.e || '🍒'} ${nm} × ${qty} — €${sum.toFixed(2)}`;
    })
    .join('\n');

  const text = [
    `🍒 <b>Cherry Sushi — Заказ #${id}</b>`,
    ``,
    `👤 <b>Клиент:</b> ${esc(name)}`,
    `📞 <b>Телефон:</b> ${esc(phone)}`,
    address ? `📍 <b>Адрес:</b> ${esc(address)}` : null,
    note ? `💬 <b>Комментарий:</b> ${esc(note)}` : null,
    ``,
    `📦 <b>Заказ:</b>`,
    lines || '—',
    ``,
    `💰 <b>Итого: €${Number(total || 0).toFixed(2)}</b>`,
    `${payLabel}`,
    ``,
    `🕐 ${now}`,
  ]
    .filter(l => l !== null)
    .join('\n');

  try {
    console.log(`📤 Sending Telegram to chat_id: ${chatId}`);

    const r = await post('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });

    if (!r.ok) {
      console.error('❌ Telegram error:', r.description, '| chat_id:', chatId);
      console.error(
        '💡 Fix: Set TELEGRAM_CHAT_ID to group ID, negative number like -1001234567890'
      );
    } else {
      console.log('✅ Telegram sent, order #' + id);
    }

    return r;
  } catch (e) {
    console.error('❌ Telegram fetch error:', e.message);
  }
};
