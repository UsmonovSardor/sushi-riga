import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const ITEMS = [
  {id:'hit',e:'⭐',k:'c_hit'},{id:'cold',e:'🍣',k:'c_cold'},{id:'hot',e:'🔥',k:'c_hot'},
  {id:'tempura',e:'🍤',k:'c_tempura'},{id:'special',e:'🎎',k:'c_special'},
  {id:'double',e:'🎯',k:'c_double'},{id:'sets',e:'🎁',k:'c_sets'},
  {id:'food',e:'🍜',k:'c_food'},{id:'salad',e:'🥗',k:'c_salad'},
  {id:'snacks',e:'🍟',k:'c_snacks'},{id:'drinks',e:'🥤',k:'c_drinks'},
];

const MAP_URL = 'https://maps.google.com/?q=Lokomotīves+iela+100+Riga+Latvia';

export default function SideMenu({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const t = T[lang];

  const go = id => {
    const el = document.getElementById('sec-' + id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior:'smooth' });
      onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="side-bg" onClick={onClose} />}
      <nav className={'side-panel ' + (isOpen ? 'open' : 'closed')} aria-hidden={!isOpen}>
        <div className="side-hd">
          <span className="side-hd-title">🍣 SUSHI RĪGA</span>
          <button className="side-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <a href={MAP_URL} target="_blank" rel="noreferrer" className="side-location">
          <span className="side-location-pin">📍</span>
          <div>
            <div className="side-location-addr">{t.address}</div>
            <div className="side-location-open">
              {lang==='lv'?'Atvērt karti':lang==='en'?'Open map':'Открыть карту'} →
            </div>
          </div>
        </a>

        <div className="side-hours">🕐 {t.daily}: {t.hours}</div>

        <a href={`tel:${t.phone}`} className="side-phone">
          📞 {t.phone}
        </a>

        <div className="side-nav">
          {ITEMS.map(item => (
            <button key={item.id} className="side-navbtn" onClick={() => go(item.id)}>
              <span className="side-navbtn-e">{item.e}</span>
              {t[item.k]}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
