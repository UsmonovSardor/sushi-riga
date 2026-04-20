import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=400&fit=crop',
    color: '#c0181d',
    titleKey: 's1t', subKey: 's1s', target: 'sets',
    emoji: '🍣',
  },
  {
    bg: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&h=400&fit=crop',
    color: '#0f1e50',
    titleKey: 's2t', subKey: 's2s', target: 'cold',
    emoji: '🔥',
  },
  {
    bg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=400&fit=crop',
    color: '#a04600',
    titleKey: 's3t', subKey: 's3s', target: 'sets',
    emoji: '🎁',
  },
];

const FLOATERS = ['🍣','🥢','🍱','🫧','🌊'];

export default function HeroSlider() {
  const [idx, setIdx]   = useState(0);
  const [prev, setPrev] = useState(null);
  const [dir, setDir]   = useState(1);
  const { lang } = useLanguage();
  const t = T[lang];

  useEffect(() => {
    const id = setInterval(() => {
      setPrev(idx);
      setDir(1);
      setIdx(i => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, [idx]);

  const goTo = (i) => {
    if (i === idx) return;
    setPrev(idx);
    setDir(i > idx ? 1 : -1);
    setIdx(i);
  };

  const go = (target) => {
    const el = document.getElementById('sec-' + target);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };

  const s = SLIDES[idx];

  return (
    <div className="hero">
      {SLIDES.map((sl, i) => (
        <div
          key={i}
          className={'hero-slide' + (i === idx ? ' on' : '')}
        >
          <div className="hero-bg" style={{ backgroundImage: `url(${sl.bg})` }} />
          <div className="hero-overlay" style={{
            background: `linear-gradient(105deg, ${sl.color}ee 0%, ${sl.color}99 55%, transparent 100%)`
          }} />

          {/* Floating emojis — animata style */}
          <div className="hero-floaters" aria-hidden="true">
            {FLOATERS.map((em, fi) => (
              <span key={fi} className={`hero-floater hero-floater--${fi}`}>{em}</span>
            ))}
          </div>

          <div className="hero-body">
            <div className="hero-tag">{sl.emoji} Sushi Rīga</div>
            <div className="hero-title" dangerouslySetInnerHTML={{ __html: t[sl.titleKey] }} />
            <div className="hero-sub">{t[sl.subKey]}</div>
            <button className="hero-cta" onClick={() => go(sl.target)}>
              <span>{t.s_order}</span>
              <span className="hero-cta-arrow">→</span>
            </button>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={'hero-dot' + (i === idx ? ' on' : '')}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="hero-progress">
        <div className="hero-progress-bar" key={idx} />
      </div>
    </div>
  );
}
