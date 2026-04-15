import React from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Cart({ onCheckout }) {
  const { cart, change, subtotal, delivery, total, count, isOpen, setIsOpen } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];

  return (
    <>
      {isOpen && <div onClick={() => setIsOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1100 }} />}
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:420, background:'#fff', zIndex:1200, transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition:'transform .35s cubic-bezier(.4,0,.2,1)', display:'flex', flexDirection:'column', boxShadow:'-6px 0 40px rgba(0,0,0,.14)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:'1.15rem', fontWeight:800 }}>{t.cart_title}</span>
          <button onClick={() => setIsOpen(false)} style={{ width:36, height:36, borderRadius:'50%', background:'var(--gray)', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {!cart.length
            ? <div style={{ textAlign:'center', padding:40 }}><div style={{ fontSize:'3rem', marginBottom:12 }}>🛒</div><b>{t.empty_t}</b><p style={{ marginTop:6, fontSize:'.83rem', color:'var(--muted)' }}>{t.empty_p}</p></div>
            : cart.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:58, height:58, borderRadius:10, background:'var(--gray)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.9rem', flexShrink:0, overflow:'hidden' }}>
                  <img src={item.img} alt="" onError={e => e.target.style.display='none'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'.88rem' }}>{item.name[lang]}</div>
                  <div style={{ color:'var(--red)', fontWeight:600, fontSize:'.83rem' }}>€{(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => change(item.id, -1)} style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid var(--border)', fontWeight:800, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontWeight:700, minWidth:16, textAlign:'center' }}>{item.qty}</span>
                  <button onClick={() => change(item.id, +1)} style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid var(--border)', fontWeight:800, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                </div>
              </div>
            ))
          }
        </div>
        {cart.length > 0 && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:'.9rem' }}><span>{t.subtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, fontSize:'.9rem' }}><span>{t.delivery}</span><span>{delivery === 0 ? `✅ ${t.free}` : `€${delivery.toFixed(2)}`}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1.05rem', marginBottom:16 }}><span>{t.total}</span><span>€{total.toFixed(2)}</span></div>
            <button onClick={onCheckout} style={{ width:'100%', background:'var(--red)', color:'#fff', borderRadius:12, padding:'15px 0', fontWeight:800, fontSize:'1rem', border:'none', cursor:'pointer' }}>{t.checkout}</button>
          </div>
        )}
      </div>
    </>
  );
}
