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
      <div className="header-in">
        <div className="logo"><span className="logo-icon">🍣</span><span className="logo-txt">SUSHI <em>RĪGA</em></span></div>
        <div className="h-actions">
          <div className="lang-wrap">
            <button className="lang-btn" onClick={() => setOpen(o => !o)}>{FLAGS[lang]} {lang.toUpperCase()} ▾</button>
            {open && (
              <div className="lang-dd">
                {Object.entries(FLAGS).map(([l,f]) => (
                  <div key={l} className={'lang-row'+(l===lang?' on':'')} onClick={() => { setLang(l); setOpen(false); }}>{f} {l.toUpperCase()}</div>
                ))}
              </div>
            )}
          </div>
          <button className="hbtn" onClick={onSearch}>🔍</button>
          <button className="cartbtn" onClick={() => setIsOpen(true)}>
            🛒 <span className="lbl">{t.cart}</span>
            {count > 0 && <span className="cbadge">{count}</span>}
          </button>
          <button className="hbtn" onClick={onMenu}>☰</button>
        </div>
      </div>
    </header>
  );
}