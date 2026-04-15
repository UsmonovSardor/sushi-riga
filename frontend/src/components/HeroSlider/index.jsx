import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

const SLIDES = [
  { bg:'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=400&fit=crop', overlay:'rgba(227,30,36,.85)', titleKey:'s1t', subKey:'s1s', target:'rolls' },
  { bg:'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&h=400&fit=crop', overlay:'rgba(15,30,80,.9)', titleKey:'s2t', subKey:'s2s', target:'rolls' },
  { bg:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=400&fit=crop', overlay:'rgba(180,80,0,.88)', titleKey:'s3t', subKey:'s3s', target:'sets' },
];

export default function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const { lang } = useLanguage();
  const t = T[lang];

  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const go = (id) => { const el = document.getElementById('sec-' + id); if (el) el.scrollIntoView({ behavior:'smooth' }); };

  return (
    <div style={{ margin:'20px 40px', borderRadius:20, overflow:'hidden', position:'relative', height:320 }}>
      {SLIDES.map((s, i) => (
        <div key={i} style={{ position:'absolute', inset:0, opacity: i===idx ? 1 : 0, transition:'opacity .7s', pointerEvents: i===idx ? 'all' : 'none' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:`url(${s.bg})`, backgroundSize:'cover', backgroundPosition:'center' }} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${s.overlay} 0%,transparent 100%)` }} />
          <div style={{ position:'relative', zIndex:1, padding:44, color:'#fff', maxWidth:500 }}>
            <div style={{ fontSize:'2.2rem', fontWeight:900, lineHeight:1.1, marginBottom:10 }} dangerouslySetInnerHTML={{ __html: t[s.titleKey] }} />
            <div style={{ opacity:.88, marginBottom:24 }}>{t[s.subKey]}</div>
            <button onClick={() => go(s.target)}
              style={{ background:'#fff', color:'var(--red)', borderRadius:10, padding:'13px 28px', fontWeight:800, fontSize:'.94rem', border:'none', cursor:'pointer' }}>
              {t.s_order}
            </button>
          </div>
        </div>
      ))}
      <div style={{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', display:'flex', gap:7, zIndex:2 }}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)}
            style={{ width: i===idx ? 26 : 8, height:8, borderRadius: i===idx ? 4 : '50%', background: i===idx ? '#fff' : 'rgba(255,255,255,.5)', cursor:'pointer', transition:'all .3s' }} />
        ))}
      </div>
    </div>
  );
}
