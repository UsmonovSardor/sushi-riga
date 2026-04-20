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

/* ─── Stripe Payment Step ─── */
function PayStep({ total, lang, onSuccess, onBack }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const lbl = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setErr('');
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (error) { setErr(error.message); setBusy(false); }
    else       { onSuccess(); }
  };

  return (
    <div className="pay-step">
      {/* Amount display */}
      <div className="pay-step-header">
        <div className="pay-step-amount">€{total}</div>
        <div className="pay-step-hint">
          {lbl('Droša apmaksa', 'Безопасная оплата', 'Secure payment')}
        </div>
      </div>

      {/* Stripe Element */}
      <div className="pay-step-form">
        <PaymentElement options={{
          layout: { type: 'tabs', defaultCollapsed: false },
          fields: { billingDetails: { name: 'never', email: 'never' } },
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }} />
      </div>

      {err && (
        <div className="pay-step-error">⚠️ {err}</div>
      )}

      {/* Pay button */}
      <button
        className="pay-step-btn"
        onClick={pay}
        disabled={busy || !stripe}
      >
        {busy
          ? <span className="pay-spinner">⏳</span>
          : <>
              <span>💳</span>
              <span>{lbl(`Apmaksāt €${total}`, `Оплатить €${total}`, `Pay €${total}`)}</span>
            </>
        }
      </button>

      <button className="pay-step-back" onClick={onBack}>
        ← {lbl('Atpakaļ', 'Назад', 'Back')}
      </button>

      {/* Security badges */}
      <div className="pay-step-badges">
        <span>🔒 SSL</span>
        <span>VISA</span>
        <span>MC</span>
        <span>Apple Pay</span>
        <span>Google Pay</span>
      </div>
    </div>
  );
}

/* ─── Main Modal ─── */
export default function OrderModal({ isOpen, onClose, onOpenAuth }) {
  const { cart, total, clear } = useCart();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = T[lang];
  const lbl = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;

  const [step,    setStep]   = useState('form'); // form | pay | done
  const [form,    setForm]   = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('sr_form') || '{}');
      return { name: s.name||'', phone: s.phone||'', note: '' };
    } catch { return { name:'', phone:'', note:'' }; }
  });
  const [payType, setPay]    = useState('cash');
  const [loading, setLoad]   = useState(false);
  const [error,   setError]  = useState('');
  const [orderId, setOid]    = useState(null);
  const [secret,  setSecret] = useState('');

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name||f.name, phone: user.phone||f.phone }));
  }, [user]);

  useEffect(() => {
    if (isOpen) { setStep('form'); setError(''); }
  }, [isOpen]);

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
      // Create order
      const or = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, lang, payMethod: payType,
          items: cart.map(i => ({ id: i.id, qty: i.qty })),
        }),
      });
      const od = await or.json();
      if (!or.ok) throw new Error(od.errors?.[0]?.msg || od.error || 'Server error');
      setOid(od.orderId);

      if (payType === 'cash' || !stripeP) {
        clear(); setStep('done');
        return;
      }

      // Create payment intent
      const pr = await fetch(`${API}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, orderId: od.orderId }),
      });
      const pd = await pr.json();
      if (!pr.ok) throw new Error(pd.error || 'Payment error');

      setSecret(pd.clientSecret);
      setStep('pay');
    } catch(e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="order-bg" onClick={onClose} />
      <div className="order-sheet">
        <div className="order-handle" />

        {/* ── NOT LOGGED IN ── */}
        {!user && (
          <div className="order-auth-gate">
            <div className="order-auth-ico">🔐</div>
            <div className="order-auth-title">{t.login_required}</div>
            <div className="order-auth-sub">
              {lbl('Pasūtījumu veikšanai nepieciešams konts','Для заказа необходим аккаунт','An account is required to order')}
            </div>
            <button className="btn-primary" style={{marginTop:20}}
              onClick={() => { onClose(); setTimeout(onOpenAuth, 80); }}>
              {t.login_btn}
            </button>
            <button className="btn-secondary" onClick={onClose}>
              {lbl('Atcelt','Отмена','Cancel')}
            </button>
          </div>
        )}

        {/* ── FORM ── */}
        {user && step === 'form' && (
          <>
            <div className="order-title">
              {lbl('🛒 Pasūtījuma noformēšana','🛒 Оформление заказа','🛒 Checkout')}
            </div>

            {/* Cart summary */}
            <div className="order-items">
              {cart.map(i => (
                <div key={i.id} className="order-item">
                  <span className="order-item-l">
                    {i.e} {i.name[lang]}
                    <span className="order-qty"> ×{i.qty}</span>
                  </span>
                  <span className="order-item-r">€{(i.price*i.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>{t.total}</span>
              <span className="order-total-sum">€{total.toFixed(2)}</span>
            </div>

            <hr className="order-divider" />

            {/* Fields */}
            <div className="form-group">
              <label className="form-label">{lbl('Vārds','Имя','Name')} *</label>
              <input className="form-input" type="text" autoComplete="name"
                placeholder={lbl('Jūsu vārds','Ваше имя','Your name')}
                value={form.name} onChange={e=>set('name',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{lbl('Tālrunis','Телефон','Phone')} *</label>
              <input className="form-input" type="tel" autoComplete="tel" inputMode="tel"
                placeholder="+371 XX XXX XXX"
                value={form.phone} onChange={e=>set('phone',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{lbl('Piezīmes','Комментарий','Notes')}</label>
              <input className="form-input" type="text"
                placeholder={lbl('Bez sīpoliem...','Без лука...','No onion...')}
                value={form.note} onChange={e=>set('note',e.target.value)} />
            </div>

            {/* Payment type */}
            <div className="form-label" style={{marginBottom:8}}>
              {lbl('Maksājuma veids','Способ оплаты','Payment method')}
            </div>
            <div className="pay-methods">
              {[
                ['cash', '💵', lbl('Nauda pie saņemšanas','Наличными','Cash')],
                ['card', '💳', 'Visa / Mastercard / Apple Pay / Google Pay'],
              ].map(([k,icon,label]) => (
                <button key={k} type="button"
                  className={'pay-method' + (payType===k?' on':'')}
                  onClick={() => setPay(k)}>
                  <span className="pay-method-icon">{icon}</span>
                  <span className="pay-method-label">{label}</span>
                  {payType===k && <span className="pay-check">✓</span>}
                </button>
              ))}
            </div>

            {error && <div className="order-error">⚠️ {error}</div>}

            <button className="btn-primary" onClick={submit} disabled={loading} style={{marginTop:12}}>
              {loading ? '⏳'
                : payType==='cash'
                  ? lbl('✅ Apstiprināt','✅ Подтвердить','✅ Confirm')
                  : `💳 ${lbl('Maksāt →','К оплате →','Pay now →')}`
              }
            </button>
            <button className="btn-secondary" onClick={onClose}>
              {lbl('Atcelt','Отмена','Cancel')}
            </button>
          </>
        )}

        {/* ── STRIPE PAYMENT ── */}
        {user && step === 'pay' && secret && stripeP && (
          <Elements
            stripe={stripeP}
            options={{
              clientSecret: secret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#e31e24',
                  colorBackground: '#ffffff',
                  colorText: '#111111',
                  colorDanger: '#e31e24',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '10px',
                  fontSizeBase: '15px',
                },
                rules: {
                  '.Input': { border: '1.5px solid #d1d5db', boxShadow: 'none', padding: '12px 14px' },
                  '.Input:focus': { border: '1.5px solid #e31e24', boxShadow: '0 0 0 3px rgba(227,30,36,.1)' },
                  '.Tab': { border: '1.5px solid #e5e7eb', borderRadius: '10px' },
                  '.Tab--selected': { border: '1.5px solid #e31e24', color: '#e31e24' },
                  '.Label': { fontWeight: '600', color: '#374151', fontSize: '13px' },
                },
              },
              locale: lang === 'lv' ? 'lv' : lang === 'en' ? 'en' : 'ru',
            }}
          >
            <PayStep
              total={total.toFixed(2)}
              lang={lang}
              onSuccess={() => { clear(); setStep('done'); }}
              onBack={() => setStep('form')}
            />
          </Elements>
        )}

        {/* ── SUCCESS ── */}
        {user && step === 'done' && (
          <div className="order-success">
            <div className="order-success-ico">🎉</div>
            <div className="order-success-t">{t.ok_title}</div>
            <div className="order-success-num">#{orderId}</div>
            <div className="order-success-p">{t.ok_text}</div>
            <button
              className="btn-primary"
              style={{width:'auto',padding:'13px 40px'}}
              onClick={() => { setStep('form'); onClose(); }}
            >
              {lbl('Lieliski! 🙌','Отлично! 🙌','Great! 🙌')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
