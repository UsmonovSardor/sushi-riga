import React, { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const STATUS_LABELS = {
  new:       { text:'🆕 Yangi',          ru:'🆕 Новый',         color:'#dbeafe', txt:'#1d4ed8' },
  cooking:   { text:'👨‍🍳 Tayyorlanmoqda', ru:'👨‍🍳 Готовится',    color:'#fef9c3', txt:'#a16207' },
  ready:     { text:'✅ Tayyor',          ru:'✅ Готов',          color:'#dcfce7', txt:'#15803d' },
  delivered: { text:'🚀 Yetkazildi',     ru:'🚀 Выдан',         color:'#f0fdf4', txt:'#166534' },
  cancelled: { text:'❌ Bekor',           ru:'❌ Отменён',        color:'#fee2e2', txt:'#991b1b' },
};

const PAY_LABELS = { cash:'💵 Наличные', card:'💳 Карта' };

function emptyForm() {
  return { cat:'cold',e:'🍣',name_ru:'',name_en:'',name_lv:'',desc_ru:'',desc_en:'',desc_lv:'',price:'',old:'',img:'',hit:false };
}

export default function AdminPanel() {
  const [token,   setToken]   = useState(()=>localStorage.getItem('sr_admin')||'');
  const [secret,  setSecret]  = useState('');
  const [loginErr,setLoginErr]= useState('');
  const [tab,     setTab]     = useState('dashboard');
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [menu,    setMenu]    = useState([]);
  const [msg,     setMsg]     = useState('');
  const [search,  setSearch]  = useState('');
  const [catFilter,setCatFilter]= useState('all');
  const [editItem,setEditItem]= useState(null);
  const [form,    setForm]    = useState(emptyForm());
  const [loading, setLoad]    = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAuto] = useState(true);

  const hdrs = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  async function adminLogin(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem('sr_admin', d.token);
      setToken(d.token);
    } catch(ex){ setLoginErr(ex.message); }
  }

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [s,o,m] = await Promise.all([
        fetch(`${API}/api/admin/stats`,{headers:hdrs}).then(r=>r.json()),
        fetch(`${API}/api/admin/orders`,{headers:hdrs}).then(r=>r.json()),
        fetch(`${API}/api/admin/menu`,{headers:hdrs}).then(r=>r.json()),
      ]);
      setStats(s);
      setOrders(Array.isArray(o)?o:[]);
      setMenu(Array.isArray(m)?m:[]);
    } catch(e){ console.error(e); }
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 30s on orders/dashboard tab
  useEffect(() => {
    if (!autoRefresh || !token) return;
    const id = setInterval(() => { if(tab==='dashboard'||tab==='orders') loadAll(); }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, tab, token, loadAll]);

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  async function updateStatus(id, status) {
    await fetch(`${API}/api/admin/orders/${id}`,{method:'PATCH',headers:hdrs,body:JSON.stringify({status})});
    setOrders(prev => prev.map(o => o.id==id ? {...o,status} : o));
    // Update stats counter
    setStats(s => s ? {...s, byStatus: {...s.byStatus}} : s);
  }

  async function saveMenuItem(e) {
    e.preventDefault(); setLoad(true);
    const body = {
      cat:form.cat, e:form.e, hit:form.hit, img:form.img,
      price:parseFloat(form.price), old:form.old?parseFloat(form.old):null,
      name:{ru:form.name_ru,en:form.name_en||form.name_ru,lv:form.name_lv||form.name_ru},
      desc:{ru:form.desc_ru,en:form.desc_en||form.desc_ru,lv:form.desc_lv||form.desc_ru},
    };
    try {
      const url = editItem ? `${API}/api/admin/menu/${editItem.id}` : `${API}/api/admin/menu`;
      const r   = await fetch(url,{method:editItem?'PUT':'POST',headers:hdrs,body:JSON.stringify(body)});
      if (!r.ok) throw new Error('Save error');
      flash(editItem?'✅ Обновлено':'✅ Добавлено');
      setEditItem(null); setForm(emptyForm()); setTab('menu');
      await loadAll();
    } catch(ex){ flash('❌ '+ex.message); }
    finally { setLoad(false); }
  }

  async function deleteItem(id) {
    if (!confirm('Удалить позицию?')) return;
    await fetch(`${API}/api/admin/menu/${id}`,{method:'DELETE',headers:hdrs});
    flash('🗑 Удалено'); await loadAll();
  }

  async function toggleHit(id) {
    await fetch(`${API}/api/admin/menu/${id}/hit`,{method:'PATCH',headers:hdrs});
    await loadAll();
  }

  function startEdit(item) {
    setEditItem(item);
    setForm({ cat:item.cat,e:item.e||'🍣',hit:item.hit||false,img:item.img||'',
      price:item.price,old:item.old||'',
      name_ru:item.name.ru,name_en:item.name.en,name_lv:item.name.lv||item.name.en,
      desc_ru:item.desc.ru,desc_en:item.desc.en,desc_lv:item.desc.lv||item.desc.en });
    setTab('add');
  }

  const fmt = (n) => typeof n==='number' ? n.toFixed(2) : '0.00';
  const fmtTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ru-RU',{timeZone:'Europe/Riga',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  };

  const CATS = ['cold','hot','tempura','gunkan','nigiri','sashimi','double','sets','soup','wok','burger','salad','snacks','drinks'];
  const EMOJIS = ['🍣','🔥','🍤','🎎','🥗','🍜','🍱','🥤','🍟','🍛','🍔','🎁'];

  const filteredOrders = orders.filter(o =>
    (statusFilter==='all' || o.status===statusFilter) &&
    (!search || o.name?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search))
  );

  const filteredMenu = menu.filter(i =>
    (catFilter==='all' || i.cat===catFilter) &&
    (!search || i.name?.ru?.toLowerCase().includes(search.toLowerCase()))
  );

  // Not logged in
  if (!token) return (
    <div className="adm-login">
      <div className="adm-login-box">
        <div className="adm-logo">🍣 SUSHI RĪGA</div>
        <h2 className="adm-title">Панель администратора</h2>
        <form onSubmit={adminLogin}>
          <div className="form-group">
            <label className="form-label">Секретный ключ</label>
            <input className="form-input" type="password" placeholder="Введите ключ"
              value={secret} onChange={e=>setSecret(e.target.value)} required/>
          </div>
          {loginErr && <div className="auth-err">{loginErr}</div>}
          <button className="btn-primary" type="submit">Войти →</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="adm">
      {/* Header */}
      <div className="adm-hd">
        <div className="adm-hd-left">
          <span className="adm-hd-logo">🍣 SUSHI RĪGA</span>
          <span className="adm-hd-badge">Admin</span>
        </div>
        <div className="adm-hd-right">
          <label className="adm-auto">
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAuto(e.target.checked)} style={{marginRight:4}}/>
            Авто-обновление
          </label>
          <button className="adm-hd-link" onClick={loadAll}>🔄 Обновить</button>
          <a href="/" target="_blank" className="adm-hd-link">Сайт ↗</a>
          <button className="adm-logout" onClick={()=>{localStorage.removeItem('sr_admin');setToken('');}}>Выйти</button>
        </div>
      </div>

      {msg && <div className="adm-msg">{msg}</div>}

      {/* Tabs */}
      <div className="adm-tabs">
        {[
          ['dashboard','📊 Дашборд'],
          ['orders',   `📦 Заказы${stats?.todayOrders?' ('+stats.todayOrders+')':''}` ],
          ['menu',     `🍣 Меню (${menu.length})`],
          ['add',      editItem?'✏️ Редактировать':'➕ Добавить'],
        ].map(([k,label])=>(
          <button key={k} className={'adm-tab'+(tab===k?' on':'')}
            onClick={()=>{ setTab(k); if(k!=='add'){setEditItem(null);setForm(emptyForm());} setSearch(''); }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==='dashboard' && stats && (
        <div className="adm-body">
          {/* KPI cards */}
          <div className="dash-kpi">
            <div className="dash-card dash-card--red">
              <div className="dash-card-val">€{fmt(stats.totalRevenue)}</div>
              <div className="dash-card-lbl">Общая выручка</div>
            </div>
            <div className="dash-card">
              <div className="dash-card-val">{stats.totalOrders}</div>
              <div className="dash-card-lbl">Всего заказов</div>
            </div>
            <div className="dash-card dash-card--green">
              <div className="dash-card-val">€{fmt(stats.todayRevenue)}</div>
              <div className="dash-card-lbl">Сегодня выручка</div>
            </div>
            <div className="dash-card">
              <div className="dash-card-val">{stats.todayOrders}</div>
              <div className="dash-card-lbl">Сегодня заказов</div>
            </div>
          </div>

          <div className="dash-row">
            {/* Status breakdown */}
            <div className="dash-block">
              <div className="dash-block-title">📊 По статусам</div>
              {Object.entries(STATUS_LABELS).map(([k,v])=>{
                const cnt = stats.byStatus?.[k]||0;
                const pct = stats.totalOrders ? Math.round(cnt/stats.totalOrders*100) : 0;
                return (
                  <div key={k} className="dash-stat-row">
                    <span style={{flex:1,fontSize:'.83rem',fontWeight:600}}>{v.ru}</span>
                    <span style={{marginRight:8,fontSize:'.83rem',color:'var(--muted)'}}>{cnt}</span>
                    <div className="dash-bar-bg">
                      <div className="dash-bar-fill" style={{width:pct+'%',background:v.txt}}/>
                    </div>
                    <span style={{width:30,textAlign:'right',fontSize:'.78rem',color:'var(--muted)'}}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* Last 7 days */}
            <div className="dash-block">
              <div className="dash-block-title">📈 Последние 7 дней</div>
              {Object.entries(stats.last7||{}).map(([date,d])=>(
                <div key={date} className="dash-stat-row">
                  <span style={{flex:1,fontSize:'.8rem',color:'var(--muted)'}}>{date.slice(5)}</span>
                  <span style={{fontSize:'.8rem',fontWeight:700,minWidth:50,textAlign:'right'}}>€{fmt(d.revenue)}</span>
                  <span style={{fontSize:'.75rem',color:'var(--muted)',marginLeft:6}}>{d.orders} шт</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-row">
            {/* Top items */}
            <div className="dash-block">
              <div className="dash-block-title">⭐ Топ блюда</div>
              {(stats.topItems||[]).map((item,i)=>(
                <div key={i} className="dash-stat-row">
                  <span style={{width:20,fontSize:'.78rem',color:'var(--muted)'}}>{i+1}</span>
                  <span style={{flex:1,fontSize:'.83rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
                  <span style={{fontSize:'.83rem',fontWeight:800,color:'var(--red)'}}>{item.qty} шт</span>
                </div>
              ))}
            </div>

            {/* Payment methods */}
            <div className="dash-block">
              <div className="dash-block-title">💳 Способы оплаты</div>
              {Object.entries(stats.byPay||{}).map(([k,v])=>(
                <div key={k} className="dash-stat-row">
                  <span style={{flex:1,fontSize:'.83rem'}}>{PAY_LABELS[k]||k}</span>
                  <span style={{fontWeight:800,fontSize:'.9rem'}}>{v}</span>
                </div>
              ))}
              <div className="dash-divider"/>
              <div className="dash-stat-row">
                <span style={{flex:1,fontSize:'.83rem',fontWeight:700}}>Позиций в меню</span>
                <span style={{fontWeight:800}}>{stats.totalItems}</span>
              </div>
              <div className="dash-stat-row">
                <span style={{flex:1,fontSize:'.83rem',fontWeight:700}}>Пользователей</span>
                <span style={{fontWeight:800}}>{stats.totalUsers}</span>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="dash-block" style={{marginTop:0}}>
            <div className="dash-block-title">🕐 Последние заказы</div>
            {orders.slice(0,10).map(o=>(
              <div key={o.id} className="dash-order-row" onClick={()=>setTab('orders')}>
                <span className="dash-order-id">#{o.id}</span>
                <span className="dash-order-name">{o.name}</span>
                <span className="dash-order-time">{fmtTime(o.createdAt)}</span>
                <span className="adm-order-status adm-status-s" style={{background:STATUS_LABELS[o.status]?.color,color:STATUS_LABELS[o.status]?.txt}}>
                  {STATUS_LABELS[o.status]?.ru||o.status}
                </span>
                <span className="dash-order-total">€{fmt(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab==='orders' && (
        <div className="adm-body">
          <div className="adm-filters">
            <input className="adm-search" placeholder="🔍 Поиск по имени или #номеру..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="adm-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">Все статусы ({orders.length})</option>
              {Object.entries(STATUS_LABELS).map(([k,v])=>(
                <option key={k} value={k}>{v.ru} ({orders.filter(o=>o.status===k).length})</option>
              ))}
            </select>
          </div>

          {filteredOrders.length===0 && (
            <div style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>Заказов нет</div>
          )}

          {filteredOrders.map(o=>(
            <div key={o.id} className="adm-order">
              <div className="adm-order-hd">
                <span className="adm-order-num">#{o.id}</span>
                <span className="adm-order-status adm-status-s"
                  style={{background:STATUS_LABELS[o.status||'new']?.color,color:STATUS_LABELS[o.status||'new']?.txt}}>
                  {STATUS_LABELS[o.status||'new']?.ru}
                </span>
                <span className="adm-order-time">🕐 {fmtTime(o.createdAt)}</span>
                <span className="adm-order-pay">{PAY_LABELS[o.payMethod]||o.payMethod}</span>
                <select className="adm-status-sel" value={o.status||'new'}
                  onChange={e=>updateStatus(o.id,e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([k,v])=>(
                    <option key={k} value={k}>{v.ru}</option>
                  ))}
                </select>
              </div>
              <div className="adm-order-body">
                <div className="adm-order-customer">
                  <span>👤 <b>{o.name}</b></span>
                  <span>📞 <a href={`tel:${o.phone}`}>{o.phone}</a></span>
                  {o.note && <span>💬 {o.note}</span>}
                </div>
                <div className="adm-order-items">
                  {o.items?.map((i,idx)=>(
                    <span key={idx} className="adm-order-item">
                      {i.e} {i.name?.ru} ×{i.qty} = €{((i.price||0)*i.qty).toFixed(2)}
                    </span>
                  ))}
                </div>
                <div className="adm-order-total">
                  💰 Итого: <b>€{fmt(o.total)}</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MENU ── */}
      {tab==='menu' && (
        <div className="adm-body">
          <div className="adm-filters">
            <input className="adm-search" placeholder="🔍 Поиск по названию..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="adm-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              <option value="all">Все ({menu.length})</option>
              {CATS.map(c=><option key={c} value={c}>{c} ({menu.filter(i=>i.cat===c).length})</option>)}
            </select>
          </div>
          <div className="adm-grid">
            {filteredMenu.map(item=>(
              <div key={item.id} className="adm-card">
                <div className="adm-card-img">
                  {item.img ? <img src={item.img} alt="" onError={e=>e.target.style.display='none'}/> : <span style={{fontSize:'2.5rem'}}>{item.e}</span>}
                  {item.hit && <span className="adm-hit">ХИТ</span>}
                </div>
                <div className="adm-card-body">
                  <div className="adm-card-name">{item.name?.ru}</div>
                  <div className="adm-card-cat">{item.cat}</div>
                  <div className="adm-card-price">€{item.price?.toFixed(2)}</div>
                </div>
                <div className="adm-card-actions">
                  <button className="adm-btn adm-btn-hit" onClick={()=>toggleHit(item.id)} title="Хит">{item.hit?'⭐':'☆'}</button>
                  <button className="adm-btn adm-btn-edit" onClick={()=>startEdit(item)}>✏️</button>
                  <button className="adm-btn adm-btn-del"  onClick={()=>deleteItem(item.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD/EDIT ── */}
      {tab==='add' && (
        <div className="adm-body">
          <form onSubmit={saveMenuItem} className="adm-form">
            <h3 className="adm-form-title">
              {editItem ? `✏️ Редактировать: ${editItem.name?.ru}` : '➕ Добавить позицию'}
            </h3>
            <div className="adm-row">
              <div className="form-group">
                <label className="form-label">Категория *</label>
                <select className="form-input" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Эмодзи</label>
                <select className="form-input" value={form.e} onChange={e=>setForm(f=>({...f,e:e.target.value}))}>
                  {EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Хит продаж</label>
                <select className="form-input" value={form.hit?'yes':'no'} onChange={e=>setForm(f=>({...f,hit:e.target.value==='yes'}))}>
                  <option value="no">Нет</option>
                  <option value="yes">⭐ Да</option>
                </select>
              </div>
            </div>
            <div className="adm-row">
              <div className="form-group" style={{flex:2}}>
                <label className="form-label">URL картинки</label>
                <input className="form-input" type="url" placeholder="https://..."
                  value={form.img} onChange={e=>setForm(f=>({...f,img:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Цена € *</label>
                <input className="form-input" type="number" step="0.1" min="0" placeholder="8.90"
                  value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Старая цена €</label>
                <input className="form-input" type="number" step="0.1" min="0" placeholder="11.00"
                  value={form.old} onChange={e=>setForm(f=>({...f,old:e.target.value}))}/>
              </div>
            </div>
            {form.img && <img src={form.img} alt="" className="adm-preview" onError={e=>e.target.style.display='none'}/>}
            <div className="adm-section">Название</div>
            <div className="adm-row">
              {[['ru','🇷🇺 RU'],['en','🇬🇧 EN'],['lv','🇱🇻 LV']].map(([l,lbl])=>(
                <div key={l} className="form-group">
                  <label className="form-label">{lbl}</label>
                  <input className="form-input" placeholder={`Название (${l})`}
                    value={form[`name_${l}`]} onChange={e=>setForm(f=>({...f,[`name_${l}`]:e.target.value}))} required={l==='ru'}/>
                </div>
              ))}
            </div>
            <div className="adm-section">Описание</div>
            <div className="adm-row">
              {[['ru','🇷🇺 RU'],['en','🇬🇧 EN'],['lv','🇱🇻 LV']].map(([l,lbl])=>(
                <div key={l} className="form-group">
                  <label className="form-label">{lbl}</label>
                  <input className="form-input" placeholder={`Описание (${l})`}
                    value={form[`desc_${l}`]} onChange={e=>setForm(f=>({...f,[`desc_${l}`]:e.target.value}))}/>
                </div>
              ))}
            </div>
            <div className="adm-form-btns">
              <button className="btn-primary" type="submit" disabled={loading} style={{flex:1}}>
                {loading?'⏳...' : editItem?'💾 Сохранить':'➕ Добавить в меню'}
              </button>
              <button type="button" className="btn-secondary" onClick={()=>{setTab('menu');setEditItem(null);setForm(emptyForm());}}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
