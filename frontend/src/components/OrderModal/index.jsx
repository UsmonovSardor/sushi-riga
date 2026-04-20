import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import T from '../../i18n/translations';

const API       = import.meta.env.VITE_API_URL || '';
const STRIPE_PK = import.meta.env.VITE_STRIPE_PK || '';
const stripeP   = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

function StripeForm({ amount, onSuccess, onBack, lang }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setErr('');
    const { error } = await stripe.confirmPayment({ elements, redirect:'if_required' });
    if (error) { setErr(error.message); setBusy(false); }
    else onSuccess();
  };

  const lbl = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;
  return (
    <div className="stripe-wrap">
      <div className="pay-amount">€{amount}</div>
      <div className="pay-hint">Visa · Mastercard · Apple Pay</div>
      <div className="stripe-elem-wrap"><PaymentElement /></div>
      {err && <div className="order-error">{err}</div>}
      <button className="btn-primary" onClick={pay} disabled={busy} style={{marginTop:14}}>
        {busy ? '⏳' : `💳 ${lbl('Apmaksāt','Оплатить','Pay')} €${amount}`}
      </button>
      <button className="btn-secondary" onClick={onBack}>← {lbl('Atpakaļ','Назад','Back')}</button>
    </div>
  );
}

export default function OrderModal({ isOpen, onClose, onOpenAuth }) {
  const { cart, total, clear } = useCart();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = T[lang];
  const lbl = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;

  const [step, setStep]     = useState('form');
  const [form, setForm]     = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('sr_form')||'{}'); return {name:s.name||'',phone:s.phone||'',note:''}; }
    catch { return {name:'',phone:'',note:''}; }
  });
  const [pay,   setPay]     = useState('cash');
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');
  const [orderId, setOid]   = useState(null);
  const [secret, setSecret] = useState('');

  useEffect(() => {
    if (user) setForm(f => ({...f, name:user.name||f.name, phone:user.phone||f.phone}));
  }, [user]);
  useEffect(() => { if(isOpen){ setStep('form'); setError(''); } }, [isOpen]);

  const set = (k,v) => setForm(f => {
    const next = {...f,[k]:v};
    try { localStorage.setItem('sr_form', JSON.stringify({name:next.name,phone:next.phone})); } catch{}
    return next;
  });

  const submit = async () => {
    setError('');
    if (!form.name.trim())  { setError(lbl('Ievadiet vārdu','Введите имя','Enter name')); return; }
    if (!form.phone.trim()) { setError(lbl('Ievadiet tālruni','Введите телефон','Enter phone')); return; }
    setLoad(true);
    try {
      const r = await fetch(`${API}/api/orders`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({...form, lang, payMethod:pay, items:cart.map(i=>({id:i.id,qty:i.qty}))}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.errors?.[0]?.msg || d.error || 'Error');
      setOid(d.orderId);
      if (pay==='cash'||!stripeP) { clear(); setStep('done'); }
      else {
        const pr = await fetch(`${API}/api/payment/create-intent`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:total,orderId:d.orderId})});
        const pd = await pr.json();
        if (!pr.ok) throw new Error(pd.error);
        setSecret(pd.clientSecret); setStep('pay');
      }
    } catch(e) { setError(e.message); }
    finally { setLoad(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="order-bg" onClick={onClose}/>
      <div className="order-sheet">
        <div className="order-handle"/>

        {/* ── NOT LOGGED IN ── */}
        {!user && (
          <div className="order-login-required">
            <div className="order-lock-ico">🔐</div>
            <div className="order-lock-title">{t.login_required}</div>
            <div className="order-lock-sub">
              {lbl(
                'Pasūtījumu veikšanai nepieciešams konts',
                'Для оформления заказа нужен аккаунт',
                'An account is required to place orders'
              )}
            </div>
            <button className="btn-primary" style={{marginTop:20}}
              onClick={() => { onClose(); setTimeout(onOpenAuth, 100); }}>
              {t.login_btn}
            </button>
            <button className="btn-secondary" onClick={onClose}>
              {lbl('Atcelt','Отмена','Cancel')}
            </button>
          </div>
        )}

        {/* ── FORM (only if logged in) ── */}
        {user && step==='form' && <>
          <div className="order-title">{lbl('🛒 Pasūtījuma noformēšana','🛒 Оформление заказа','🛒 Checkout')}</div>

          <div className="order-items">
            {cart.map(i => (
              <div key={i.id} className="order-item">
                <span className="order-item-l">{i.e} {i.name[lang]} <span className="order-qty">×{i.qty}</span></span>
                <span className="order-item-r">€{(i.price*i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>{t.total}</span>
            <span className="order-total-sum">€{total.toFixed(2)}</span>
          </div>
          <hr className="order-divider"/>

          <div className="form-group">
            <label className="form-label">{lbl('Vārds Uzvārds','Имя и Фамилия','Full Name')} *</label>
            <input className="form-input" type="text" autoComplete="name"
              placeholder={lbl('Jūsu vārds','Ваше имя','Your name')}
              value={form.name} onChange={e=>set('name',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">{lbl('Tālrunis','Телефон','Phone')} *</label>
            <input className="form-input" type="tel" autoComplete="tel" inputMode="tel"
              placeholder="+371 XX XXX XXX"
              value={form.phone} onChange={e=>set('phone',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">{lbl('Piezīmes','Комментарий','Notes')}</label>
            <input className="form-input" type="text"
              placeholder={lbl('Bez sīpoliem...','Без лука...','No onion...')}
              value={form.note} onChange={e=>set('note',e.target.value)}/>
          </div>

          <div className="form-label" style={{marginBottom:8}}>{lbl('Maksājuma veids','Способ оплаты','Payment')}</div>
          <div className="pay-methods">
            {[['cash','💵',lbl('Nauda pie saņemšanas','Наличными','Cash on pickup')],
              ['card','💳','Visa / Mastercard / Apple Pay']].map(([k,icon,label])=>(
              <button key={k} type="button" className={'pay-method'+(pay===k?' on':'')} onClick={()=>setPay(k)}>
                <span className="pay-method-icon">{icon}</span>
                <span className="pay-method-label">{label}</span>
                {pay===k && <span className="pay-check">✓</span>}
              </button>
            ))}
          </div>

          {error && <div className="order-error">{error}</div>}
          <button className="btn-primary" onClick={submit} disabled={loading} style={{marginTop:12}}>
            {loading ? '⏳' : pay==='cash'
              ? lbl('✅ Apstiprināt','✅ Подтвердить заказ','✅ Confirm order')
              : `💳 ${lbl('Doties uz apmaksu →','К оплате →','Pay now →')}`}
          </button>
          <button className="btn-secondary" onClick={onClose}>{lbl('Atcelt','Отмена','Cancel')}</button>
        </>}

        {/* ── STRIPE ── */}
        {user && step==='pay' && secret && stripeP && (
          <Elements stripe={stripeP} options={{clientSecret:secret,appearance:{theme:'stripe',variables:{colorPrimary:'#e31e24'}},locale:lang==='lv'?'lv':lang==='en'?'en':'ru'}}>
            <StripeForm amount={total.toFixed(2)} lang={lang}
              onSuccess={()=>{ clear(); setStep('done'); }}
              onBack={()=>setStep('form')} />
          </Elements>
        )}

        {/* ── DONE ── */}
        {user && step==='done' && (
          <div className="order-success">
            <div className="order-success-ico">🎉</div>
            <div className="order-success-t">{t.ok_title}</div>
            <div className="order-success-num">#{orderId}</div>
            <div className="order-success-p">{t.ok_text}</div>
            <button className="btn-primary" style={{width:'auto',padding:'12px 36px'}}
              onClick={()=>{ setStep('form'); onClose(); }}>
              {lbl('Lieliski! 🙌','Отлично! 🙌','Great! 🙌')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
