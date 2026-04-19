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

        {/* ── LEFT: 🍣 + 🔍 + SUSHI RĪGA ── */}
        <div className="h-left">
          <span className="logo-emoji">🍣</span>
          <button
            className="h-search-icon"
            onClick={e => { e.stopPropagation(); onSearch(); }}
            aria-label="Поиск"
          >
            🔍
          </button>
          <span className="logo-txt">SUSHI <em>RĪGA</em></span>
        </div>

        {/* ── RIGHT: 🇷🇺 + 👤 + ☰ ── */}
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
                  <div
                    key={l}
                    className={'lang-row' + (l === lang ? ' on' : '')}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                  >
                    {f} {l.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 👤 User — right side */}
          <div className="lang-wrap" onClick={e => e.stopPropagation()}>
            {user ? (
              <>
                <button
                  className="h-avatar"
                  onClick={() => { setUserOpen(o => !o); setLangOpen(false); }}
                  aria-label="Профиль"
                >
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
              <button
                className="hbtn"
                onClick={() => { onAuth(); closeAll(); }}
                aria-label="Войти"
                title="Войти / Регистрация"
              >
                👤
              </button>
            )}
          </div>

          {/* ☰ Burger */}
          <button className="hbtn" onClick={onMenu} aria-label="Меню">☰</button>
        </div>
      </div>
    </header>
  );
}
