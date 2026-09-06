import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useMenu } from '../../context/MenuContext';
import T from '../../i18n/translations';
const CATS=[
  {id:'hit',e:'⭐',k:'c_hit'},{id:'cold',e:'🍣',k:'c_cold'},{id:'hot',e:'🔥',k:'c_hot'},
  {id:'tempura',e:'🍤',k:'c_tempura'},{id:'special',e:'🎎',k:'c_special'},{id:'double',e:'🎯',k:'c_double'},
  {id:'sets',e:'🎁',k:'c_sets'},{id:'food',e:'🍜',k:'c_food'},{id:'salad',e:'🥗',k:'c_salad'},
  {id:'snacks',e:'🍟',k:'c_snacks'},{id:'drinks',e:'🥤',k:'c_drinks'},
];
export default function CategoryNav() {
  const { lang } = useLanguage();
  const t = T[lang];
  const { items, loading } = useMenu();
  const [active, setActive] = useState('hit');
  const navRef = useRef(null);

  const go = id => {
    const el = document.getElementById('sec-'+id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior:'smooth' });
  };

  // Scroll-spy via IntersectionObserver — no per-frame getBoundingClientRect
  // (which forced a full layout reflow on every scroll frame). We watch each
  // section entering a thin band just under the sticky nav; the topmost section
  // currently in that band (in CATS order) is the active tab. Re-runs when the
  // menu loads so freshly-rendered sections get observed.
  useEffect(() => {
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = e.target.id.replace('sec-', '');
        if (e.isIntersecting) visible.add(id); else visible.delete(id);
      }
      const first = CATS.find(c => visible.has(c.id));
      if (first) setActive(first.id);
    }, { rootMargin: '-130px 0px -55% 0px', threshold: 0 });

    CATS.forEach(({ id }) => {
      const el = document.getElementById('sec-' + id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items, loading]);

  // Keep the active tab scrolled into view within the horizontal nav.
  useEffect(() => {
    const btn = navRef.current?.querySelector('.catbtn.on');
    btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  return (
    <nav className="cnav">
      <div className="cnav-inner" ref={navRef}>
        {CATS.map(c => (
          <button key={c.id} type="button" className={'catbtn'+(active===c.id?' on':'')} onClick={(e) => { e.preventDefault(); go(c.id); }}>
            {c.e} {t[c.k]}
          </button>
        ))}
      </div>
    </nav>
  );
}
