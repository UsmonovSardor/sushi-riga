import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1400&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(110deg, rgba(180,18,22,.95) 0%, rgba(180,18,22,.7) 50%, rgba(0,0,0,.1) 100%)',
    title: { lv:'Svaigi rolli\nkatru dienu', ru:'Свежие роллы\nкаждый день', en:'Fresh rolls\nevery day' },
    sub:   { lv:'Gatavoti no svaigiem produktiem', ru:'Готовим из свежих продуктов', en:'Made from fresh ingredients' },
    badge: { lv:'🍣 Populārākais', ru:'🍣 Популярное', en:'🍣 Popular' },
    target: 'cold',
  },
  {
    bg: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1400&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(110deg, rgba(10,20,80,.95) 0%, rgba(10,20,80,.7) 50%, rgba(0,0,0,.1) 100%)',
    title: { lv:'Dubultie sēti\nlielāka garša', ru:'Дабл сеты\nбольше вкуса', en:'Double sets\nmore flavor' },
    sub:   { lv:'Labākā izvēle kompānijai', ru:'Лучший выбор для компании', en:'Best choice for the company' },
    badge: { lv:'🎯 Jaunums', ru:'🎯 Новинка', en:'🎯 New' },
    target: 'double',
  },
  {
    bg: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=1400&h=600&fit=crop&q=85',
    gradient: 'linear-gradient(110deg, rgba(100,45,0,.95) 0%, rgba(100,45,0,.7) 50%, rgba(0,0,0,.1) 100%)',
    title: { lv:'Sēti ar atlaidi\nlīdz 30%', ru:'Сеты со скидкой\nдо 30%', en:'Sets on sale\nup to 30%' },
    sub:   { lv:'Pieredzējušu šefpavāru receptes', ru:'Рецепты опытных поваров', en:'Expert chef recipes' },
    badge: { lv:'🔥 Akcija', ru:'🔥 Акция', en:'🔥 Sale' },
    target: 'sets',
  },
];

export default function HeroSlider() {
  const [idx, setIdx]         = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const { lang } = useLanguage();
  const t = T[lang];

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % SLIDES.length);
      setAnimKey(k => k + 1);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const go = target => {
    const el = document.getElementById('sec-' + target);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };

  const s = SLIDES[idx];

  return (
    <div className="hero">
      {SLIDES.map((sl, i) => (
        <div key={i} className={'hero-slide' + (i === idx ? ' on' : '')}>
          <div className="hero-bg" style={{ backgroundImage: `url(${sl.bg})` }} />
          <div className="hero-overlay" style={{ background: sl.gradient }} />
        </div>
      ))}

      {/* Content - animates on slide change */}
      <div className="hero-body" key={animKey}>
        <div className="hero-badge">{s.badge[lang] || s.badge.lv}</div>
        <div className="hero-title">
          {(s.title[lang] || s.title.lv).split('\n').map((line, i) => (
            <div key={i} className={i === 1 ? 'hero-title-accent' : ''}>{line}</div>
          ))}
        </div>
        <div className="hero-sub">{s.sub[lang] || s.sub.lv}</div>
        <button className="hero-cta" onClick={() => go(s.target)}>
          {t.s_order}
          <span className="hero-cta-arrow">→</span>
        </button>
      </div>

      {/* Dots */}
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={'hero-dot' + (i === idx ? ' on' : '')} onClick={() => { setIdx(i); setAnimKey(k => k+1); }} />
        ))}
      </div>
      {/* Progress bar */}
      <div className="hero-progress"><div className="hero-progress-bar" key={idx} /></div>
    </div>
  );
}
