'use strict';

// Customer-facing API messages in the site's three languages. The frontend
// shows `error` verbatim, so these must never fall back to a 4th language.
const M = {
  required_fields:    { lv: 'Vārds, uzvārds un tālrunis ir obligāti.', ru: 'Имя, фамилия и телефон обязательны.', en: 'Name, surname and phone are required.' },
  phone_required:     { lv: 'Nepieciešams tālruņa numurs.', ru: 'Требуется номер телефона.', en: 'Phone number required.' },
  phone_exists:       { lv: 'Šis numurs jau ir reģistrēts. Lūdzu, piesakieties.', ru: 'Этот номер уже зарегистрирован. Пожалуйста, войдите.', en: 'This number is already registered. Please log in.' },
  phone_not_found:    { lv: 'Šis numurs nav reģistrēts.', ru: 'Этот номер не зарегистрирован.', en: 'This number is not registered.' },
  bad_credentials:    { lv: 'Nepareizs vārds vai uzvārds.', ru: 'Неверное имя или фамилия.', en: 'Incorrect name or surname.' },
  server_error:       { lv: 'Servera kļūda. Lūdzu, mēģiniet vēlreiz.', ru: 'Ошибка сервера. Пожалуйста, попробуйте позже.', en: 'Server error. Please try again.' },
  orders_load_failed: { lv: 'Neizdevās ielādēt pasūtījumus.', ru: 'Не удалось загрузить заказы.', en: 'Failed to load orders.' },
};

// t('phone_exists', 'ru') → localized string; unknown lang → lv.
const t = (key, lang) => {
  const row = M[key];
  if (!row) return key;
  return row[lang] || row.lv;
};

module.exports = { t };
