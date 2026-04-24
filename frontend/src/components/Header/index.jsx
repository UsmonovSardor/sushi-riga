import React, { useState, useEffect, useRef } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import T from '../../i18n/translations';

const LANGS = [
  { code:'lv', flag:'🇱🇻', label:'Latviešu' },
  { code:'ru', flag:'🇷🇺', label:'Русский'  },
  { code:'en', flag:'🇬🇧', label:'English'  },
];

export default function Header({ onCartOpen, onMenuOpen, onSearchOpen, onAuthOpen }) {
  const { count }         = useCart();
  const { lang, setLang } = useLanguage();
  const { user, logout }  = useAuth();
  const [langOpen, setLO] = useState(false);
  const [userOpen, setUO] = useState(false);
  const [scrolled, setSc] = useState(false);
  const langRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const fn = () => setSc(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = e => {
      if (!langRef.current?.contains(e.target)) setLO(false);
      if (!userRef.current?.contains(e.target)) setUO(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const cur = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <header className={'header' + (scrolled ? ' scrolled' : '')}>
      <div className="header-in">

        {/* LEFT */}
        <div className="h-left">
          <button className="h-burger" onClick={onMenuOpen} aria-label="Menu">
            <span/><span/><span/>
          </button>
          <div className="logo-wrap" onClick={() => window.scrollTo({top:0,behavior:'smooth'})} style={{cursor:'pointer'}}>
            <span className="logo-emoji">🍒</span>
            <span className="logo-txt">CHERRY <em>SUSHI</em></span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="h-right">
          {/* Lang */}
          <div className="lang-wrap" ref={langRef}>
            <button className="hbtn lang-btn" onClick={() => { setLO(o=>!o); setUO(false); }}>
              {cur.flag} <span className="lang-code">{cur.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="lang-dd">
                {LANGS.map(l => (
                  <div key={l.code} className={'lang-row'+(lang===l.code?' on':'')}
                    onClick={() => { setLang(l.code); setLO(false); }}>
                    {l.flag} {l.label}
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
          <button className="hbtn h-cart-btn" onClick={onCartOpen} aria-label="Cart" style={{position:'relative'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="h-cart-n">{count > 9 ? '9+' : count}</span>}
          </button>

          {/* User */}
          <div className="lang-wrap" ref={userRef}>
            <button className={'hbtn'+(user?'':' h-avatar--guest')}
              onClick={() => { setUO(o=>!o); setLO(false); }}
              style={{position:'relative'}} aria-label="Account">
              {user
                ? <span style={{fontSize:'.72rem',fontWeight:900}}>{user.name?.slice(0,2)?.toUpperCase()}</span>
                : <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="h-notif-dot"/>
                  </>
              }
            </button>
            {userOpen && (
              <div className="lang-dd user-dd">
                {user ? (
                  <>
                   <div className="user-info">
                    <div className="user-name">{user.name}</div>
                     <div style={{fontSize:'.72rem',color:'#888',marginTop:2}}>
                        {user.email}
                      </div>
                    </div>

                 <div className="lang-row" onClick={() => { onMyOrdersOpen(); setUO(false); }}>
                    📦 {lang==='lv' ? 'Mani pasūtījumi' : lang==='en' ? 'My Orders' : 'Мои заказы'}
                 </div>

                  <div className="lang-row" onClick={() => { logout(); setUO(false); }}>
                    🚪 {lang==='lv'?'Iziet':lang==='en'?'Sign out':'Выйти'}
                  </div>
                    <div className="lang-row" onClick={() => { logout(); setUO(false); }}>
                      🚪 {lang==='lv'?'Iziet':lang==='en'?'Sign out':'Выйти'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="lang-row" onClick={() => { onAuthOpen(); setUO(false); }}>
                      👤 {lang==='lv'?'Pieteikties':lang==='en'?'Sign in':'Войти'}
                    </div>
                    <div className="lang-row user-promo" onClick={() => { onAuthOpen(); setUO(false); }}>
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
