import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { promosApi } from '../../services/api';
import T from '../../i18n/translations';

const GRAD = 'linear-gradient(100deg, rgba(14,10,12,.72) 0%, rgba(14,10,12,.44) 34%, rgba(0,0,0,0) 60%)';

// Offline fallback — used only if the slides API is unreachable. Mirrors the
// slides the backend seeds on first run (which the admin then manages).
const FALLBACK = [
  { video: '/hero/cherry-sushi-1.mp4', img: '', target: 'cold',
    badge: { lv: '🍣 Populārākais', ru: '🍣 Популярное', en: '🍣 Popular' },
    title: { lv: 'Svaigi rolli\nkatru dienu', ru: 'Свежие роллы\nкаждый день', en: 'Fresh rolls\nevery day' },
    sub: { lv: 'Gatavoti no svaigiem produktiem', ru: 'Готовим из свежих продуктов', en: 'Made from fresh ingredients' }, cta: {} },
  { video: '/hero/cherry-sushi-2.mp4', img: '', target: 'double',
    badge: { lv: '🎯 Jaunums', ru: '🎯 Новинка', en: '🎯 New' },
    title: { lv: 'Dubultie sēti\nlielāka garša', ru: 'Дабл сеты\nбольше вкуса', en: 'Double sets\nmore flavor' },
    sub: { lv: 'Labākā izvēle kompānijai', ru: 'Лучший выбор для компании', en: 'Best choice for the company' }, cta: {} },
  { video: '/hero/cherry-sushi-3.mp4', img: '', target: 'sets',
    badge: { lv: '🔥 Akcija', ru: '🔥 Акция', en: '🔥 Sale' },
    title: { lv: 'Sēti ar atlaidi\nlīdz 30%', ru: 'Сеты со скидкой\nдо 30%', en: 'Sets on sale\nup to 30%' },
    sub: { lv: 'Pieredzējušu šefpavāru receptes', ru: 'Рецепты опытных поваров', en: 'Expert chef recipes' }, cta: {} },
];

export default function HeroSlider({ onOrderNow }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const [slides, setSlides] = useState(FALLBACK);
  const [idx, setIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const videoRefs = useRef([]);

  // Load admin-managed slides; keep the fallback if the API is empty/unreachable.
  useEffect(() => {
    let cancelled = false;
    promosApi.getActive()
      .then(list => {
        if (cancelled || !Array.isArray(list) || !list.length) return;
        setSlides(list.map(p => ({
          video: p.video || '', img: p.img || '',
          title: p.title || {}, sub: p.subtitle || {}, badge: p.badge || {}, cta: p.cta || {},
          target: p.link || '',
        })));
        setIdx(0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const n = slides.length;
  const goTo = i => { setIdx(((i % n) + n) % n); setAnimKey(k => k + 1); };

  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => { setIdx(i => (i + 1) % n); setAnimKey(k => k + 1); }, 5000);
    return () => clearInterval(id);
  }, [n]);

  // Only the visible slide's video loads and plays.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) { v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    });
  }, [idx, slides]);

  const L = obj => obj?.[lang] || obj?.lv || obj?.ru || obj?.en || '';
  const s = slides[idx] || {};
  const titleLines = L(s.title).split('\n');
  const ctaText = L(s.cta) || t.s_order;

  const act = () => {
    const target = s.target || '';
    if (/^https?:\/\//.test(target)) { window.open(target, '_blank', 'noopener'); return; }
    const el = target && document.getElementById('sec-' + target);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    else onOrderNow?.();
  };

  return (
    <div className="hero">
      {slides.map((sl, i) => (
        <div key={i} className={'hero-slide' + (i === idx ? ' on' : '')}>
          {sl.video
            ? <video ref={el => (videoRefs.current[i] = el)} className="hero-video" src={sl.video} muted loop playsInline preload={i === idx ? 'auto' : 'none'} poster={sl.img} />
            : <div className="hero-bg" style={sl.img ? { backgroundImage: `url(${sl.img})` } : { background: '#1a1416' }} />}
          <div className="hero-overlay" style={{ background: GRAD }} />
        </div>
      ))}

      <div className="hero-body" key={animKey}>
        {L(s.badge) && <div className="hero-badge">{L(s.badge)}</div>}
        <div className="hero-title">
          {titleLines.map((line, i) => (
            <div key={i} className={i === 1 ? 'hero-title-accent' : ''}>{line}</div>
          ))}
        </div>
        {L(s.sub) && <div className="hero-sub">{L(s.sub)}</div>}
        <button className="hero-cta" onClick={act}>
          {ctaText}
          <span className="hero-cta-arrow">→</span>
        </button>
      </div>

      {n > 1 && (
        <div className="hero-nav">
          <button className="hero-arrow" onClick={() => goTo(idx - 1)} aria-label="Previous">‹</button>
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button key={i} className={'hero-dot' + (i === idx ? ' on' : '')} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
          <button className="hero-arrow" onClick={() => goTo(idx + 1)} aria-label="Next">›</button>
        </div>
      )}

      <div className="hero-progress"><div className="hero-progress-bar" key={idx} /></div>
    </div>
  );
}
