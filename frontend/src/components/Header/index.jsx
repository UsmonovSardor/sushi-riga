import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import T from '../../i18n/translations';

const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };

export default function Header({ onSearch, onMenu, onAuth }) {
  const { count, setIsOpen } = useCart();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const t = T[lang];

  return (
    <header className="header">
      <div className="header-in">
        {/* LEFT: Logo */}
        <div className="logo">
          <span className="logo-icon">🍣</span>
          <span className="logo-txt">SUSHI <em>RĪGA</em></span>
        </div>

        {/* CENTER-LEFT: Cart (3rd from left = after logo + lang) */}
        <div className="h-actions">
          {/* 1: Lang */}
          <div className="lang-wrap">
            <button className="lang-btn" onClick={() => { setLangOpen(o => !o); setUserOpen(false); }}>
              {FLAGS[lang]} {lang.toUpperCase()} ▾
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

          {/* 2: Search */}
          <button className="hbtn" onClick={onSearch} aria-label="Search">🔍</button>

          {/* 3: Cart (3rd from left) */}
          <button className="cartbtn" onClick={() => setIsOpen(true)}>
            🛒 <span className="lbl">{t.cart}</span>
            {count > 0 && <span className="cbadge">{count}</span>}
          </button>

          {/* 4: User account */}
          <div className="lang-wrap">
            {user ? (
              <>
                <button className="hbtn user-btn" onClick={() => { setUserOpen(o => !o); setLangOpen(false); }} aria-label="Account">
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
              <button className="hbtn" onClick={() => { onAuth(); setUserOpen(false); }} aria-label="Login" title="Войти">
                👤
              </button>
            )}
          </div>

          {/* 5: Menu burger */}
          <button className="hbtn" onClick={onMenu} aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
  );
}
