import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOverlay } from '../../utils/useOverlay';

export default function AuthModal({ onClose, onSuccess }) {
  const { register, login } = useAuth();
  const { lang } = useLanguage();

  useOverlay(true, onClose);

  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', surname: '', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const L = (lv, ru, en) => (lang === 'lv' ? lv : lang === 'ru' ? ru : en);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const errText = msg => {
    if (!msg) return '';

    if (msg.includes('oldin ro‘yxatdan') || msg.includes('already')) {
      return L(
        'Šis tālrunis jau ir reģistrēts. Lūdzu, piesakieties.',
        'Этот номер уже зарегистрирован. Пожалуйста, войдите.',
        'This phone number is already registered. Please sign in.'
      );
    }

    if (msg.includes('ro‘yxatdan o‘tmagan') || msg.includes('not registered')) {
      return L(
        'Šis tālrunis vēl nav reģistrēts.',
        'Этот номер ещё не зарегистрирован.',
        'This phone number is not registered yet.'
      );
    }

    if (msg.includes('noto‘g‘ri') || msg.includes('wrong')) {
      return L(
        'Vārds vai uzvārds nav pareizs.',
        'Имя или фамилия неверные.',
        'Name or surname is incorrect.'
      );
    }

    if (msg.includes('required')) {
      return L(
        'Visi lauki ir obligāti.',
        'Все поля обязательны.',
        'All fields are required.'
      );
    }

    return msg;
  };

  const submit = async e => {
    e.preventDefault();
    if (busy) return;

    setErr('');
    setBusy(true);

    try {
      if (mode === 'register') {
        await register(form.name, form.surname, '', form.phone);
      } else {
        await login(form.name, form.surname, form.phone);
      }

      setOk(true);
      sss

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 800);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="modal-bg" onClick={onClose} />

      <div className="auth-modal">
        <div className="auth-modal-handle" />

        {ok ? (
          <div className="auth-ok">
            <div className="auth-ok-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <p className="auth-ok-title">
              {mode === 'register'
                ? L('Reģistrācija veiksmīga!', 'Регистрация успешна!', 'Registration successful!')
                : L('Pieteikšanās veiksmīga!', 'Вход выполнен!', 'Login successful!')}
            </p>

            <p className="auth-ok-sub">
              {L('Turpinām pasūtījumu', 'Продолжаем оформление заказа', 'Continuing your order')}
            </p>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div className="auth-brand">
                {mode === 'register'
                  ? L('Reģistrācija', 'Регистрация', 'Register')
                  : L('Pieteikšanās', 'Вход', 'Login')}
              </div>

              <button className="auth-close-x" onClick={onClose} aria-label="Close" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErr('');
                }}
                style={{
                  height: 38,
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: mode === 'register' ? '#e31e24' : '#f1f5f9',
                  color: mode === 'register' ? '#fff' : '#475569',
                }}
              >
                {L('Reģistrēties', 'Регистрация', 'Register')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErr('');
                }}
                style={{
                  height: 38,
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: mode === 'login' ? '#e31e24' : '#f1f5f9',
                  color: mode === 'login' ? '#fff' : '#475569',
                }}
              >
                {L('Ienākt', 'Войти', 'Login')}
              </button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <div className="afield">
                <label>{L('Vārds', 'Имя', 'Name')} <span className="req">*</span></label>
                <div className="ainput-w">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                  <input
                    type="text"
                    placeholder={L('Jūsu vārds', 'Ваше имя', 'Your name')}
                    autoComplete="given-name"
                    value={form.name}
                    onChange={e => s('name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="afield">
                <label>{L('Uzvārds', 'Фамилия', 'Surname')} <span className="req">*</span></label>
                <div className="ainput-w">
                  <input
                    type="text"
                    placeholder={L('Jūsu uzvārds', 'Ваша фамилия', 'Your surname')}
                    autoComplete="family-name"
                    value={form.surname}
                    onChange={e => s('surname', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="afield">
                <label>{L('Tālrunis', 'Телефон', 'Phone')} <span className="req">*</span></label>
                <div className="ainput-w">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>

                  <input
                    type="tel"
                    placeholder="+371 XX XXX XXX"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={e => s('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              {err && (
                <div className="auth-err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errText(err)}
                </div>
              )}

              <button className="auth-btn" type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <span className="spin" />
                    {L('Apstrādā...', 'Обработка...', 'Please wait...')}
                  </>
                ) : mode === 'register' ? (
                  L('Saglabāt un turpināt', 'Сохранить и продолжить', 'Save and continue')
                ) : (
                  L('Ienākt un turpināt', 'Войти и продолжить', 'Login and continue')
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
