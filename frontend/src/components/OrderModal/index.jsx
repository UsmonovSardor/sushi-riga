import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import T from '../../i18n/translations';

const BASE    = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
const PK      = import.meta.env.VITE_STRIPE_PK || '';
const stripeP = PK ? loadStripe(PK) : null;

function PayForm({ total, lang, onDone, onBack }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const L = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;

  const pay = async () => {
    if (!stripe||!elements) return;
    setBusy(true); setErr('');
    const { error } = await stripe.confirmPayment({ elements, redirect:'if_required' });
    if (error) { setErr(error.message); setBusy(false); }
    else       { onDone(); }
  };

  return (
    <div className="stripe-wrap">
      {/* Back header */}
      <div className="stripe-head">
        <button className="stripe-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {L('Atpakaļ','Назад','Back')}
        </button>
        <span className="stripe-head-title">{L('Maksājums','Оплата','Payment')}</span>
      </div>

      {/* Amount badge */}
      <div className="stripe-amount">
        <span className="stripe-amount-label">{L('Summa','Итого','Total')}</span>
        <span className="stripe-amount-val">€{total}</span>
      </div>

      {/* Stripe Element */}
      <div className="stripe-element">
        <PaymentElement options={{
          layout:'tabs',
          fields:{ billingDetails:{ name:'never', email:'never' } },
          wallets:{ applePay:'auto', googlePay:'auto' },
        }}/>
      </div>

      {err && <div className="stripe-err">⚠️ {err}</div>}

      <button className="stripe-pay-btn" onClick={pay} disabled={busy||!stripe}>
        {busy
          ? <><span className="spin"/> {L('Apstrādā...','Обработка...','Processing...')}</>
          : L(`Apmaksāt €${total}`, `Оплатить €${total}`, `Pay €${total}`)
        }
      </button>

      <div className="stripe-security">
        <svg width="12" height="14" viewBox="0 0 24 28" fill="currentColor"><path d="M12 0L2 4v9c0 7 4.7 13.2 10 15 5.3-1.8 10-8 10-15V4L12 0z"/></svg>
        <span>{L('Droša apmaksa ar Stripe','Защищено Stripe','Secured by Stripe')}</span>
        <span className="stripe-cards">VISA · MC · Amex</span>
      </div>
    </div>
  );
}

export default function OrderModal({ isOpen, onClose, onOpenAuth }) {
  const { cart, total, clear } = useCart();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = T[lang];
  const L = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;

  const [step,   setStep]  = useState('form');
  const [payM,   setPayM]  = useState('cash');
  const [form,   setForm]  = useState(()=>{
    try{ const s=JSON.parse(localStorage.getItem('sr_form')||'{}'); return{name:s.name||'',phone:s.phone||'',note:''}; }
    catch{ return{name:'',phone:'',note:''}; }
  });
  const [busy,   setBusy]  = useState(false);
  const [err,    setErr]   = useState('');
  const [oid,    setOid]   = useState(null);
  const [secret, setSec]   = useState('');

  useEffect(()=>{ if(user) setForm(f=>({...f,name:user.name||f.name,phone:user.phone||f.phone})); },[user]);
  useEffect(()=>{ if(isOpen){setStep('form');setErr('');} },[isOpen]);

  const sf = (k,v) => setForm(f=>{
    const n={...f,[k]:v};
    try{localStorage.setItem('sr_form',JSON.stringify({name:n.name,phone:n.phone}));}catch{}
    return n;
  });

  const submit = async () => {
    setErr('');
    if (!form.name.trim())  return setErr(L('Ievadiet vārdu','Введите имя','Enter name'));
    if (!form.phone.trim()) return setErr(L('Ievadiet tālruni','Введите телефон','Enter phone'));
    setBusy(true);
    try {
      const or = await fetch(`${BASE}/api/orders`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,lang,payMethod:payM,items:cart.map(i=>({id:i.id,qty:i.qty}))}),
      });
      const od = await or.json();
      if (!or.ok) throw new Error(od.errors?.[0]?.msg||od.error||'Error');
      setOid(od.orderId);
      if (payM==='cash'||!stripeP){ clear(); setStep('done'); return; }
      const pr = await fetch(`${BASE}/api/payment/create-intent`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({amount:total,orderId:od.orderId}),
      });
      const pd = await pr.json();
      if (!pr.ok) throw new Error(pd.error||'Payment error');
      setSec(pd.clientSecret); setStep('pay');
    } catch(e){ setErr(e.message); }
    finally{ setBusy(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-bg" onClick={onClose}/>
      <div className="order-modal">
        <div className="modal-drag"/>

        {/* ─ Gate ─ */}
        {!user && (
          <div className="order-gate">
            <div className="gate-ico">🔐</div>
            <div className="gate-title">{t.login_required}</div>
            <div className="gate-sub">{L('Reģistrējieties, lai pasūtītu','Войдите, чтобы сделать заказ','Sign in to place an order')}</div>
            <button className="primary-btn" onClick={()=>{onClose();setTimeout(onOpenAuth,80);}}>
              {t.login_btn}
            </button>
          </div>
        )}

        {/* ─ Form ─ */}
        {user && step==='form' && <>
          <div className="order-header">
            <span className="order-header-title">{L('Noformēt pasūtījumu','Оформить заказ','Checkout')}</span>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Cart items */}
          <div className="order-items-block">
            {cart.map(i=>(
              <div key={i.id} className="order-item-row">
                <span className="oitem-e">{i.e}</span>
                <span className="oitem-name">{i.name[lang]}</span>
                <span className="oitem-qty">×{i.qty}</span>
                <span className="oitem-sum">€{(i.price*i.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-total-bar">
              <span>{t.total}</span>
              <span className="order-total-price">€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="order-fields">
            {[
              ['name','text','name',L('Vārds','Имя','Name'),'*',L('Jūsu vārds','Ваше имя','Your name'),'👤'],
              ['phone','tel','tel',L('Tālrunis','Телефон','Phone'),'*','+371 XX XXX XXX','📞'],
              ['note','text','off',L('Piezīmes','Комментарий','Note'),'',L('Bez sīpoliem...','Без лука...','No onion...'),'💬'],
            ].map(([k,type,ac,lbl,req,ph,ico])=>(
              <div key={k} className="ofield">
                <label className="ofield-label">{lbl}{req&&<span className="req"> {req}</span>}</label>
                <div className="ofield-input-w">
                  <span className="ofield-ico">{ico}</span>
                  <input className="ofield-input" type={type} autoComplete={ac}
                    inputMode={type==='tel'?'tel':'text'} placeholder={ph}
                    value={form[k]} onChange={e=>sf(k,e.target.value)}/>
                </div>
              </div>
            ))}
          </div>

          {/* Payment */}
          <div className="pay-section-title">{L('Apmaksas veids','Способ оплаты','Payment method')}</div>
          <div className="pay-opts">
            {[
              ['cash','💵',L('Skaidra nauda','Наличные','Cash'),L('Pie saņemšanas','При получении','On pickup')],
              ['card','💳','Visa / Mastercard','Apple Pay · Google Pay'],
            ].map(([k,ico,name,hint])=>(
              <button key={k} className={'pay-opt'+(payM===k?' active':'')} onClick={()=>setPayM(k)}>
                <span className="pay-opt-ico">{ico}</span>
                <span className="pay-opt-info">
                  <span className="pay-opt-name">{name}</span>
                  <span className="pay-opt-hint">{hint}</span>
                </span>
                <span className={'pay-opt-dot'+(payM===k?' on':'')}/>
              </button>
            ))}
          </div>

          {err && <div className="oerr">⚠️ {err}</div>}

          <button className="primary-btn order-submit-btn" onClick={submit} disabled={busy}>
            {busy
              ? <><span className="spin"/> {L('Apstrādā...','Обработка...','Processing...')}</>
              : payM==='cash'
                ? L('✅ Apstiprināt','✅ Подтвердить заказ','✅ Confirm order')
                : `💳 ${L('Turpināt apmaksu →','К оплате →','Continue to payment →')}`
            }
          </button>
        </>}

        {/* ─ Stripe ─ */}
        {user && step==='pay' && secret && stripeP && (
          <Elements stripe={stripeP} options={{
            clientSecret:secret,
            appearance:{
              theme:'stripe',
              variables:{
                colorPrimary:'#e31e24', colorBackground:'#fff',
                colorText:'#111', fontFamily:'Inter,system-ui,sans-serif',
                borderRadius:'11px', fontSizeBase:'15px',
              },
              rules:{
                '.Input':{border:'1.5px solid #d1d5db',boxShadow:'none',padding:'11px 13px'},
                '.Input:focus':{border:'1.5px solid #e31e24',boxShadow:'0 0 0 3px rgba(227,30,36,.1)'},
                '.Tab':{border:'1.5px solid #e5e7eb',borderRadius:'10px'},
                '.Tab--selected':{border:'2px solid #e31e24'},
                '.Label':{fontWeight:'600',fontSize:'13px',color:'#374151'},
              },
            },
            locale:lang==='lv'?'lv':lang==='en'?'en':'ru',
          }}>
            <PayForm total={total.toFixed(2)} lang={lang}
              onDone={()=>{clear();setStep('done');}}
              onBack={()=>setStep('form')}/>
          </Elements>
        )}

        {/* ─ Done ─ */}
        {user && step==='done' && (
          <div className="order-done">
            <div className="done-ring">🎉</div>
            <div className="done-title">{t.ok_title}</div>
            <div className="done-num">#{oid}</div>
            <div className="done-sub">{t.ok_text}</div>
            <button className="primary-btn done-btn" onClick={()=>{setStep('form');onClose();}}>
              {L('Lieliski! 👍','Отлично! 👍','Great! 👍')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
