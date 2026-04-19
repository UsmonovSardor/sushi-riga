import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const PROMOS = [
  { icon:'🚀', text:{ ru:'Доставка за 30-45 минут', en:'Delivery in 30-45 minutes', lv:'Piegāde 30-45 minūtēs' } },
  { icon:'🎁', text:{ ru:'Бесплатная доставка от €25', en:'Free delivery from €25', lv:'Bezmaksas piegāde no €25' } },
  { icon:'⭐', text:{ ru:'Свежие роллы каждый день', en:'Fresh rolls every day', lv:'Svaigas ruletes katru dienu' } },
  { icon:'📞', text:{ ru:'Заказ по телефону: +371 XX XXX XXX', en:'Order by phone: +371 XX XXX XXX', lv:'Pasūtīt pa tālruni: +371 XX XXX XXX' } },
];

export default function PromoBar() {
  const { lang }   = useLanguage();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % PROMOS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="promo-bar">
      <div className="promo-bar-inner" key={idx}>
        <span className="promo-bar-icon">{PROMOS[idx].icon}</span>
        <span className="promo-bar-text">{PROMOS[idx].text[lang] || PROMOS[idx].text.ru}</span>
      </div>
    </div>
  );
}
