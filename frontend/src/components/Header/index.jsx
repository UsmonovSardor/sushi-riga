import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import T from '../../i18n/translations';

const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };

export default function Header({ onSearch, onMenu, onAuth }) {
  const { count, setIsOpen } = useCart();
  const { lang, setLang }    = useLanguage();
  const { user, logout }     = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const t = T[lang];

  const closeDd = () => { setLangOpen(false); setUserOpen(false); };

  return (
    <header className="header" onClick={() => closeDd()}>
      <div className="header-in">

        {/* ── LEFT: Logo + Cart ── */}
        <div className="h-left">
          <div className="logo">
            <span className="logo-icon">🍣</span>
            <span className="logo-txt">SUSHI <em>RĪGA</em></span>
          </div>

          {/* Cart — 3rd element from left (after logo icon, logo text) */}
          <button className="h-cart" onClick={e => { e.stopPropagation(); setIsOpen(true); }}>
            <span className="h-cart-icon">🛒</span>
            <span className="h-cart-lbl">{t.cart}</span>
            {count > 0 && <span className="h-cart-badge">{count}</span>}
          </button>
        </div>

        {/* ── RIGHT: Lang + Search + User + Menu ── */}
        <div className="h-right">

          {/* Language */}
          <div className="lang-wrap" onClick={e => e.stopPropagation()}>
            <button className="hbtn lang-btn" onClick={() => { setLangOpen(o => !o); setUserOpen(false); }}>
              {FLAGS[lang]} <span className="lang-code">{lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="lang-dd">
                {Object.entries(FLAGS).map(([l, f]) => (
                  <div key={l} className={'lang-row' + (l === lang ? ' on' : '')}
                    onClick={() => { setLang(l); setLangOpen(false); }}>
                    {f} {l.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="hbtn" onClick={onSearch} aria-label="Search">🔍</button>

          {/* User */}
          <div className="lang-wrap" onClick={e => e.stopPropagation()}>
            {user ? (
              <>
                <button className="hbtn u-btn" onClick={() => { setUserOpen(o => !o); setLangOpen(false); }}>
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {userOpen && (
                  <div className="lang-dd user-dd">
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="lang-row" onClick={() => { logout(); setUserOpen(false); }}>
                      🚪 Выйти
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button className="hbtn" onClick={() => { onAuth(); closeDd(); }} aria-label="Login">👤</button>
            )}
          </div>

          {/* Burger */}
          <button className="hbtn" onClick={onMenu} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  );
}
