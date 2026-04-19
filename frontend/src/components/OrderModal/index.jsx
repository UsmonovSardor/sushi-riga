import React, { useState, useEffect } from 'react';
import { loadStripe }    from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';

const API       = import.meta.env.VITE_API_URL || '';
const STRIPE_PK = import.meta.env.VITE_STRIPE_PK || '';
const stripeP   = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

/* ── Stripe payment form ── */
function StripeForm({ amount, onSuccess, onBack, lang }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setErr('');
    const { error } = await stripe.confirmPayment({ elements, redirect:'if_required' });
    if (error) { setErr(error.message); setBusy(false); }
    else        { onSuccess(); }
  };

  return (
    <div className="stripe-wrap">
      <div className="pay-amount">€{amount}</div>
      <div className="pay-hint">
        {lang==='ru'?'Visa · Mastercard · Apple Pay · Google Pay':
         lang==='lv'?'Visa · Mastercard · Apple Pay · Google Pay':
         'Visa · Mastercard · Apple Pay · Google Pay'}
      </div>
      <div className="stripe-elem-wrap">
        <PaymentElement options={{ layout:'tabs' }} />
      </div>
      {err && <div className="order-error">{err}</div>}
      <button className="btn-primary" onClick={pay} disabled={busy} style={{marginTop:14}}>
        {busy ? '⏳...' : `💳 ${lang==='ru'?'Оплатить':lang==='lv'?'Apmaksāt':'Pay'} €${amount}`}
      </button>
      <button className="btn-secondary" onClick={onBack}>
        ← {lang==='ru'?'Назад':lang==='lv'?'Atpakaļ':'Back'}
      </button>
      <div className="stripe-secure">🔒 {lang==='ru'?'Защищено Stripe':lang==='lv'?'Aizsargāts ar Stripe':'Secured by Stripe'}</div>
    </div>
  );
}

/* ── Main Modal ── */
export default function OrderModal({ isOpen, onClose }) {
  const { cart, total, clear } = useCart();
  const { lang }  = useLanguage();
  const { user }  = useAuth();

  const [step,      setStep]  = useState('form');
  const [form,      setForm]  = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('sr_form')||'{}');
      return { name:s.name||'', phone:s.phone||'', note:'' };
    } catch { return { name:'', phone:'', note:'' }; }
  });
  const [payMethod, setPay]   = useState('cash');
  const [loading,   setLoad]  = useState(false);
  const [error,     setError] = useState('');
  const [orderId,   setOId]   = useState(null);
  const [secret,    setSecret]= useState('');

  const lbl = (ru,lv,en) => lang==='ru'?ru:lang==='lv'?lv:en;

  useEffect(() => {
    if (user) setForm(f => ({...f, name:user.name||f.name, phone:user.phone||f.phone}));
  }, [user]);
  useEffect(() => { if(isOpen){ setStep('form'); setError(''); } }, [isOpen]);

  const set = (k,v) => {
    setForm(f => {
      const next = {...f,[k]:v};
      try { localStorage.setItem('sr_form', JSON.stringify({name:next.name,phone:next.phone})); } catch{}
      return next;
    });
  };

  const submit = async () => {
    setError('');
    if (!form.name.trim())  { setError(lbl('Введите имя','Ievadiet vārdu','Enter name'));     return; }
    if (!form.phone.trim()) { setError(lbl('Введите телефон','Ievadiet tālruni','Enter phone')); return; }
    setLoad(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, lang, payMethod, items: cart.map(i=>({id:i.id,qty:i.qty})) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error||'Error');
      setOId(d.orderId);

      if (payMethod === 'cash' || !stripeP) {
        clear(); setStep('done');
      } else {
        const pr = await fetch(`${API}/api/payment/create-intent`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ amount: total, orderId: d.orderId }),
        });
        const pd = await pr.json();
        if (!pr.ok) throw new Error(pd.error);
        setSecret(pd.clientSecret);
        setStep('pay');
      }
    } catch(e) { setError(e.message); }
    finally    { setLoad(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="order-bg" onClick={onClose}/>
      <div className="order-sheet">
        <div className="order-handle"/>

        {/* ── FORM ── */}
        {step==='form' && <>
          <div className="order-title">{lbl('🛒 Оформление заказа','🛒 Pasūtījuma noformēšana','🛒 Checkout')}</div>

          {/* Items summary */}
          <div className="order-items">
            {cart.map(i=>(
              <div key={i.id} className="order-item">
                <span className="order-item-l">{i.e} {i.name[lang]} <span className="order-qty">×{i.qty}</span></span>
                <span className="order-item-r">€{(i.price*i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>{lbl('Итого','Kopā','Total')}</span>
            <span className="order-total-sum">€{total.toFixed(2)}</span>
          </div>

          <hr className="order-divider"/>

          {/* Form fields */}
          <div className="form-group">
            <label className="form-label">{lbl('Имя и Фамилия','Vārds Uzvārds','Full Name')} *</label>
            <input className="form-input" type="text"
              placeholder={lbl('Ваше имя','Jūsu vārds','Your name')}
              value={form.name} onChange={e=>set('name',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">{lbl('Телефон','Tālrunis','Phone')} *</label>
            <input className="form-input" type="tel"
              placeholder="+371 XX XXX XXX"
              value={form.phone} onChange={e=>set('phone',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">{lbl('Примечание','Piezīmes','Note')}</label>
            <input className="form-input" type="text"
              placeholder={lbl('Без лука, аллергия...','Bez sīpoliem...','No onion, allergy...')}
              value={form.note} onChange={e=>set('note',e.target.value)}/>
          </div>

          {/* Payment */}
          <div className="form-label" style={{marginBottom:8}}>
            {lbl('Способ оплаты','Maksājuma veids','Payment')}
          </div>
          <div className="pay-methods">
            {[
              ['cash', '💵', lbl('Наличными при получении','Skaidra nauda','Cash on pickup')],
              ['card', '💳', 'Visa / Mastercard / Apple Pay'],
            ].map(([k,icon,label])=>(
              <button key={k} type="button"
                className={'pay-method'+(payMethod===k?' on':'')}
                onClick={()=>setPay(k)}>
                <span className="pay-method-icon">{icon}</span>
                <span className="pay-method-label">{label}</span>
                {payMethod===k && <span className="pay-check">✓</span>}
              </button>
            ))}
          </div>

          {error && <div className="order-error">{error}</div>}
          <button className="btn-primary" onClick={submit} disabled={loading} style={{marginTop:12}}>
            {loading ? '⏳' : payMethod==='cash'
              ? lbl('✅ Подтвердить заказ','✅ Apstiprināt pasūtījumu','✅ Confirm order')
              : `💳 ${lbl('Перейти к оплате →','Doties uz apmaksu →','Proceed to payment →')}`}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{marginTop:8}}>
            {lbl('Отмена','Atcelt','Cancel')}
          </button>
        </>}

        {/* ── STRIPE ── */}
        {step==='pay' && secret && stripeP && (
          <Elements stripe={stripeP} options={{ clientSecret:secret, appearance:{theme:'stripe',variables:{colorPrimary:'#e31e24',borderRadius:'10px'}}, locale: lang==='lv'?'lv':lang==='en'?'en':'ru' }}>
            <StripeForm amount={total.toFixed(2)} lang={lang}
              onSuccess={()=>{ clear(); setStep('done'); }}
              onBack={()=>setStep('form')} />
          </Elements>
        )}

        {/* ── DONE ── */}
        {step==='done' && (
          <div className="order-success">
            <div className="order-success-ico">🎉</div>
            <div className="order-success-t">{lbl('Заказ принят!','Pasūtījums pieņemts!','Order accepted!')}</div>
            <div className="order-success-num">#{orderId}</div>
            <div className="order-success-p">
              {lbl(
                'Спасибо за заказ! Мы скоро свяжемся с вами.',
                'Paldies par pasūtījumu! Mēs drīz sazināsimies ar jums.',
                'Thank you for your order! We will contact you shortly.'
              )}
            </div>
            <button className="btn-primary" style={{width:'auto',padding:'12px 36px'}}
              onClick={()=>{ setStep('form'); onClose(); }}>
              {lbl('Отлично! 🙌','Lieliski! 🙌','Great! 🙌')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
