import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };
export default function Header({ onSearch, onMenu }) {
  const { count, setIsOpen } = useCart();
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const t = T[lang];
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-emoji">🍣</span>
          <span className="logo-name">SUSHI <em>RĪGA</em></span>
        </div>
        <div className="header-right">
          <div className="lang-wrap">
            <button className="lang-btn" onClick={() => setOpen(o => !o)}>
              {FLAGS[lang]} {lang.toUpperCase()} ▾
            </button>
            {open && (
              <div className="lang-drop">
                {Object.entries(FLAGS).map(([l, f]) => (
                  <div key={l} className={'lang-item' + (l === lang ? ' active' : '')}
                    onClick={() => { setLang(l); setOpen(false); }}>
                    {f} {l.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={onSearch} aria-label="Search">🔍</button>
          <button className="cart-btn" onClick={() => setIsOpen(true)}>
            🛒 <span className="cart-lbl">{t.cart}</span>
            {count > 0 && <span className="cart-cnt">{count}</span>}
          </button>
          <button className="icon-btn" onClick={onMenu} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  );
}