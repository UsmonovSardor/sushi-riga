import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };

export default function Header({ onSearch, onMenu }) {
  const { count, setIsOpen } = useCart();
  const { lang, setLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const t = T[lang];

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <span className="logo-icon">🍣</span>
          <span className="logo-text">SUSHI <em>RĪGA</em></span>
        </div>

        <div className="header-actions">
          {/* Language */}
          <div className="lang-wrap">
            <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
              {FLAGS[lang]} {lang.toUpperCase()} ▾
            </button>
            {langOpen && (
              <div className="lang-drop">
                {Object.entries(FLAGS).map(([l, f]) => (
                  <div
                    key={l}
                    className={`lang-opt${l === lang ? ' cur' : ''}`}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                  >
                    {f} {l.toUpperCase()}
                    {l === lang && <span style={{ marginLeft:'auto' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="h-btn" onClick={onSearch} aria-label="Search">🔍</button>

          {/* Cart */}
          <button className="cart-btn" onClick={() => setIsOpen(true)}>
            🛒
            <span className="cart-label">{t.cart}</span>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          {/* Menu */}
          <button className="h-btn" onClick={onMenu} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  );
}
