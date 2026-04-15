import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Footer() {
  const { lang } = useLanguage();
  const t = T[lang];
  return (
    <footer style={{ background:'#1a1a1a', color:'rgba(255,255,255,.75)', padding:'40px 40px 24px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:32, marginBottom:32 }}>
        <div>
          <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#fff', marginBottom:12 }}>🍣 SUSHI <span style={{ color:'var(--red)' }}>RĪGA</span></div>
          <p style={{ fontSize:'.85rem', lineHeight:1.6 }}>{t.f_desc}</p>
        </div>
        <div>
          <div style={{ fontWeight:700, color:'#fff', marginBottom:12, fontSize:'.85rem', textTransform:'uppercase', letterSpacing:'.5px' }}>{t.c_rolls}</div>
          {['hit','sets','rolls','sushi','hot','drinks'].map(k => (
            <div key={k} style={{ fontSize:'.85rem', marginBottom:6 }}>{t['c_'+k]}</div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight:700, color:'#fff', marginBottom:12, fontSize:'.85rem', textTransform:'uppercase', letterSpacing:'.5px' }}>{t.s_contacts}</div>
          <div style={{ fontSize:'.85rem', marginBottom:6 }}>📞 +371 XX XXX XXX</div>
          <div style={{ fontSize:'.85rem', marginBottom:6 }}>✉️ info@sushiriga.lv</div>
          <div style={{ fontSize:'.85rem' }}>📍 {t.city}</div>
        </div>
        <div>
          <div style={{ fontWeight:700, color:'#fff', marginBottom:12, fontSize:'.85rem', textTransform:'uppercase', letterSpacing:'.5px' }}>11:00 – 23:00</div>
          <div style={{ fontSize:'.85rem', marginBottom:6 }}>Пн–Пт: 11:00–22:30</div>
          <div style={{ fontSize:'.85rem' }}>Сб–Вс: 11:00–23:00</div>
        </div>
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:20, display:'flex', justifyContent:'space-between', fontSize:'.82rem' }}>
        <span>© 2026 Sushi Rīga. {t.f_rights}</span>
        <span>Made with ❤️ in Rīga</span>
      </div>
    </footer>
  );
}
