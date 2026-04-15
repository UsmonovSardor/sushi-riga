import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const CATS = [
  { id:'hit',    emoji:'⭐', key:'c_hit'    },
  { id:'sets',   emoji:'🎁', key:'c_sets'   },
  { id:'rolls',  emoji:'🍣', key:'c_rolls'  },
  { id:'sushi',  emoji:'🍱', key:'c_sushi'  },
  { id:'hot',    emoji:'🔥', key:'c_hot'    },
  { id:'drinks', emoji:'🥤', key:'c_drinks' },
];

export default function CategoryNav() {
  const { lang } = useLanguage();
  const t = T[lang];
  const go = (id) => {
    const el = document.getElementById('sec-' + id);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  };
  return (
    <nav style={{ background:'#fff', display:'flex', alignItems:'center', padding:'0 40px', overflowX:'auto', scrollbarWidth:'none', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
      {CATS.map(c => (
        <button key={c.id} onClick={() => go(c.id)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'14px 20px', fontSize:'.88rem', fontWeight:600, color:'var(--muted)', borderBottom:'3px solid transparent', whiteSpace:'nowrap', background:'none', border:'none', borderBottom:'3px solid transparent', cursor:'pointer' }}>
          {c.emoji} {t[c.key]}
        </button>
      ))}
    </nav>
  );
}
