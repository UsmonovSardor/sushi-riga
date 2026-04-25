import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthModal({ onClose, onSuccess }) {
  const { register, login } = useAuth();
  const { lang } = useLanguage();

  const [mode, setMode] = useState('register'); // 🔥 register / login
  const [form, setForm] = useState({ name:'', surname:'', phone:'' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const L = (lv, ru, en) => lang === 'lv' ? lv : lang === 'ru' ? ru : en;
  const s = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setErr('');
    setBusy(true);

    try {
      if (mode === 'register') {
        await register(form.name, form.surname, '', form.phone);
      } else {
        await login(form.phone); // 🔥 login phone orqali
      }

      onClose();
      onSuccess?.();

    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="modal-bg" onClick={onClose}/>
      <div className="auth-modal">

        <div className="auth-header">
          <div className="auth-brand">
            {mode === 'register'
              ? L('Reģistrācija','Регистрация','Register')
              : L('Ienākt','Войти','Login')}
          </div>
        </div>

        {/* 🔥 SWITCH */}
        <div style={{display:'flex', gap:10, marginBottom:10}}>
          <button onClick={()=>setMode('register')}>
            {L('Reģistrēties','Регистрация','Register')}
          </button>
          <button onClick={()=>setMode('login')}>
            {L('Ienākt','Войти','Login')}
          </button>
        </div>

        <form onSubmit={submit}>

          {/* NAME faqat registerda */}
          {mode === 'register' && (
            <>
              <input
                placeholder={L('Vārds','Имя','Name')}
                value={form.name}
                onChange={e=>s('name',e.target.value)}
                required
              />
              <input
                placeholder={L('Uzvārds','Фамилия','Surname')}
                value={form.surname}
                onChange={e=>s('surname',e.target.value)}
                required
              />
            </>
          )}

          <input
            placeholder={L('Tālrunis','Телефон','Phone')}
            value={form.phone}
            onChange={e=>s('phone',e.target.value)}
            required
          />

          {err && <div style={{color:'red'}}>{err}</div>}

          <button type="submit">
            {busy
              ? L('Gaidi...','Подождите...','Please wait...')
              : mode === 'register'
                ? L('Saglabāt','Сохранить','Register')
                : L('Ienākt','Войти','Login')
            }
          </button>
        </form>
      </div>
    </>
  );
}
