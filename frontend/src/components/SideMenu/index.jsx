import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const ADDRESS = 'Lokomotīves iela 100, Rīga';
const MAP_URL = 'https://maps.google.com/?q=Lokomotīves+iela+100+Riga+Latvia';

const ITEMS = [
  {id:'hit',e:'⭐'},{id:'cold',e:'🍣'},{id:'hot',e:'🔥'},
  {id:'tempura',e:'🍤'},{id:'special',e:'🎎'},{id:'sets',e:'🎁'},
  {id:'food',e:'🍜'},{id:'salad',e:'🥗'},{id:'snacks',e:'🍟'},{id:'drinks',e:'🥤'},
];

export default function SideMenu({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const t = T[lang];

  const go = id => {
    const el = document.getElementById('sec-'+id);
    if (el) { window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-120,behavior:'smooth'}); onClose(); }
  };

  return (
    <>
      {isOpen && <div className="side-bg" onClick={onClose} />}
      <nav className={'side-panel '+(isOpen?'open':'closed')}>

        {/* Header */}
        <div className="side-hd">
          <span className="side-hd-title">🍣 SUSHI RĪGA</span>
          <button className="side-x" onClick={onClose}>✕</button>
        </div>

        {/* Location */}
        <a href={MAP_URL} target="_blank" rel="noreferrer" className="side-location">
          <span className="side-location-pin">📍</span>
          <div>
            <div className="side-location-addr">{ADDRESS}</div>
            <div className="side-location-open">
              {lang==='ru'?'Открыть карту':lang==='lv'?'Atvērt karti':'Open map'} →
            </div>
          </div>
        </a>

        {/* Working hours */}
        <div className="side-hours">
          🕐 {lang==='ru'?'Ежедневно':lang==='lv'?'Katru dienu':'Daily'}: 11:00 – 23:00
        </div>

        {/* Nav items */}
        <div className="side-nav">
          {ITEMS.map(item => (
            <button key={item.id} className="side-navbtn" onClick={() => go(item.id)}>
              <span className="side-navbtn-e">{item.e}</span>
              {t['c_'+item.id] || item.id}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="side-footer">
          <a href="tel:+37100000000" style={{display:'block',marginBottom:4,color:'inherit'}}>📞 +371 XX XXX XXX</a>
          <a href="mailto:info@sushiriga.lv" style={{color:'inherit'}}>✉️ info@sushiriga.lv</a>
        </div>
      </nav>
    </>
  );
}
