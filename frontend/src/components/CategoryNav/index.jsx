import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
const CATS = [
  {id:'hit',e:'⭐',k:'c_hit'},{id:'cold',e:'🍣',k:'c_cold'},
  {id:'hot',e:'🔥',k:'c_hot'},{id:'tempura',e:'🍤',k:'c_tempura'},
  {id:'special',e:'🎎',k:'c_special'},{id:'double',e:'🎯',k:'c_double'},
  {id:'sets',e:'🎁',k:'c_sets'},{id:'food',e:'🍜',k:'c_food'},
  {id:'salad',e:'🥗',k:'c_salad'},{id:'snacks',e:'🍟',k:'c_snacks'},
  {id:'drinks',e:'🥤',k:'c_drinks'},
];
export default function CategoryNav() {
  const { lang } = useLanguage();
  const t = T[lang];
  const [active, setActive] = useState('hit');
  const go = id => {
    const el = document.getElementById('sec-' + id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };
  useEffect(() => {
    const fn = () => {
      let cur = CATS[0].id;
      CATS.forEach(({ id }) => {
        const el = document.getElementById('sec-' + id);
        if (el && el.getBoundingClientRect().top <= 130) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className="cat-nav">
      <div className="cat-inner">
        {CATS.map(c => (
          <button key={c.id} className={'cat-item' + (active === c.id ? ' active' : '')} onClick={() => go(c.id)}>
            {c.e} {t[c.k]}
          </button>
        ))}
      </div>
    </nav>
  );
}