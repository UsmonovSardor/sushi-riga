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
      setTimeout(onClose, 1400);
    } catch(ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const switchTab = t => { setTab(t); setErr(''); setForm(f=>({...f,password:''})); };

  return (
    <>
      <div className="modal-bg" onClick={onClose}/>
      <div className="auth-modal">
        <div className="modal-drag"/>

        {ok ? (
          <div className="auth-ok">
            <div className="auth-ok-ring">✓</div>
            <p className="auth-ok-msg">
              {tab==='login'
                ? L('Laipni lūdzam atpakaļ!','Добро пожаловать!','Welcome back!')
                : L('Konts izveidots!','Аккаунт создан!','Account created!')}
            </p>
          </div>
        ) : (
          <>
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
                    <span>👤</span>
                    <input type="text" placeholder={L('Jūsu vārds','Ваше имя','Your name')}
                      autoComplete="name" value={form.name} onChange={e=>s('name',e.target.value)} required/>
                  </div>
                </div>
                <div className="afield">
                  <label>{L('Tālrunis','Телефон','Phone')}</label>
                  <div className="ainput-w">
                    <span>📞</span>
                    <input type="tel" placeholder="+371 XX XXX XXX"
                      autoComplete="tel" inputMode="tel" value={form.phone} onChange={e=>s('phone',e.target.value)}/>
                  </div>
                </div>
              </>}

              <div className="afield">
                <label>Email <span className="req">*</span></label>
                <div className="ainput-w">
                  <span>✉️</span>
                  <input type="email" placeholder="you@email.com"
                    autoComplete="email" inputMode="email" value={form.email}
                    onChange={e=>s('email',e.target.value)} required/>
                </div>
              </div>

              <div className="afield">
                <label>{L('Parole','Пароль','Password')} <span className="req">*</span></label>
                <div className="ainput-w">
                  <span>🔒</span>
                  <input type={showPass?'text':'password'}
                    placeholder={L('Vismaz 6 rakstzīmes','Не менее 6 символов','At least 6 chars')}
                    autoComplete={tab==='login'?'current-password':'new-password'}
                    value={form.password} onChange={e=>s('password',e.target.value)} required minLength={6}/>
                  <button type="button" className="pass-eye" onClick={()=>setShowPass(p=>!p)}>
                    {showPass?'🙈':'👁'}
                  </button>
                </div>
              </div>

              {err && <div className="auth-err">⚠️ {err}</div>}

              <button className="auth-btn" type="submit" disabled={busy}>
                {busy
                  ? <><span className="spin"/>  {L('Apstrādā...','Обработка...','Processing...')}</>
                  : tab==='login'
                    ? L('Pieteikties →','Войти →','Sign in →')
                    : L('Izveidot kontu →','Создать аккаунт →','Create account →')
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
