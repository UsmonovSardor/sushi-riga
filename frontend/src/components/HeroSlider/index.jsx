import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=500&fit=crop',
    color: '#c0181d',
    title: { lv:'Svaigi rolli<br>katru dienu', ru:'Свежие роллы<br>каждый день', en:'Fresh rolls<br>every day' },
    sub:   { lv:'Gatavoti no svaigiem produktiem', ru:'Готовим из свежих продуктов', en:'Made from fresh ingredients' },
    target:'cold', emoji:'🍣',
  },
  {
    bg: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&h=500&fit=crop',
    color: '#0f1e50',
    title: { lv:'Dubultie sēti<br>lielāka garša', ru:'Дабл сеты<br>больше вкуса', en:'Double sets<br>more flavor' },
    sub:   { lv:'Labākā izvēle kompānijai', ru:'Лучший выбор для компании', en:'Best choice for company' },
    target:'double', emoji:'🎯',
  },
  {
    bg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=500&fit=crop',
    color: '#7c3a00',
    title: { lv:'Sēti ar atlaidi<br>līdz 30%', ru:'Сеты со скидкой<br>до 30%', en:'Sets on sale<br>up to 30%' },
    sub:   { lv:'Pieredzējušu šefpavāru receptes', ru:'Рецепты опытных поваров', en:'Expert chef recipes' },
    target:'sets', emoji:'🎁',
  },
];

const FLOATERS = ['🍣','🥢','🍱','🫧','🌿'];

export default function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const { lang } = useLanguage();
  const t = T[lang];

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const go = target => {
    const el = document.getElementById('sec-' + target);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior:'smooth' });
  };

  return (
    <div className="hero">
      {SLIDES.map((s, i) => (
        <div key={i} className={'hero-slide' + (i === idx ? ' on' : '')}>
          <div className="hero-bg" style={{ backgroundImage:`url(${s.bg})` }} />
          <div className="hero-overlay" style={{ background:`linear-gradient(105deg,${s.color}ee 0%,${s.color}88 55%,transparent 100%)` }} />
          <div className="hero-floaters" aria-hidden="true">
            {FLOATERS.map((em, fi) => <span key={fi} className={`hero-floater hero-floater--${fi}`}>{em}</span>)}
          </div>
          <div className="hero-body">
            <div className="hero-tag">{s.emoji} Sushi Rīga</div>
            <div className="hero-title" dangerouslySetInnerHTML={{ __html: s.title[lang] || s.title.lv }} />
            <div className="hero-sub">{s.sub[lang] || s.sub.lv}</div>
            <button className="hero-cta" onClick={() => go(s.target)}>
              <span>{t.s_order}</span>
              <span className="hero-cta-arrow">→</span>
            </button>
          </div>
        </div>
      ))}
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={'hero-dot' + (i === idx ? ' on' : '')} onClick={() => setIdx(i)} />
        ))}
      </div>
      <div className="hero-progress"><div className="hero-progress-bar" key={idx} /></div>
    </div>
  );
}
