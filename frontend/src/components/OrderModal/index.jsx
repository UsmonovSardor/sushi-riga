import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import T from '../../i18n/translations';

const API       = import.meta.env.VITE_API_URL || '';
const STRIPE_PK = import.meta.env.VITE_STRIPE_PK || '';

// Stripe promise - only load if we have a key
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

/* ── Inner Stripe form ── */
function StripeForm({ amount, onSuccess, onBack, lang }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setErr('');
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
    } else {
      onSuccess();
    }
  };

  return (
    <>
      <div className="pay-amount">€{amount}</div>
      <div className="pay-desc" style={{marginBottom:18}}>
        {lang==='ru'?'Безопасная оплата через Stripe':lang==='lv'?'Droša apmaksa caur Stripe':'Secure payment via Stripe'}
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {err && <div className="order-error" style={{marginTop:10}}>{err}</div>}
      <button className="btn-primary" onClick={pay} disabled={busy} style={{marginTop:14}}>
        {busy ? '...' : (lang==='ru'?`Оплатить €${amount}`:lang==='lv'?`Apmaksāt €${amount}`:`Pay €${amount}`)}
      </button>
      <button className="btn-secondary" onClick={onBack} style={{marginTop:8}}>
        {lang==='ru'?'← Назад':lang==='lv'?'← Atpakaļ':'← Back'}
      </button>
      <div className="stripe-secure">
        <span>🔒</span>
        <span>{lang==='ru'?'Защищено Stripe · Visa · Mastercard · Apple Pay':lang==='lv'?'Aizsargāts ar Stripe':'Secured by Stripe'}</span>
      </div>
    </>
  );
}

/* ── Main Modal ── */
export default function OrderModal({ isOpen, onClose }) {
  const { cart, total, delivery, subtotal, clear } = useCart();
  const { lang }  = useLanguage();
  const { user }  = useAuth();
  const t         = T[lang];

  const [step,      setStep]      = useState('form');
  const [form,      setForm]      = useState({ name:'', phone:'', address:'', note:'' });
  const [payMethod, setPayMethod] = useState('cash');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [orderId,   setOrderId]   = useState(null);
  const [clientSecret, setSecret] = useState('');

  const totalAmount = (subtotal + delivery).toFixed(2);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name||f.name, phone: user.phone||f.phone }));
  }, [user]);

  // Reset on open
  useEffect(() => {
    if (isOpen) { setStep('form'); setError(''); }
  }, [isOpen]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const lbl = (ru, lv, en) => lang==='ru'?ru:lang==='lv'?lv:en;

  const submitOrder = async () => {
    setError('');
    if (!form.name.trim())    { setError(lbl('Введите имя','Ievadiet vārdu','Enter your name')); return; }
    if (!form.phone.trim())   { setError(lbl('Введите телефон','Ievadiet tālruni','Enter your phone')); return; }
    if (!form.address.trim()) { setError(lbl('Введите адрес','Ievadiet adresi','Enter your address')); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, lang, payMethod,
          items: cart.map(i => ({ id: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setOrderId(data.orderId);

      if (payMethod === 'cash') {
        clear(); setStep('done');
      } else if (stripePromise) {
        // Get Stripe Payment Intent
        const pr = await fetch(`${API}/api/payment/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(totalAmount), orderId: data.orderId }),
        });
        const pd = await pr.json();
        if (!pr.ok) throw new Error(pd.error);
        setSecret(pd.clientSecret);
        setStep('pay');
      } else {
        // No Stripe configured — treat as cash
        clear(); setStep('done');
      }
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="order-bg" onClick={onClose} />
      <div className="order-sheet">
        <div className="order-handle" />

        {/* ── FORM ── */}
        {step === 'form' && <>
          <div className="order-title">
            {lbl('🛒 Оформление заказа','🛒 Pasūtījuma noformēšana','🛒 Checkout')}
          </div>

          {/* Items */}
          <div className="order-items">
            {cart.map(i => (
              <div key={i.id} className="order-item">
                <span className="order-item-l">{i.e} {i.name[lang]} <span className="order-qty">×{i.qty}</span></span>
                <span className="order-item-r">€{(i.price*i.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-item order-item--del">
              <span className="order-item-l">{lbl('Доставка','Piegāde','Delivery')}</span>
              <span className="order-item-r" style={{color:delivery===0?'#16a34a':undefined}}>
                {delivery===0 ? lbl('Бесплатно','Bezmaksas','Free') : `€${delivery.toFixed(2)}`}
              </span>
            </div>
          </div>
          <div className="order-total">
            <span>{t.total || lbl('Итого','Kopā','Total')}</span>
            <span>€{totalAmount}</span>
          </div>

          <div className="order-notice">
            ⚠️ {lbl(
              'После заказа мы позвоним для уточнения времени доставки',
              'Pēc pasūtījuma mēs piezvanīsim, lai precizētu piegādes laiku',
              'We will call you to confirm delivery time after the order'
            )}
          </div>

          <hr className="order-divider" />

          {/* Form fields */}
          {[
            ['name',    'text', lbl('Имя','Vārds','Name'),              lbl('Ваше имя','Jūsu vārds','Your name')],
            ['phone',   'tel',  lbl('Телефон','Tālrunis','Phone'),      '+371 XX XXX XXX'],
            ['address', 'text', lbl('Адрес','Adrese','Address'),         lbl('Улица, дом, кв.','Iela, māja, dzīvoklis','Street, house, apt')],
            ['note',    'text', lbl('Комментарий','Piezīmes','Note'),   lbl('Без лука, позвонить...','Bez sīpoliem...','Extra info...')],
          ].map(([k, type, label, ph]) => (
            <div key={k} className="form-group">
              <label className="form-label">{label}{k!=='note'?' *':''}</label>
              <input className="form-input" type={type} placeholder={ph}
                value={form[k]} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}

          {/* Payment method */}
          <div className="form-label" style={{marginBottom:8}}>
            {lbl('Способ оплаты','Maksājuma veids','Payment method')}
          </div>
          <div className="pay-methods">
            {[
              ['cash', '💵', lbl('Наличными курьеру','Skaidra nauda','Cash')],
              ['card', '💳', lbl('Visa / Mastercard / Apple Pay','Visa / Mastercard / Apple Pay','Visa / Mastercard / Apple Pay')],
            ].map(([key, icon, label]) => (
              <button key={key} type="button"
                className={'pay-method'+(payMethod===key?' on':'')}
                onClick={()=>setPayMethod(key)}>
                <span className="pay-method-icon">{icon}</span>
                <span className="pay-method-label">{label}</span>
                {payMethod===key && <span className="pay-check">✓</span>}
              </button>
            ))}
          </div>

          {error && <div className="order-error">{error}</div>}

          <button className="btn-primary" onClick={submitOrder} disabled={loading} style={{marginTop:12}}>
            {loading ? '⏳' : payMethod==='cash'
              ? lbl('✅ Подтвердить заказ','✅ Apstiprināt','✅ Confirm order')
              : `💳 ${lbl('Перейти к оплате','Doties uz apmaksu','Go to payment')} →`
            }
          </button>
          <button className="btn-secondary" onClick={onClose} style={{marginTop:8}}>
            {lbl('Отмена','Atcelt','Cancel')}
          </button>
        </>}

        {/* ── STRIPE PAYMENT ── */}
        {step === 'pay' && clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{
            clientSecret,
            appearance: { theme:'stripe', variables:{ colorPrimary:'#e31e24', borderRadius:'10px' } },
            locale: lang === 'lv' ? 'lv' : lang === 'en' ? 'en' : 'ru',
          }}>
            <StripeForm
              amount={totalAmount}
              lang={lang}
              onSuccess={() => { clear(); setStep('done'); }}
              onBack={() => setStep('form')}
            />
          </Elements>
        )}

        {/* ── SUCCESS ── */}
        {step === 'done' && (
          <div className="order-success">
            <div className="order-success-ico">🎉</div>
            <div className="order-success-t">{lbl('Заказ принят!','Pasūtījums pieņemts!','Order accepted!')}</div>
            <div className="order-success-num">#{orderId}</div>
            <div className="order-success-p">
              {lbl(
                'Мы свяжемся с вами в ближайшее время для подтверждения доставки',
                'Mēs sazināsimies ar jums tuvākajā laikā',
                'We will contact you shortly to confirm delivery'
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
