import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const CATS = [
  { id:'hit',     emoji:'⭐', key:'c_hit'     },
  { id:'cold',    emoji:'🍣', key:'c_cold'    },
  { id:'hot',     emoji:'🔥', key:'c_hot'     },
  { id:'tempura', emoji:'🍤', key:'c_tempura' },
  { id:'special', emoji:'🎎', key:'c_special' },
  { id:'double',  emoji:'🎯', key:'c_double'  },
  { id:'sets',    emoji:'🎁', key:'c_sets'    },
  { id:'food',    emoji:'🍜', key:'c_food'    },
  { id:'salad',   emoji:'🥗', key:'c_salad'   },
  { id:'snacks',  emoji:'🍟', key:'c_snacks'  },
  { id:'drinks',  emoji:'🥤', key:'c_drinks'  },
];

export default function CategoryNav() {
  const { lang } = useLanguage();
  const t = T[lang];
  const [active, setActive] = useState('hit');
  const navRef = useRef(null);

  const go = (id) => {
    const el = document.getElementById('sec-' + id);
    if (!el) return;
    const offset = 120;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  };

  useEffect(() => {
    const onScroll = () => {
      const offset = 140;
      let cur = CATS[0].id;
      CATS.forEach(({ id }) => {
        const el = document.getElementById('sec-' + id);
        if (el && el.getBoundingClientRect().top <= offset) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav ref={navRef} style={{ background:'#fff', display:'flex', alignItems:'center', padding:'0 20px', overflowX:'auto', scrollbarWidth:'none', boxShadow:'0 2px 8px rgba(0,0,0,.06)', position:'sticky', top:64, zIndex:900 }}>
      {CATS.map(c => (
        <button key={c.id} onClick={() => go(c.id)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'13px 16px', fontSize:'.82rem', fontWeight:600, whiteSpace:'nowrap', background:'none', border:'none', borderBottom: active===c.id ? '3px solid var(--red)' : '3px solid transparent', color: active===c.id ? 'var(--red)' : 'var(--muted)', cursor:'pointer', transition:'all .2s' }}>
          {c.emoji} {t[c.key]}
        </button>
      ))}
    </nav>
  );
}
