import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOverlay } from '../../utils/useOverlay';
import T from '../../i18n/translations';
import { ordersApi } from '../../services/api';

export default function OrderModal({ isOpen, onClose, onOpenAuth }) {
  const { cart, total, clear, change } = useCart();
  const { lang } = useLanguage();
  const { user, loading } = useAuth();
  const t = T[lang];
  const L = (lv, ru, en) => lang === 'lv' ? lv : lang === 'ru' ? ru : en;

  const [step, setStep] = useState('form');
  const [form, setForm] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('sr_form') || '{}');
      return {
        name: s.name || '',
        surname: s.surname || '',
        phone: s.phone || '',
        note: '',
      };
    } catch {
      return { name: '', surname: '', phone: '', note: '' };
    }
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [oid, setOid] = useState(null);

  useOverlay(isOpen, onClose);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || f.name,
        surname: user.surname || f.surname,
        phone: user.phone || f.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErr('');
    }
  }, [isOpen]);

  const sf = (k, v) => setForm(f => {
    const n = { ...f, [k]: v };
    try {
      localStorage.setItem('sr_form', JSON.stringify({
        name: n.name,
        surname: n.surname,
        phone: n.phone,
      }));
    } catch {}
    return n;
  });

  const submit = async () => {
    setErr('');

    if (!form.name.trim()) return setErr(L('Ievadiet vārdu', 'Введите имя', 'Enter name'));
    if (!form.surname.trim()) return setErr(L('Ievadiet uzvārdu', 'Введите фамилию', 'Enter surname'));
    if (!form.phone.trim()) return setErr(L('Ievadiet tālruni', 'Введите телефон', 'Enter phone'));

    setBusy(true);

    try {
      const od = await ordersApi.create({
        ...form,
        address: '',
        lang,
        payMethod: 'cash',
        items: cart.map(i => ({ id: i.id, qty: i.qty })),
      });

      window.dispatchEvent(new CustomEvent('sr_order_created', {
        detail: od.order || od,
      }));

      setOid(od.orderId);
      clear();
      setStep('done');
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-bg" onClick={onClose} />

      <div className="order-modal">
        <div className="order-modal-handle" />

        {!loading && !user && (
          <div className="order-gate">
            <div className="order-gate-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="gate-title">
              {L('Klienta dati', 'Данные клиента', 'Customer details')}
            </div>

            <div className="gate-sub">
              {L('Ievadiet savus datus, lai turpinātu pasūtījumu', 'Введите данные, чтобы продолжить заказ', 'Enter your details to continue your order')}
            </div>

            <div className="gate-benefits">
              <div className="gate-benefit"><span>⚡</span>{L('Ātra reģistrācija', 'Быстрая регистрация', 'Quick registration')}</div>
              <div className="gate-benefit"><span>📦</span>{L('Pasūtījumu vēsture', 'История заказов', 'Order history')}</div>
              <div className="gate-benefit"><span>⭐</span>{L('Atsauksmes', 'Отзывы', 'Reviews')}</div>
            </div>

            <button className="gate-btn" onClick={() => { onClose(); setTimeout(onOpenAuth, 80); }}>
              {L('Ievadīt datus', 'Ввести данные', 'Enter details')}
            </button>
          </div>
        )}

        {!loading && user && step === 'form' && (
          <>
            <div className="order-header">
              <span className="order-header-title">
                {L('Noformēt pasūtījumu', 'Оформить заказ', 'Checkout')}
              </span>

              <button className="order-close-btn" onClick={onClose} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="order-items-block">
              <div className="order-items-list">
                {cart.map(i => (
                  <div key={i.id} className="order-item-row">
                    <span className="oitem-e">{i.e}</span>
                    <span className="oitem-name">{i.name[lang]}</span>
                    <span className="oitem-step">
                      <button type="button" className="oitem-step-btn" onClick={() => change(i.id, -1)} aria-label="Decrease">−</button>
                      <span className="oitem-step-n">{i.qty}</span>
                      <button type="button" className="oitem-step-btn" onClick={() => change(i.id, +1)} aria-label="Increase">+</button>
                    </span>
                    <span className="oitem-sum">€{(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-total-bar">
                <span>{t.total}</span>
                <span className="order-total-price">€{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="order-fields">
              {[
                ['name', 'text', 'name', L('Vārds', 'Имя', 'Name'), '*', L('Jūsu vārds', 'Ваше имя', 'Your name'), '👤'],
                ['surname', 'text', 'family-name', L('Uzvārds', 'Фамилия', 'Surname'), '*', L('Jūsu uzvārds', 'Ваша фамилия', 'Your surname'), '👤'],
                ['phone', 'tel', 'tel', L('Tālrunis', 'Телефон', 'Phone'), '*', '+371 XX XXX XXX', '📞'],
                ['note', 'text', 'off', L('Piezīmes', 'Комментарий', 'Comment'), '', L('Masalan: soya sous ko‘proq...', 'Например: больше соевого соуса...', 'Example: more soy sauce...'), '💬'],
              ].map(([k, type, ac, lbl, req, ph, ico]) => (
                <div key={k} className="ofield">
                  <label className="ofield-label">
                    {lbl}{req && <span className="req"> {req}</span>}
                  </label>

                  <div className="ofield-input-w">
                    <span className="ofield-ico">{ico}</span>
                    <input
                      className="ofield-input"
                      type={type}
                      autoComplete={ac}
                      inputMode={type === 'tel' ? 'tel' : 'text'}
                      placeholder={ph}
                      value={form[k] || ''}
                      onChange={e => sf(k, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pay-section-title">
              {L('Apmaksa', 'Оплата', 'Payment')}
            </div>

            <div className="pay-opts">
              <button className="pay-opt active" type="button">
                <span className="pay-opt-ico">💵</span>
                <span className="pay-opt-info">
                  <span className="pay-opt-name">
                    {L('Skaidra nauda', 'Наличные', 'Cash')}
                  </span>
                  <span className="pay-opt-hint">
                    {L('Pie saņemšanas', 'При получении', 'On pickup')}
                  </span>
                </span>
                <span className="pay-opt-check on">✓</span>
              </button>
            </div>

            {err && <div className="oerr">⚠️ {err}</div>}

            <div className="order-submit-wrap">
              <button className="order-submit-btn" onClick={submit} disabled={busy}>
                {busy ? (
                  <><span className="spin" /> {L('Apstrādā...', 'Обработка...', 'Processing...')}</>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {L('Apstiprināt pasūtījumu', 'Подтвердить заказ', 'Confirm order')}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {user && step === 'done' && (
          <div className="order-done">
            <div className="done-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="done-title">{t.ok_title}</div>
            <div className="done-num">#{oid}</div>
            <div className="done-sub">{t.ok_text}</div>

            <button className="done-btn" onClick={() => { setStep('form'); onClose(); }}>
              {L('Labi! 👍', 'Отлично! 👍', 'Great! 👍')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
