import React, { useState, useEffect } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import T from '../../i18n/translations';

const FLAGS = { ru:'🇷🇺', lv:'🇱🇻', en:'🇬🇧' };

export default function Header({ onSearch, onMenu, onAuth }) {
  const { count, setIsOpen } = useCart();
  const { lang, setLang }    = useLanguage();
  const { user, logout }     = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notif,    setNotif]    = useState(0);
  const t = T[lang];

  // Notification: show badge when user logged in (promo) or has new order
  useEffect(() => {
    const seen = localStorage.getItem('sr_notif_seen');
    if (!seen) setNotif(1);
  }, [user]);

  const clearNotif = () => { setNotif(0); localStorage.setItem('sr_notif_seen','1'); };
  const closeAll   = () => { setLangOpen(false); setUserOpen(false); };

  return (
    <header className="header" onClick={closeAll}>
      <div className="header-in">

        {/* ── LEFT: ☰ + 🍣 + SUSHI RĪGA ── */}
        <div className="h-left">
          <button className="h-burger" onClick={e=>{ e.stopPropagation(); onMenu(); }} aria-label="Меню">
            <span/><span/><span/>
          </button>
          <span className="logo-emoji">🍣</span>
          <span className="logo-txt">SUSHI <em>RĪGA</em></span>
        </div>

        {/* ── RIGHT: RU + 🔍 + 🛒 + 👤 ── */}
        <div className="h-right">

          {/* Language */}
          <div className="lang-wrap" onClick={e=>e.stopPropagation()}>
            <button className="hbtn lang-btn"
              onClick={()=>{ setLangOpen(o=>!o); setUserOpen(false); }}>
              {FLAGS[lang]} <span className="lang-code">{lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="lang-dd">
                {Object.entries(FLAGS).map(([l,f])=>(
                  <div key={l} className={'lang-row'+(l===lang?' on':'')}
                    onClick={()=>{ setLang(l); setLangOpen(false); }}>
                    {f} {l.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="hbtn" onClick={e=>{ e.stopPropagation(); onSearch(); }} aria-label="Поиск">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* 🛒 Cart — always visible in header */}
          <button className="h-cart-ico" onClick={e=>{ e.stopPropagation(); setIsOpen(true); }} aria-label="Корзина">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {count > 0 && <span className="h-cart-n">{count}</span>}
          </button>

          {/* 👤 User + 🔴 notification */}
          <div className="lang-wrap" onClick={e=>e.stopPropagation()}>
            {user ? (
              <>
                <button className="h-avatar"
                  onClick={()=>{ setUserOpen(o=>!o); setLangOpen(false); clearNotif(); }}>
                  {user.name.charAt(0).toUpperCase()}
                  {notif > 0 && <span className="h-notif-dot"/>}
                </button>
                {userOpen && (
                  <div className="lang-dd user-dd">
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="lang-row user-promo">
                      🎁 Скидка 10% на 1й заказ
                    </div>
                    <div className="lang-row" onClick={()=>{ logout(); setUserOpen(false); }}>
                      🚪 Выйти
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button className="h-avatar h-avatar--guest"
                onClick={()=>{ onAuth(); clearNotif(); closeAll(); }} title="Войти">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {notif > 0 && <span className="h-notif-dot"/>}
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
