import React, { useState, useEffect, useRef } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import T from '../../i18n/translations';

const LANGS = [
  { code:'lv', flag:'🇱🇻', label:'Latviešu' },
  { code:'ru', flag:'🇷🇺', label:'Русский' },
  { code:'en', flag:'🇬🇧', label:'English' },
];

export default function Header({ onCartOpen, onMenuOpen, onSearchOpen, onAuthOpen }) {
  const { count }        = useCart();
  const { lang, setLang }= useLanguage();
  const { user, logout } = useAuth();
  const [langOpen, setLangOpen]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const langRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = e => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <header className={'header' + (scrolled ? ' scrolled' : '')}>
      <div className="header-in">
        {/* Left */}
        <div className="h-left">
          <button className="h-burger" onClick={onMenuOpen} aria-label="Menu">
            <span/><span/><span/>
          </button>
          <div className="logo-emoji">🍣</div>
          <div className="logo-txt">SUSHI <em>RĪGA</em></div>
        </div>

        {/* Right */}
        <div className="h-right">
          {/* Language */}
          <div className="lang-wrap" ref={langRef}>
            <button className="hbtn lang-btn" onClick={() => { setLangOpen(o => !o); setUserOpen(false); }}>
              <span>{currentLang.flag}</span>
              <span className="lang-code">{currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="lang-dd">
                {LANGS.map(l => (
                  <div key={l.code} className={'lang-row' + (lang===l.code?' on':'')}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}>
                    <span>{l.flag}</span><span>{l.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="hbtn" onClick={onSearchOpen} aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Cart */}
          <button className="h-cart-ico" onClick={onCartOpen} aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="h-cart-n">{count}</span>}
          </button>

          {/* User */}
          <div className="lang-wrap" ref={userRef}>
            <button className={'h-avatar' + (!user?' h-avatar--guest':'')}
              onClick={() => { setUserOpen(o => !o); setLangOpen(false); }}
              aria-label="Account">
              {user
                ? <span style={{fontSize:'.78rem',fontWeight:900}}>{user.name?.slice(0,2)?.toUpperCase()}</span>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
              }
              {!user && <span className="h-notif-dot"/>}
            </button>
            {userOpen && (
              <div className="lang-dd user-dd" style={{right:0}}>
                {user ? (
                  <>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="lang-row" onClick={() => { logout(); setUserOpen(false); }}>
                      🚪 {lang==='lv'?'Iziet':lang==='en'?'Logout':'Выйти'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="lang-row" onClick={() => { onAuthOpen(); setUserOpen(false); }}>
                      👤 {lang==='lv'?'Pieteikties':lang==='en'?'Sign in':'Войти'}
                    </div>
                    <div className="lang-row user-promo">
                      🎁 {lang==='lv'?'Reģistrēties':lang==='en'?'Register':'Регистрация'}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
