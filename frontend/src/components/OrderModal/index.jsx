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
      <div className="stripe-head">
        <button className="stripe-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {L('Atpakaļ','Назад','Back')}
        </button>
        <span className="stripe-head-title">{L('Maksājums','Оплата картой','Payment')}</span>
      </div>

      <div className="stripe-amount">
        <div>
          <div className="stripe-amount-label">{L('Apmaksas summa','Сумма к оплате','Amount due')}</div>
          <div className="stripe-amount-val">€{total}</div>
        </div>
        <div className="stripe-amount-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
      </div>

      <div className="stripe-element">
        <PaymentElement options={{
          layout:'tabs',
          fields:{ billingDetails:{ name:'never', email:'never' } },
          wallets:{ applePay:'auto', googlePay:'auto' },
        }}/>
      </div>

      {err && <div className="stripe-err"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {err}</div>}

      <button className="stripe-pay-btn" onClick={pay} disabled={busy||!stripe}>
        {busy
          ? <><span className="spin"/> {L('Apstrādā...','Обработка...','Processing...')}</>
          : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> {L(`Apmaksāt €${total}`, `Оплатить €${total}`, `Pay €${total}`)}</>
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
  const { user, loading } = useAuth();
  const t = T[lang];
  const L = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;

  const [step,   setStep]  = useState('form');
  const [payM,   setPayM]  = useState('cash');
  const [form, setForm] = useState(()=>{ try{ const s=JSON.parse(localStorage.getItem('sr_form')||'{}'); return { name:s.name||'', surname:s.surname||'', address:s.address||'', phone:s.phone||'', note:'' }; } catch { return { name:'', surname:'', address:'', phone:'', note:'' }; } });
  const [busy,   setBusy]  = useState(false);
  const [err,    setErr]   = useState('');
  const [oid,    setOid]   = useState(null);
  const [secret, setSec]   = useState('');

  useEffect(()=>{ if(user) setForm(f=>({...f,name:user.name||f.name,surname:user.surname||f.surname,address:user.address||f.address,phone:user.phone||f.phone})); },[user]);
  useEffect(()=>{ if(isOpen){setStep('form');setErr('');} },[isOpen]);

  const sf = (k,v) => setForm(f=>{
    const n={...f,[k]:v};
   try{localStorage.setItem('sr_form',JSON.stringify({name:n.name,surname:n.surname,address:n.address,phone:n.phone}));}catch{}
    return n;
  });

  const submit = async () => {
    setErr('');
    if (!form.name.trim()) return setErr(L('Ievadiet vārdu','Введите имя','Enter name'));
    if (!form.surname.trim()) return setErr(L('Ievadiet uzvārdu','Введите фамилию','Enter surname'));
    if (!form.address.trim()) return setErr(L('Ievadiet adresi','Введите адрес','Enter address'));
    if (!form.phone.trim()) return setErr(L('Ievadiet tālruni','Введите телефон','Enter phone'));
    setBusy(true);
    try {
      const token = localStorage.getItem('sr_token');
      const headers = {'Content-Type':'application/json'};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const or = await fetch(`${BASE}/api/orders`,{
        method:'POST', headers,
        body:JSON.stringify({...form,lang,payMethod:payM,items:cart.map(i=>({id:i.id,qty:i.qty}))}),
      });
      const od = await or.json();
      if (!or.ok) throw new Error(od.errors?.[0]?.msg||od.error||'Error');
      setOid(od.orderId);
      if (payM==='cash'||!stripeP){ clear(); setStep('done'); return; }
      const pr = await fetch(`${BASE}/api/payment/create-intent`,{
        method:'POST', headers,
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
        <div className="order-modal-handle"/>

        {/* ─ Gate: not logged in ─ */}
        {!loading && !user && (
          <div className="order-gate">
            <div className="order-gate-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="gate-title">{L('Piegādes dati','Данные доставки','Delivery details')}</div>
            <div className="gate-sub">{L('Ievadiet piegādes datus, lai turpinātu pasūtījumu','Введите данные доставки, чтобы продолжить заказ','Enter delivery details to continue your order')}</div>
            <div className="gate-benefits">
              <div className="gate-benefit"><span>⚡</span>{L('Ātra reģistrācija','Быстрая регистрация','Quick registration')}</div>
              <div className="gate-benefit"><span>📦</span>{L('Pasūtījumu vēsture','История заказов','Order history')}</div>
              <div className="gate-benefit"><span>🎁</span>{L('Bonusa programma','Бонусная программа','Bonus program')}</div>
            </div>
            <button className="gate-btn" onClick={()=>{onClose();setTimeout(onOpenAuth,80);}}>
              {L('Ievadīt datus','Ввести данные','Enter details')}
            </button>
          </div>
        )}

        {/* ─ Form ─ */}
        {!loading && user && step==='form' && <>
          <div className="order-header">
            <span className="order-header-title">{L('Noformēt pasūtījumu','Оформить заказ','Checkout')}</span>
            <button className="order-close-btn" onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Cart items */}
          <div className="order-items-block">
            <div className="order-items-list">
              {cart.map(i=>(
                <div key={i.id} className="order-item-row">
                  <span className="oitem-e">{i.e}</span>
                  <span className="oitem-name">{i.name[lang]}</span>
                  <span className="oitem-qty">×{i.qty}</span>
                  <span className="oitem-sum">€{(i.price*i.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-total-bar">
              <span>{t.total}</span>
              <span className="order-total-price">€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Contact fields */}
          <div className="order-fields">
            {[
             ['name','text','name',L('Vārds','Имя','Name'),'*',L('Jūsu vārds','Ваше имя','Your name'),
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>],
             ['surname','text','family-name',L('Uzvārds','Фамилия','Surname'),'*',L('Jūsu uzvārds','Ваша фамилия','Your surname'),
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>],
            ['address','text','street-address',L('Adrese','Адрес','Address'),'*',L('Piegādes adrese','Адрес доставки','Delivery address'),
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>],
          ['phone','tel','tel',L('Tālrunis','Телефон','Phone'),'*','+371 XX XXX XXX',
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>],
           ['note','text','off',L('Piezīmes','Комментарий','Comment'),'',L('Bez sīpoliem...','Без лука...','No onion...'),
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>],

            ].map(([k,type,ac,lbl,req,ph,ico])=>(
              <div key={k} className="ofield">
                <label className="ofield-label">{lbl}{req&&<span className="req"> {req}</span>}</label>
                <div className="ofield-input-w">
                  <span className="ofield-ico">{ico}</span>
                  <input className="ofield-input" type={type} autoComplete={ac} inputMode={type==='tel'?'tel':'text'} placeholder={ph} value={form[k] || ''} onChange={e=>sf(k,e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          {/* Payment method */}
          <div className="pay-section-title">{L('Apmaksas veids','Способ оплаты','Payment method')}</div>
          <div className="pay-opts">
            {[
              ['cash',
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
                L('Skaidra nauda','Наличные','Cash'),
                L('Pie saņemšanas','При получении','On pickup')],
              ['card',
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
                'Visa / Mastercard',
              L('Apple Pay · Google Pay','Apple Pay · Google Pay','Apple Pay · Google Pay')],
            ].map(([k,ico,name,hint])=>(
              <button key={k} className={'pay-opt'+(payM===k?' active':'')} onClick={()=>setPayM(k)}>
                <span className="pay-opt-ico">{ico}</span>
                <span className="pay-opt-info">
                  <span className="pay-opt-name">{name}</span>
                  <span className="pay-opt-hint">{hint}</span>
                </span>
                <span className={'pay-opt-check'+(payM===k?' on':'')}>
                  {payM===k && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
              </button>
            ))}
          </div>

          {err && <div className="oerr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {err}</div>}

          <div className="order-submit-wrap">
            <button className="order-submit-btn" onClick={submit} disabled={busy}>
              {busy
                ? <><span className="spin"/> {L('Apstrādā...','Обработка...','Processing...')}</>
                : payM==='cash'
                  ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> {L('Apstiprināt pasūtījumu','Подтвердить заказ','Confirm order')}</>
                  : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> {L(`Apmaksāt €${total.toFixed(2)}`,`Оплатить €${total.toFixed(2)}`,`Pay €${total.toFixed(2)}`)}</>
              }
            </button>
          </div>
        </>}

        {/* ─ Stripe payment ─ */}
        {user && step==='pay' && secret && stripeP && (
          <Elements stripe={stripeP} options={{
            clientSecret:secret,
            appearance:{
              theme:'stripe',
              variables:{
                colorPrimary:'#e31e24', colorBackground:'#fff',
                colorText:'#111', fontFamily:'Inter,system-ui,sans-serif',
                borderRadius:'12px', fontSizeBase:'15px',
              },
              rules:{
                '.Input':{border:'1.5px solid #d1d5db',boxShadow:'none',padding:'12px 14px'},
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

        {/* ─ Success ─ */}
        {user && step==='done' && (
          <div className="order-done">
            <div className="done-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="done-title">{t.ok_title}</div>
            <div className="done-num">#{oid}</div>
            <div className="done-sub">{t.ok_text}</div>
            <button className="done-btn" onClick={()=>{setStep('form');onClose();}}>
              {L('Labi! 👍','Отлично! 👍','Great! 👍')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
