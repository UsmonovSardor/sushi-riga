import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const LANGS = [
  { code: 'lv', label: 'Latviešu' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

const menuBtn = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  padding: '10px 12px',
  borderRadius: 10,
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '.86rem',
  fontWeight: 700,
  color: '#334155',
};

 export default function Header({ onCartOpen, onMenuOpen, onSearchOpen, onAuthOpen, onMyOrdersOpen, readyOrdersCount = 0 }) {
  const { count } = useCart();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();

  const [langOpen, setLO] = useState(false);
  const [userOpen, setUO] = useState(false);
  const [scrolled, setSc] = useState(false);

  const langRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    // rAF-coalesced: at most one read/state-check per frame, no matter how many
    // scroll events fire. setSc is a no-op re-render when the boolean is stable.
    let raf = 0;
    const fn = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setSc(window.scrollY > 4);
      });
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); if (raf) cancelAnimationFrame(raf); };
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

  const myOrdersText =
    lang === 'lv' ? 'Mani pasūtījumi' :
    lang === 'en' ? 'My Orders' :
    'Мои заказы';

  return (
    <header className={'header' + (scrolled ? ' scrolled' : '')}>
      <div className="header-in">
        <div className="h-left">
          <button className="h-burger" onClick={onMenuOpen} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>

          <div
            className="logo-wrap"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-emoji">🍒</span>
            <span className="logo-txt">
              CHERRY <em>SUSHI</em>
            </span>
          </div>
        </div>

        <div className="h-right">
          <div className="lang-wrap" ref={langRef}>
            <button
              className="hbtn lang-btn"
              onClick={() => {
                setLO(o => !o);
                setUO(false);
              }}
            >
              <span className="lang-badge">{cur.code.toUpperCase()}</span>
            </button>

            {langOpen && (
              <div className="lang-dd">
                {LANGS.map(l => (
                  <div
                    key={l.code}
                    className={'lang-row' + (lang === l.code ? ' on' : '')}
                    onClick={() => {
                      setLang(l.code);
                      setLO(false);
                    }}
                  >
                    <span className="lang-badge">{l.code.toUpperCase()}</span>
                    {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="hbtn" onClick={onSearchOpen} aria-label="Search">
            🔍
          </button>

         <button className="hbtn" onClick={() => (user ? onMyOrdersOpen() : onAuthOpen())} title={myOrdersText} aria-label={myOrdersText} style={{ position: 'relative' }}>
           📦
             {readyOrdersCount > 0 && <span className="h-cart-n">{readyOrdersCount > 9 ? '9+' : readyOrdersCount}</span>}
         </button>

          <button
            className={'hbtn h-cart-btn' + (count > 0 ? ' h-cart-btn--active' : '')}
            onClick={onCartOpen}
            aria-label="Cart"
            style={{ position: 'relative' }}
          >
            🛒
            {count > 0 && <span className="h-cart-n">{count > 9 ? '9+' : count}</span>}
          </button>

          <div className="lang-wrap" ref={userRef}>
            <button
              className={'hbtn' + (user ? '' : ' h-avatar--guest')}
              onClick={() => {
                setUO(o => !o);
                setLO(false);
              }}
              style={{ position: 'relative' }}
              aria-label="Account"
            >
              {user ? (
                <span style={{ fontSize: '.72rem', fontWeight: 900 }}>
                  {(user.name || 'U').slice(0, 2).toUpperCase()}
                </span>
              ) : (
                '👤'
              )}
            </button>

            {userOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: 230,
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 18px 50px rgba(0,0,0,.18)',
                  border: '1px solid #f1f5f9',
                  padding: 10,
                  zIndex: 9999,
                }}
              >
                {user ? (
                  <>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: '.9rem', color: '#111827' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: 3 }}>
                        {user.email || user.phone || ''}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onMyOrdersOpen();
                        setUO(false);
                      }}
                      style={menuBtn}
                    >
                      📦 {myOrdersText}
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setUO(false);
                      }}
                      style={menuBtn}
                    >
                      🚪 {lang === 'lv' ? 'Iziet' : lang === 'en' ? 'Sign out' : 'Выйти'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onAuthOpen();
                        setUO(false);
                      }}
                      style={menuBtn}
                    >
                      👤 {lang === 'lv' ? 'Pieteikties' : lang === 'en' ? 'Sign in' : 'Войти'}
                    </button>

                    <button
                      onClick={() => {
                        onAuthOpen();
                        setUO(false);
                      }}
                      style={menuBtn}
                    >
                      🎁 {lang === 'lv' ? 'Reģistrēties' : lang === 'en' ? 'Register' : 'Регистрация'}
                    </button>
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
