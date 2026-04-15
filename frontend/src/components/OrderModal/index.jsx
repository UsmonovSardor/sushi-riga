import React, { useState } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { orderApi }    from '../../services/api';
import T from '../../i18n/translations';

export default function OrderModal({ isOpen, onClose }) {
  const { cart, total, clear } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const [form, setForm] = useState({ name:'', phone:'', address:'', note:'' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name || !form.phone || !form.address) { alert(t.fill); return; }
    setLoading(true);
    try {
      await orderApi.create({ ...form, lang, items: cart.map(i => ({ id: i.id, qty: i.qty })) });
      clear();
      setDone(true);
    } catch { alert('Error!'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1300 }} />
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:560, background:'#fff', borderRadius:'24px 24px 0 0', zIndex:1400, padding:'24px 28px 36px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ width:40, height:4, background:'#e0e0e0', borderRadius:2, margin:'0 auto 20px' }} />
        {!done ? (
          <>
            <div style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:16 }}>{t.m_title}</div>
            {cart.map(i => (
              <div key={i.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'.88rem', marginBottom:6 }}>
                <span>{i.e} {i.name[lang]} ×{i.qty}</span>
                <span>€{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, margin:'12px 0 20px', paddingTop:12, borderTop:'1px solid var(--border)' }}>
              <span>{t.total}</span><span>€{total.toFixed(2)}</span>
            </div>
            {[['name','text',t.f_name],['phone','tel',t.f_phone],['address','text',t.f_addr],['note','text',t.f_note]].map(([k,type,label]) => (
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', marginBottom:6, color:'var(--muted)' }}>{label}</label>
                <input type={type} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                  style={{ width:'100%', padding:'12px 14px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:'.92rem', outline:'none' }} />
              </div>
            ))}
            <button onClick={submit} disabled={loading}
              style={{ width:'100%', background:'var(--red)', color:'#fff', borderRadius:12, padding:'15px 0', fontWeight:800, fontSize:'1rem', border:'none', cursor:'pointer', marginBottom:10 }}>
              {loading ? '...' : `✅ ${t.confirm}`}
            </button>
            <button onClick={onClose} style={{ width:'100%', background:'var(--gray)', color:'var(--dark)', borderRadius:12, padding:'13px 0', fontWeight:600, fontSize:'.92rem', border:'none', cursor:'pointer' }}>{t.cancel}</button>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'4rem', marginBottom:16 }}>🎉</div>
            <h3 style={{ fontSize:'1.4rem', fontWeight:900, marginBottom:8 }}>{t.ok_title}</h3>
            <p style={{ color:'var(--muted)', marginBottom:24 }}>{t.ok_text}</p>
            <button onClick={() => { setDone(false); onClose(); }}
              style={{ background:'var(--red)', color:'#fff', borderRadius:12, padding:'13px 32px', fontWeight:800, border:'none', cursor:'pointer' }}>{t.back}</button>
          </div>
        )}
      </div>
    </>
  );
}
