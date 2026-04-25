import React, { useState, useEffect, useRef } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';

const LANGS = [
  { code:'lv', flag:'🇱🇻', label:'Latviešu' },
  { code:'ru', flag:'🇷🇺', label:'Русский'  },
  { code:'en', flag:'🇬🇧', label:'English'  },
];

export default function Header({ onCartOpen, onMenuOpen, onSearchOpen, onAuthOpen, onMyOrdersOpen }) {
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
          <button className="h-burger" onClick={onMenuOpen}>
            <span/><span/><span/>
          </button>

          <div className="logo-wrap" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            🍒 CHERRY SUSHI
          </div>
        </div>

        {/* RIGHT */}
        <div className="h-right">

          {/* Language */}
          <div className="lang-wrap" ref={langRef}>
            <button className="hbtn" onClick={() => { setLO(o=>!o); setUO(false); }}>
              {cur.flag} {cur.code.toUpperCase()}
            </button>

            {langOpen && (
              <div className="lang-dd">
                {LANGS.map(l => (
                  <div key={l.code} onClick={() => { setLang(l.code); setLO(false); }}>
                    {l.flag} {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="hbtn" onClick={onSearchOpen}>🔍</button>

          {/* Cart */}
          <button className="hbtn" onClick={onCartOpen}>
            🛒 {count > 0 && <span>{count}</span>}
          </button>

          {/* User */}
          <div ref={userRef}>
            <button className="hbtn" onClick={() => { setUO(o=>!o); setLO(false); }}>
              {user ? user.name?.slice(0,2).toUpperCase() : '👤'}
            </button>

            {userOpen && (
              <div className="lang-dd">

                {user ? (
                  <>
                    <div>
                      <b>{user.name}</b><br/>
                      <small>{user.email || user.phone || ''}</small>
                    </div>

                    <div onClick={() => { onMyOrdersOpen(); setUO(false); }}>
                      📦 {lang==='lv' ? 'Mani pasūtījumi' : lang==='en' ? 'My Orders' : 'Мои заказы'}
                    </div>

                    <div onClick={() => { logout(); setUO(false); }}>
                      🚪 {lang==='lv'?'Iziet':lang==='en'?'Sign out':'Выйти'}
                    </div>
                  </>
                ) : (
                  <>
                    <div onClick={() => { onAuthOpen(); setUO(false); }}>
                      👤 {lang==='lv'?'Pieteikties':lang==='en'?'Sign in':'Войти'}
                    </div>

                    <div onClick={() => { onAuthOpen(); setUO(false); }}>
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
