import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';

const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };

export default function Header({ onSearch, onMenu, onAuth }) {
  const { lang, setLang } = useLanguage();
  const { user, logout }  = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const closeAll = () => { setLangOpen(false); setUserOpen(false); };

  return (
    <header className="header" onClick={closeAll}>
      <div className="header-in">

        {/* ── LEFT: ☰ + 🍣 + SUSHI RĪGA ── */}
        <div className="h-left">
          {/* ☰ Burger — leftmost, before logo */}
          <button className="h-burger" onClick={e => { e.stopPropagation(); onMenu(); }} aria-label="Меню">
            <span /><span /><span />
          </button>
          <span className="logo-emoji">🍣</span>
          <span className="logo-txt">SUSHI <em>RĪGA</em></span>
        </div>

        {/* ── RIGHT: 🇷🇺 + 🔍 + 👤 ── */}
        <div className="h-right">

          {/* Language */}
          <div className="lang-wrap" onClick={e => e.stopPropagation()}>
            <button
              className="hbtn lang-btn"
              onClick={() => { setLangOpen(o => !o); setUserOpen(false); }}
            >
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
          <button className="hbtn" onClick={e => { e.stopPropagation(); onSearch(); }} aria-label="Поиск">
            🔍
          </button>

          {/* 👤 User */}
          <div className="lang-wrap" onClick={e => e.stopPropagation()}>
            {user ? (
              <>
                <button className="h-avatar"
                  onClick={() => { setUserOpen(o => !o); setLangOpen(false); }}>
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
              <button className="hbtn" onClick={() => { onAuth(); closeAll(); }} title="Войти">
                👤
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
