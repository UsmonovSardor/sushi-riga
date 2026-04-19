import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
const SLIDES = [
  { bg:'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=400&fit=crop', overlay:'rgba(200,20,28,.82)', titleKey:'s1t', subKey:'s1s', target:'sets' },
  { bg:'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&h=400&fit=crop', overlay:'rgba(14,26,72,.88)', titleKey:'s2t', subKey:'s2s', target:'cold' },
  { bg:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=400&fit=crop', overlay:'rgba(160,70,0,.86)', titleKey:'s3t', subKey:'s3s', target:'sets' },
];
export default function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const { lang } = useLanguage();
  const t = T[lang];
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);
  const go = id => {
    const el = document.getElementById('sec-' + id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };
  return (
    <div className="hero">
      {SLIDES.map((s, i) => (
        <div key={i} className={'hero-slide' + (i === idx ? ' on' : '')}>
          <div className="hero-bg" style={{ backgroundImage: `url(${s.bg})` }} />
          <div className="hero-overlay" style={{ background: `linear-gradient(90deg,${s.overlay} 0%,rgba(0,0,0,.1) 100%)` }} />
          <div className="hero-body">
            <div className="hero-title" dangerouslySetInnerHTML={{ __html: t[s.titleKey] }} />
            <div className="hero-sub">{t[s.subKey]}</div>
            <button className="hero-cta" onClick={() => go(s.target)}>{t.s_order}</button>
          </div>
        </div>
      ))}
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={'hero-dot' + (i === idx ? ' on' : '')} onClick={() => setIdx(i)} aria-label={'Slide '+(i+1)} />
        ))}
      </div>
    </div>
  );
}