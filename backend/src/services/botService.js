'use strict';

/* ============================================================
   Cherry Sushi customer-facing bot (raw Bot API over fetch).
   - /start  → welcome + "Open App" button (Mini App)
   - order status push → DM to the customer (order.telegram_id)
   - Telegram Payments → invoice link, pre_checkout, successful_payment
   Same brand bot also posts shop notifications (telegramService).
   ============================================================ */

const crypto = require('crypto');
const config = require('../config');
const { query } = require('../db');

const API = (method) => `https://api.telegram.org/bot${config.BOT_TOKEN}/${method}`;

async function call(method, body) {
  if (!config.BOT_TOKEN) return { ok: false, description: 'no token' };
  const fetch = (await import('node-fetch')).default;
  try {
    const r = await fetch(API(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    console.error(`bot ${method}:`, e.message);
    return { ok: false, description: e.message };
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Stable webhook secret (env override, else derived from token). */
function webhookSecret() {
  if (config.WEBHOOK_SECRET) return config.WEBHOOK_SECRET;
  if (!config.BOT_TOKEN) return '';
  return crypto.createHash('sha256').update(config.BOT_TOKEN).digest('hex').slice(0, 32);
}

/* ---------------- Localised copy ---------------- */
const T = {
  welcome: {
    ru: '🍣 <b>Добро пожаловать в Cherry Sushi!</b>\n\nСвежие роллы и сеты с доставкой по Риге. Нажмите кнопку ниже, чтобы открыть меню 👇',
    lv: '🍣 <b>Laipni lūdzam Cherry Sushi!</b>\n\nSvaigi suši ar piegādi Rīgā. Nospiediet pogu zemāk, lai atvērtu ēdienkarti 👇',
    en: '🍣 <b>Welcome to Cherry Sushi!</b>\n\nFresh rolls & sets delivered across Riga. Tap the button below to open the menu 👇',
  },
  openApp: { ru: '🍱 Открыть меню', lv: '🍱 Atvērt ēdienkarti', en: '🍱 Open menu' },
  status: {
    cooking: {
      ru: '👨‍🍳 Ваш заказ №{id} готовится!',
      lv: '👨‍🍳 Jūsu pasūtījums Nr.{id} tiek gatavots!',
      en: '👨‍🍳 Your order #{id} is being cooked!',
    },
    ready: {
      ru: '✅ Заказ №{id} готов и скоро будет у вас!',
      lv: '✅ Pasūtījums Nr.{id} ir gatavs un drīz būs pie jums!',
      en: '✅ Order #{id} is ready and on its way!',
    },
    delivered: {
      ru: '🛵 Заказ №{id} доставлен. Приятного аппетита! 🍣\nОцените блюда в приложении ⭐',
      lv: '🛵 Pasūtījums Nr.{id} piegādāts. Labu apetīti! 🍣\nNovērtējiet ēdienus lietotnē ⭐',
      en: '🛵 Order #{id} delivered. Enjoy! 🍣\nRate the dishes in the app ⭐',
    },
    cancelled: {
      ru: '❌ Заказ №{id} отменён. По вопросам напишите в поддержку.',
      lv: '❌ Pasūtījums Nr.{id} atcelts. Jautājumu gadījumā rakstiet atbalstam.',
      en: '❌ Order #{id} was cancelled. Contact support with any questions.',
    },
  },
  paid: {
    ru: '💳 Оплата заказа №{id} получена. Спасибо! 🙏',
    lv: '💳 Maksājums par pasūtījumu Nr.{id} saņemts. Paldies! 🙏',
    en: '💳 Payment for order #{id} received. Thank you! 🙏',
  },
};

const pick = (obj, lang) => obj[lang] || obj.ru;

/* ---------------- Public helpers ---------------- */

/** Register the Telegram webhook to this API instance. */
exports.setupWebhook = async () => {
  if (!config.BOT_TOKEN) {
    console.log('ℹ️  Bot token yo‘q — webhook o‘rnatilmadi');
    return;
  }
  if (!config.PUBLIC_URL) {
    console.log('ℹ️  PUBLIC_URL yo‘q — webhook o‘rnatilmadi');
    return;
  }
  const url = `${config.PUBLIC_URL}/api/bot/webhook`;
  const res = await call('setWebhook', {
    url,
    secret_token: webhookSecret(),
    allowed_updates: ['message', 'pre_checkout_query'],
    drop_pending_updates: false,
  });
  console.log(res.ok ? `🤖 Webhook → ${url}` : `⚠️  Webhook xato: ${res.description}`);
};

exports.webhookSecret = webhookSecret;

/** Send an order-status DM to the customer. */
exports.sendStatusUpdate = async (order, status) => {
  const chatId = order.telegram_id || order.telegramId;
  if (!chatId || !config.BOT_TOKEN) return;
  const tpl = T.status[status];
  if (!tpl) return;
  const lang = order.lang || 'ru';
  const text = pick(tpl, lang).replace('{id}', order.id);

  await call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: openAppKeyboard(lang),
  });
};

function openAppKeyboard(lang) {
  return {
    inline_keyboard: [[{ text: pick(T.openApp, lang), web_app: { url: config.TMA_URL } }]],
  };
}

/** Create a Telegram Payments invoice link for an existing order. */
exports.createInvoiceLink = async (order) => {
  if (!config.PROVIDER_TOKEN) {
    return { ok: false, description: 'payments_disabled' };
  }
  const lang = order.lang || 'ru';
  const title =
    lang === 'lv' ? `Pasūtījums Nr.${order.id}` : lang === 'en' ? `Order #${order.id}` : `Заказ №${order.id}`;
  const items = Array.isArray(order.items) ? order.items : [];
  const description = items
    .slice(0, 6)
    .map((i) => `${i.qty}× ${nameOf(i, lang)}`)
    .join(', ')
    .slice(0, 250) || 'Cherry Sushi';

  // Single total line (cents). EUR.
  const amount = Math.round(Number(order.total) * 100);

  const res = await call('createInvoiceLink', {
    title,
    description,
    payload: `order_${order.id}`,
    provider_token: config.PROVIDER_TOKEN,
    currency: 'EUR',
    prices: [{ label: 'Cherry Sushi', amount }],
    need_name: false,
    need_phone_number: false,
  });
  return res;
};

function nameOf(item, lang) {
  const n = item.name;
  if (!n) return '';
  if (typeof n === 'string') return n;
  return n[lang] || n.ru || n.lv || n.en || '';
}

/* ---------------- Webhook update handler ---------------- */
exports.handleUpdate = async (update) => {
  try {
    if (update.message) return await onMessage(update.message);
    if (update.pre_checkout_query) return await onPreCheckout(update.pre_checkout_query);
  } catch (e) {
    console.error('handleUpdate:', e.message);
  }
};

async function onMessage(msg) {
  // Successful payment confirmation
  if (msg.successful_payment) {
    return onSuccessfulPayment(msg);
  }

  const text = msg.text || '';
  const lang = (msg.from?.language_code || 'ru').slice(0, 2);

  if (text.startsWith('/start')) {
    await call('sendMessage', {
      chat_id: msg.chat.id,
      text: pick(T.welcome, lang),
      parse_mode: 'HTML',
      reply_markup: openAppKeyboard(lang),
    });
  }
}

async function onPreCheckout(q) {
  // Approve; final validation could re-check order total here.
  await call('answerPreCheckoutQuery', { pre_checkout_query_id: q.id, ok: true });
}

async function onSuccessfulPayment(msg) {
  const sp = msg.successful_payment;
  const payload = sp.invoice_payload || '';
  const orderId = payload.startsWith('order_') ? payload.slice(6) : null;
  if (!orderId) return;

  const chargeId = sp.provider_payment_charge_id || sp.telegram_payment_charge_id || '';

  const upd = await query(
    `UPDATE orders SET paid=true, provider_charge_id=$1, pay_method='card', updated_at=NOW()
     WHERE id=$2 RETURNING *`,
    [chargeId, orderId]
  );
  if (upd.rows.length === 0) return;

  const order = upd.rows[0];
  const lang = order.lang || 'ru';
  await call('sendMessage', {
    chat_id: msg.chat.id,
    text: pick(T.paid, lang).replace('{id}', orderId),
    parse_mode: 'HTML',
  });
}
