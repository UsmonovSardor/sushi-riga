import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthModal({ onClose, onSuccess }) {
  const { register, login } = useAuth();
  const { lang } = useLanguage();

  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', surname: '', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const L = (lv, ru, en) => (lang === 'lv' ? lv : lang === 'ru' ? ru : en);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // 🔥 ERROR TRANSLATOR
  const errText = (msg) => {
    if (!msg) return '';

    if (msg.includes('oldin ro‘yxatdan') || msg.includes('already')) {
      return L(
        'Šis tālrunis jau ir reģistrēts. Lūdzu, piesakieties.',
        'Этот номер уже зарегистрирован. Пожалуйста, войдите.',
        'This phone is already registered. Please login.'
      );
    }

    if (msg.includes('ro‘yxatdan o‘tmagan') || msg.includes('not registered')) {
      return L(
        'Šis tālrunis vēl nav reģistrēts.',
        'Этот номер ещё не зарегистрирован.',
        'This phone is not registered yet.'
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
            <div className="auth-ok-icon">✓</div>

            <p className="auth-ok-title">
              {mode === 'register'
                ? L('Reģistrācija veiksmīga!', 'Регистрация успешна!', 'Registration successful!')
                : L('Pieteikšanās veiksmīga!', 'Вход выполнен!', 'Login successful!')}
            </p>

            <p className="auth-ok-sub">
              {L('Turpinām pasūtījumu', 'Продолжаем заказ', 'Continuing order')}
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

              <button className="auth-close-x" onClick={onClose}>×</button>
            </div>

            {/* SWITCH */}
            <div className="auth-switch">
              <button onClick={() => { setMode('register'); setErr(''); }}>
                {L('Reģistrēties', 'Регистрация', 'Register')}
              </button>

              <button onClick={() => { setMode('login'); setErr(''); }}>
                {L('Ienākt', 'Войти', 'Login')}
              </button>
            </div>

            <form onSubmit={submit}>

              {/* NAME */}
              <input
                placeholder={L('Vārds', 'Имя', 'Name')}
                value={form.name}
                onChange={e => s('name', e.target.value)}
                required
              />

              {/* SURNAME */}
              <input
                placeholder={L('Uzvārds', 'Фамилия', 'Surname')}
                value={form.surname}
                onChange={e => s('surname', e.target.value)}
                required
              />

              {/* PHONE */}
              <input
                placeholder={L('Tālrunis', 'Телефон', 'Phone')}
                value={form.phone}
                onChange={e => s('phone', e.target.value)}
                required
              />

              {/* ERROR */}
              {err && (
                <div className="auth-err">
                  {errText(err)}
                </div>
              )}

              <button type="submit" disabled={busy}>
                {busy
                  ? L('Gaida...', 'Подождите...', 'Please wait...')
                  : mode === 'register'
                    ? L('Saglabāt', 'Сохранить', 'Register')
                    : L('Ienākt', 'Войти', 'Login')
                }
              </button>

            </form>
          </>
        )}
      </div>
    </>
  );
}
