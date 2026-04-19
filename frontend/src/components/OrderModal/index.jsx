import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { orderApi } from '../../services/api';
import T from '../../i18n/translations';
export default function OrderModal({ isOpen, onClose }) {
  const { cart, total, clear } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const [form, setForm] = useState({name:'',phone:'',address:'',note:''});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => {
    if(!form.name||!form.phone||!form.address){alert(t.fill);return;}
    setLoading(true);
    try{ await orderApi.create({...form,lang,items:cart.map(i=>({id:i.id,qty:i.qty}))}); clear(); setDone(true); }
    catch{alert('Error!');}
    finally{setLoading(false);}
  };
  if(!isOpen) return null;
  return(
    <>
      <div className="order-bg" onClick={onClose}/>
      <div className="order-sheet">
        <div className="order-handle"/>
        {!done?(
          <>
            <div className="order-title">{t.m_title}</div>
            {cart.map(i=>(
              <div key={i.id} className="order-item">
                <span>{i.e} {i.name[lang]} ×{i.qty}</span>
                <span>€{(i.price*i.qty).toFixed(2)}</span>
              </div>
            ))}
            <hr className="order-divider"/>
            <div className="order-total"><span>{t.total}</span><span>€{total.toFixed(2)}</span></div>
            {[['name','text',t.f_name],['phone','tel',t.f_phone],['address','text',t.f_addr],['note','text',t.f_note]].map(([k,type,label])=>(
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)} className="form-input" placeholder={label}/>
              </div>
            ))}
            <button className="btn-primary" onClick={submit} disabled={loading}>{loading?'...':`✅ ${t.confirm}`}</button>
            <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          </>
        ):(
          <div className="order-success">
            <div className="order-success-ico">🎉</div>
            <div className="order-success-t">{t.ok_title}</div>
            <div className="order-success-p">{t.ok_text}</div>
            <button className="btn-primary" style={{width:'auto',padding:'12px 32px'}} onClick={()=>{setDone(false);onClose();}}>{t.back}</button>
          </div>
        )}
      </div>
    </>
  );
}