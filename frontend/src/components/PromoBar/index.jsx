import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const PROMOS = {
  lv: [
    { icon:'🍒', text:'Cherry Sushi — Svaigi suši Rīgā!' },
    { icon:'📍', text:'Lokomotīves iela 100, Rīga' },
    { icon:'🕐', text:'Katru dienu: 11:00 – 22:00' },
    { icon:'📞', text:'+371 20 918 484' },
    { icon:'🎁', text:'Sēti ar atlaidi līdz 30%' },
  ],
  ru: [
    { icon:'🍒', text:'Cherry Sushi — Свежие суши в Риге!' },
    { icon:'📍', text:'Lokomotīves iela 100, Rīga' },
    { icon:'🕐', text:'Ежедневно: 11:00 – 22:00' },
    { icon:'📞', text:'+371 20 918 484' },
    { icon:'🎁', text:'Сеты со скидкой до 30%' },
  ],
  en: [
    { icon:'🍒', text:'Cherry Sushi — Fresh sushi in Riga!' },
    { icon:'📍', text:'Lokomotīves iela 100, Riga' },
    { icon:'🕐', text:'Daily: 11:00 – 22:00' },
    { icon:'📞', text:'+371 20 918 484' },
    { icon:'🎁', text:'Sets up to 30% off' },
  ],
};

export default function PromoBar() {
  const { lang } = useLanguage();
  const list = PROMOS[lang] || PROMOS.lv;
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % list.length);
      setKey(k => k + 1);
    }, 3500);
    return () => clearInterval(id);
  }, [list.length]);

  const p = list[idx];
  return (
    <div className="promo-bar">
      <div className="promo-bar-inner" key={key}>
        <span className="promo-bar-icon">{p.icon}</span>
        <span className="promo-bar-text">{p.text}</span>
      </div>
    </div>
  );
}
