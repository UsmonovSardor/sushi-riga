import React, { useState, useEffect } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth }     from '../../context/AuthContext';
import { orderApi }    from '../../services/api';
import T from '../../i18n/translations';

const API = import.meta.env.VITE_API_URL || '';

const PAY_METHODS = {
  cash:  { icon:'💵', ru:'Наличными курьеру', en:'Cash to courier', lv:'Skaidra nauda kurjerim' },
  card:  { icon:'💳', ru:'Карта (Visa/Mastercard)', en:'Card (Visa/Mastercard)', lv:'Karte (Visa/Mastercard)' },
  apple: { icon:'', ru:'Apple Pay', en:'Apple Pay', lv:'Apple Pay' },
};

export default function OrderModal({ isOpen, onClose }) {
  const { cart, total, delivery, subtotal, clear } = useCart();
  const { lang }  = useLanguage();
  const { user }  = useAuth();
  const t         = T[lang];

  const [step, setStep]     = useState('form'); // form | pay | done
  const [form, setForm]     = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    address: '',
    note:    '',
  });
  const [payMethod, setPayMethod] = useState('cash');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [orderId,   setOrderId]   = useState(null);
  const [hasApplePay, setHasApplePay] = useState(false);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || f.name, phone: user.phone || f.phone }));
  }, [user]);

  useEffect(() => {
    // Detect Apple Pay availability
    if (window.ApplePaySession?.canMakePayments?.()) setHasApplePay(true);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totalWithDel = (subtotal + delivery);

  const submitOrder = async () => {
    setError('');
    if (!form.name.trim())    { setError(t.fill || 'Введите имя');     return; }
    if (!form.phone.trim())   { setError(t.fill || 'Введите телефон'); return; }
    if (!form.address.trim()) { setError(t.fill || 'Введите адрес');   return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lang,
          payMethod,
          items: cart.map(i => ({ id: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setOrderId(data.orderId);

      if (payMethod === 'cash') {
        clear();
        setStep('done');
      } else {
        // Card/Apple Pay - go to payment step
        setStep('pay');
      }
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const payWithCard = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalWithDel, orderId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      // For real Stripe integration, load Stripe.js here
      // For now show success (Stripe will be configured with real keys)
      clear();
      setStep('done');
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

        {/* ── STEP: FORM ── */}
        {step === 'form' && (
          <>
            <div className="order-title">
              {lang === 'ru' ? '🛒 Оформление заказа' : lang === 'lv' ? '🛒 Pasūtījuma noformēšana' : '🛒 Checkout'}
            </div>

            {/* Order items */}
            <div className="order-items">
              {cart.map(i => (
                <div key={i.id} className="order-item">
                  <span className="order-item-l">{i.e} {i.name[lang]} <span className="order-qty">×{i.qty}</span></span>
                  <span className="order-item-r">€{(i.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="order-item order-item--del">
                <span className="order-item-l">
                  {lang==='ru'?'Самовывоз / Доставка':lang==='lv'?'Piegāde':'Delivery'}
                </span>
                <span className="order-item-r" style={{color: delivery===0?'#16a34a':'inherit'}}>
                  {delivery === 0 ? (lang==='ru'?'Бесплатно':lang==='lv'?'Bezmaksas':'Free') : `€${delivery.toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="order-total">
              <span>{t.total}</span>
              <span>€{totalWithDel.toFixed(2)}</span>
            </div>

            {/* No delivery notice */}
            <div className="order-notice">
              ⚠️ {lang==='ru'
                ? 'Уточните детали доставки по телефону после заказа'
                : lang==='lv'
                ? 'Lūdzu, precizējiet piegādes detaļas pa tālruni pēc pasūtījuma'
                : 'Delivery details will be confirmed by phone after ordering'}
            </div>

            <hr className="order-divider" />

            {/* Contact form */}
            <div className="form-group">
              <label className="form-label">{t.f_name || (lang==='lv'?'Vārds':'Имя')} *</label>
              <input className="form-input" type="text"
                placeholder={lang==='lv'?'Jūsu vārds':lang==='en'?'Your name':'Ваше имя'}
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.f_phone || (lang==='lv'?'Tālrunis':'Телефон')} *</label>
              <input className="form-input" type="tel"
                placeholder="+371 XX XXX XXX"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.f_addr || (lang==='lv'?'Adrese':'Адрес')} *</label>
              <input className="form-input" type="text"
                placeholder={lang==='lv'?'Iela, māja, dzīvoklis':lang==='en'?'Street, house, apt':'Улица, дом, квартира'}
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.f_note || (lang==='lv'?'Piezīmes':'Комментарий')}</label>
              <input className="form-input" type="text"
                placeholder={lang==='lv'?'Komentārs...':lang==='en'?'Comment...':'Комментарий...'}
                value={form.note} onChange={e => set('note', e.target.value)} />
            </div>

            {/* Payment method */}
            <div className="form-label" style={{marginBottom:8}}>
              {lang==='ru'?'Способ оплаты':lang==='lv'?'Maksājuma veids':'Payment method'}
            </div>
            <div className="pay-methods">
              {Object.entries(PAY_METHODS).map(([key, pm]) => {
                if (key === 'apple' && !hasApplePay) return null;
                return (
                  <button
                    key={key}
                    className={'pay-method' + (payMethod === key ? ' on' : '')}
                    onClick={() => setPayMethod(key)}
                    type="button"
                  >
                    <span className="pay-method-icon">{pm.icon}</span>
                    <span className="pay-method-label">{pm[lang] || pm.ru}</span>
                    {payMethod === key && <span className="pay-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {error && <div className="order-error">{error}</div>}

            <button
              className="btn-primary"
              onClick={submitOrder}
              disabled={loading}
              style={{marginTop:12}}
            >
              {loading ? '...' : (
                payMethod === 'cash'
                  ? (lang==='ru'?'✅ Подтвердить заказ':lang==='lv'?'✅ Apstiprināt pasūtījumu':'✅ Confirm order')
                  : (lang==='ru'?`💳 Оплатить €${totalWithDel.toFixed(2)}`:lang==='lv'?`💳 Apmaksāt €${totalWithDel.toFixed(2)}`:`💳 Pay €${totalWithDel.toFixed(2)}`)
              )}
            </button>
            <button className="btn-secondary" onClick={onClose}>
              {t.cancel || (lang==='lv'?'Atcelt':'Отмена')}
            </button>
          </>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === 'pay' && (
          <>
            <div className="order-title">
              {lang==='ru'?'💳 Оплата':lang==='lv'?'💳 Maksājums':'💳 Payment'}
            </div>
            <div className="pay-amount">€{totalWithDel.toFixed(2)}</div>
            <div className="pay-desc">
              {lang==='ru'?'Заказ #'+orderId:lang==='lv'?'Pasūtījums #'+orderId:'Order #'+orderId}
            </div>

            {/* Stripe card element placeholder */}
            <div className="stripe-box">
              <div className="stripe-row">
                <input className="form-input stripe-input" placeholder="1234 5678 9012 3456" maxLength="19" />
              </div>
              <div className="stripe-row2">
                <input className="form-input stripe-input" placeholder="MM/YY" maxLength="5" style={{flex:1}} />
                <input className="form-input stripe-input" placeholder="CVV" maxLength="3" style={{flex:1}} />
              </div>
              <div className="stripe-brands">
                <span>VISA</span><span>MC</span><span>Amex</span>
              </div>
            </div>

            {error && <div className="order-error">{error}</div>}

            <button className="btn-primary" onClick={payWithCard} disabled={loading} style={{marginTop:12}}>
              {loading ? '...' : (lang==='ru'?`Оплатить €${totalWithDel.toFixed(2)}`:lang==='lv'?`Apmaksāt €${totalWithDel.toFixed(2)}`:`Pay €${totalWithDel.toFixed(2)}`)}
            </button>
            <button className="btn-secondary" onClick={() => setStep('form')}>
              {lang==='ru'?'← Назад':lang==='lv'?'← Atpakaļ':'← Back'}
            </button>
          </>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && (
          <div className="order-success">
            <div className="order-success-ico">🎉</div>
            <div className="order-success-t">
              {lang==='ru'?'Заказ принят!':lang==='lv'?'Pasūtījums pieņemts!':'Order accepted!'}
            </div>
            <div className="order-success-num">#{orderId}</div>
            <div className="order-success-p">
              {lang==='ru'
                ? 'Мы свяжемся с вами в ближайшее время для уточнения деталей доставки'
                : lang==='lv'
                ? 'Mēs sazināsimies ar jums tuvākajā laikā, lai precizētu piegādes detaļas'
                : 'We will contact you shortly to confirm delivery details'}
            </div>
            <button className="btn-primary" style={{width:'auto',padding:'12px 32px'}}
              onClick={() => { setStep('form'); setForm({name:'',phone:'',address:'',note:''}); onClose(); }}>
              {lang==='ru'?'Отлично!':lang==='lv'?'Lielisks!':'Great!'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
