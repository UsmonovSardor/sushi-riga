import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [tab, setTab]     = useState('login'); // login | register
  const [form, setForm]   = useState({ name:'', email:'', password:'', phone:'' });
  const [err, setErr]     = useState('');
  const [load, setLoad]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoad(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password, form.phone);
      onClose();
    } catch(ex) { setErr(ex.message); }
    finally { setLoad(false); }
  };

  return (
    <>
      <div className="order-bg" onClick={onClose} />
      <div className="auth-modal">
        <div className="order-handle" />
        <div className="auth-tabs">
          <button className={'auth-tab' + (tab==='login'?' on':'')} onClick={() => { setTab('login'); setErr(''); }}>
            Войти
          </button>
          <button className={'auth-tab' + (tab==='register'?' on':'')} onClick={() => { setTab('register'); setErr(''); }}>
            Регистрация
          </button>
        </div>

        <form onSubmit={submit}>
          {tab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Имя *</label>
                <input className="form-input" type="text" placeholder="Ваше имя"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input className="form-input" type="tel" placeholder="+371 XX XXX XXX"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" placeholder="email@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <input className="form-input" type="password" placeholder="Минимум 6 символов"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>

          {err && <div className="auth-err">{err}</div>}

          <button className="btn-primary" type="submit" disabled={load}>
            {load ? '...' : tab === 'login' ? '→ Войти' : '→ Создать аккаунт'}
          </button>
        </form>

        <div className="auth-footer">
          {tab === 'login'
            ? <span>Нет аккаунта? <button className="auth-link" onClick={() => { setTab('register'); setErr(''); }}>Зарегистрироваться</button></span>
            : <span>Уже есть аккаунт? <button className="auth-link" onClick={() => { setTab('login'); setErr(''); }}>Войти</button></span>
          }
        </div>
      </div>
    </>
  );
}
