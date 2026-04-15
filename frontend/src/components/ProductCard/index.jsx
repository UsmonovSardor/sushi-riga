import React from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function ProductCard({ item, delay = 0 }) {
  const { add }  = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const sale = item.old ? Math.round((1 - item.price / item.old) * 100) : 0;

  return (
    <div onClick={() => add(item)}
      style={{ background:'#fff', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.07)', cursor:'pointer', animation:`fadeUp .4s ${delay}ms ease both`, transition:'box-shadow .25s,transform .25s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.12)'; e.currentTarget.style.transform='translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,.07)'; e.currentTarget.style.transform=''; }}>
      <div style={{ height:190, position:'relative', overflow:'hidden', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {item.hit && <div style={{ position:'absolute', top:10, left:10, zIndex:1, background:'var(--red)', color:'#fff', fontSize:'.62rem', fontWeight:800, padding:'3px 8px', borderRadius:6, textTransform:'uppercase' }}>{t.b_hit}</div>}
        {sale > 0 && <div style={{ position:'absolute', top:10, right:10, zIndex:1, background:'#ff9800', color:'#fff', fontSize:'.62rem', fontWeight:800, padding:'3px 8px', borderRadius:6 }}>-{sale}%</div>}
        <img src={item.img} alt={item.name[lang]} onError={e => e.target.style.display='none'}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
        <span style={{ fontSize:'4.5rem', lineHeight:1, position:'absolute', zIndex:0 }}>{item.e}</span>
      </div>
      <div style={{ padding:'12px 14px 14px' }}>
        <div style={{ fontWeight:700, color:'var(--dark)', marginBottom:5, lineHeight:1.3 }}>{item.name[lang]}</div>
        <div style={{ fontSize:'.76rem', color:'var(--muted)', lineHeight:1.45, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.desc[lang]}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:'1.1rem', fontWeight:800 }}>€{item.price.toFixed(2)}</span>
            {item.old && <span style={{ fontSize:'.75rem', color:'var(--muted)', textDecoration:'line-through' }}>€{item.old.toFixed(2)}</span>}
          </div>
          <button onClick={e => { e.stopPropagation(); add(item); }}
            style={{ width:36, height:36, borderRadius:'50%', background:'var(--red)', color:'#fff', fontSize:'1.5rem', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer', boxShadow:'0 2px 10px rgba(227,30,36,.35)' }}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}
