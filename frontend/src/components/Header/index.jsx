import React, { useState } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };

export default function Header({ onSearch, onMenu }) {
  const { count, setIsOpen } = useCart();
  const { lang, setLang }    = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const t = T[lang];

  return (
    <header style={{ background:'var(--red)', position:'sticky', top:0, zIndex:1000, boxShadow:'0 2px 16px rgba(0,0,0,.25)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 40px', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:'2rem' }}>🍣</span>
          <span style={{ color:'#fff', fontSize:'1.3rem', fontWeight:900 }}>SUSHI <em style={{ fontStyle:'normal', opacity:.75 }}>RĪGA</em></span>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {/* Lang switcher */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setLangOpen(o => !o)}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.15)', border:'1.5px solid rgba(255,255,255,.3)', borderRadius:10, padding:'8px 12px', color:'#fff', fontWeight:700, fontSize:'.82rem' }}>
              {FLAGS[lang]} {lang.toUpperCase()} ▾
            </button>
            {langOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', borderRadius:14, minWidth:160, boxShadow:'var(--shl)', overflow:'hidden', zIndex:2000 }}>
                {Object.entries(FLAGS).map(([l, f]) => (
                  <div key={l} onClick={() => { setLang(l); setLangOpen(false); }}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', cursor:'pointer', fontWeight:500, background: l===lang ? '#fef2f2' : '#fff' }}>
                    {f} {l.toUpperCase()} {l===lang && <span style={{ marginLeft:'auto', color:'var(--red)' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button onClick={onSearch}
            style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.15)', border:'1.5px solid rgba(255,255,255,.3)', color:'#fff', fontSize:'1rem' }}>
            🔍
          </button>

          {/* Cart */}
          <button onClick={() => setIsOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:12, padding:'9px 16px', color:'var(--red)', fontWeight:800, fontSize:'.88rem' }}>
            🛒 {t.cart}
            {count > 0 && (
              <span style={{ background:'var(--red)', color:'#fff', borderRadius:'50%', width:20, height:20, fontSize:'.68rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {count}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button onClick={onMenu}
            style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.15)', border:'1.5px solid rgba(255,255,255,.3)', color:'#fff', fontSize:'1.1rem' }}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
