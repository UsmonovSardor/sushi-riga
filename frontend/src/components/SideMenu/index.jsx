import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function SideMenu({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const go = (id) => { const el = document.getElementById('sec-' + id); if (el) { el.scrollIntoView({ behavior:'smooth' }); onClose(); }};

  return (
    <>
      {isOpen && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1100 }} />}
      <nav style={{ position:'fixed', top:0, right:0, bottom:0, width:360, background:'#fff', zIndex:1200, transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition:'transform .35s cubic-bezier(.4,0,.2,1)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:'1.1rem', fontWeight:800 }}>{t.menu}</span>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', background:'var(--gray)', fontSize:'1.1rem' }}>✕</button>
        </div>
        <div style={{ padding:'12px 24px', fontSize:'.82rem', fontWeight:700, color:'var(--red)', borderBottom:'1px solid var(--border)' }}>📍 Rīga</div>
        <ul style={{ listStyle:'none', padding:'8px 0', flex:1 }}>
          {['hit','sets','rolls','sushi','hot','drinks'].map(id => (
            <li key={id}>
              <button onClick={() => go(id)} style={{ display:'block', width:'100%', padding:'14px 24px', textAlign:'left', fontSize:'.95rem', fontWeight:500, background:'none', border:'none', cursor:'pointer' }}>
                {t['c_'+id] || id}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
