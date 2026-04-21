import React, { useState } from 'react';
import { useAuth }     from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const { lang } = useLanguage();
  const [tab,  setTab]  = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const [ok,   setOk]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const L = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;
  const s = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      if (tab==='login') await login(form.email, form.password);
      else               await register(form.name, form.email, form.password, form.phone);
      setOk(true);
      setTimeout(onClose, 1200);
    } catch(ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const switchTab = t => { setTab(t); setErr(''); setForm(f=>({...f,password:''})); };

  return (
    <>
      <div className="modal-bg" onClick={onClose}/>
      <div className="auth-modal">
        <div className="auth-modal-handle"/>

        {ok ? (
          <div className="auth-ok">
            <div className="auth-ok-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="auth-ok-title">
              {tab==='login'
                ? L('Laipni lūdzam!','Добро пожаловать!','Welcome back!')
                : L('Konts izveidots!','Аккаунт создан!','Account created!')}
            </p>
            <p className="auth-ok-sub">{L('Tiekamies drīz!','Приятного аппетита!','Enjoy your meal!')}</p>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div className="auth-brand">🍒 Cherry Sushi</div>
              <button className="auth-close-x" onClick={onClose} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="auth-tabs">
              <button className={'auth-tab'+(tab==='login'?' on':'')} onClick={()=>switchTab('login')}>
                {L('Pieteikties','Войти','Sign in')}
              </button>
              <button className={'auth-tab'+(tab==='reg'?' on':'')} onClick={()=>switchTab('reg')}>
                {L('Jauns konts','Регистрация','Register')}
              </button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {tab==='reg' && <>
                <div className="afield">
                  <label>{L('Vārds','Имя','Name')} <span className="req">*</span></label>
                  <div className="ainput-w">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input type="text" placeholder={L('Jūsu vārds','Ваше имя','Your name')}
                      autoComplete="name" value={form.name} onChange={e=>s('name',e.target.value)} required/>
                  </div>
                </div>
                <div className="afield">
                  <label>{L('Tālrunis','Телефон','Phone')}</label>
                  <div className="ainput-w">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    <input type="tel" placeholder="+371 XX XXX XXX"
                      autoComplete="tel" inputMode="tel" value={form.phone} onChange={e=>s('phone',e.target.value)}/>
                  </div>
                </div>
              </>}

              <div className="afield">
                <label>Email <span className="req">*</span></label>
                <div className="ainput-w">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" placeholder="you@email.com"
                    autoComplete="email" inputMode="email" value={form.email}
                    onChange={e=>s('email',e.target.value)} required/>
                </div>
              </div>

              <div className="afield">
                <label>{L('Parole','Пароль','Password')} <span className="req">*</span></label>
                <div className="ainput-w">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <input type={showPass?'text':'password'}
                    placeholder={L('Vismaz 6 rakstzīmes','Не менее 6 символов','At least 6 chars')}
                    autoComplete={tab==='login'?'current-password':'new-password'}
                    value={form.password} onChange={e=>s('password',e.target.value)} required minLength={6}/>
                  <button type="button" className="pass-eye" onClick={()=>setShowPass(p=>!p)} aria-label="Toggle password">
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {err && <div className="auth-err"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {err}</div>}

              <button className="auth-btn" type="submit" disabled={busy}>
                {busy
                  ? <><span className="spin"/>  {L('Apstrādā...','Обработка...','Please wait...')}</>
                  : tab==='login'
                    ? L('Pieteikties','Войти в аккаунт','Sign in')
                    : L('Izveidot kontu','Создать аккаунт','Create account')
                }
              </button>
            </form>

            <div className="auth-foot">
              {tab==='login'
                ? <>{L('Nav konta?','Нет аккаунта?','No account?')} <button className="auth-link" onClick={()=>switchTab('reg')}>{L('Reģistrēties','Зарегистрироваться','Register')}</button></>
                : <>{L('Jau ir konts?','Есть аккаунт?','Have account?')} <button className="auth-link" onClick={()=>switchTab('login')}>{L('Pieteikties','Войти','Sign in')}</button></>
              }
            </div>
          </>
        )}
      </div>
    </>
  );
}
