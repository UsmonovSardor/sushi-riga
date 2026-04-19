import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
const ITEMS = ['hit','sets','cold','hot','tempura','special','food','salad','snacks','drinks'];
export default function SideMenu({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const go = id => {
    const el = document.getElementById('sec-'+id);
    if(el){ window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-120,behavior:'smooth'}); onClose(); }
  };
  return (
    <>
      {isOpen && <div className="side-bg" onClick={onClose}/>}
      <nav className={'side-panel '+(isOpen?'open':'closed')}>
        <div className="side-hd">
          <span className="side-hd-title">{t.menu||'Меню'}</span>
          <button className="side-x" onClick={onClose}>✕</button>
        </div>
        <div className="side-city">📍 Rīga, Latvija</div>
        <div className="side-nav">
          {ITEMS.map(id=>(
            <button key={id} className="side-navbtn" onClick={()=>go(id)}>
              {t['c_'+id]||id}
            </button>
          ))}
        </div>
        <div className="side-footer">📞 +371 XX XXX XXX · info@sushiriga.lv</div>
      </nav>
    </>
  );
}