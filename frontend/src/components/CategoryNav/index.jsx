import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
const CATS = [
  {id:'hit',emoji:'⭐',key:'c_hit'},{id:'cold',emoji:'🍣',key:'c_cold'},
  {id:'hot',emoji:'🔥',key:'c_hot'},{id:'tempura',emoji:'🍤',key:'c_tempura'},
  {id:'special',emoji:'🎎',key:'c_special'},{id:'double',emoji:'🎯',key:'c_double'},
  {id:'sets',emoji:'🎁',key:'c_sets'},{id:'food',emoji:'🍜',key:'c_food'},
  {id:'salad',emoji:'🥗',key:'c_salad'},{id:'snacks',emoji:'🍟',key:'c_snacks'},
  {id:'drinks',emoji:'🥤',key:'c_drinks'},
];
export default function CategoryNav() {
  const { lang } = useLanguage();
  const t = T[lang];
  const [active, setActive] = useState('hit');
  const go = (id) => {
    const el = document.getElementById('sec-' + id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
  };
  useEffect(() => {
    const onScroll = () => {
      let cur = CATS[0].id;
      CATS.forEach(({ id }) => {
        const el = document.getElementById('sec-' + id);
        if (el && el.getBoundingClientRect().top <= 140) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className="cat-nav">
      <div className="cat-nav-inner">
        {CATS.map(c => (
          <button key={c.id} className={'cat-btn' + (active === c.id ? ' act' : '')} onClick={() => go(c.id)}>
            {c.emoji} {t[c.key]}
          </button>
        ))}
      </div>
    </nav>
  );
}