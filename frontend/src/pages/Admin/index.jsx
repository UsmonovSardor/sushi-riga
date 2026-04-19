import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('sr_admin') || '');
  const [secret, setSecret] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('menu'); // menu | add
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ cat:'cold', name_ru:'', name_en:'', name_lv:'', desc_ru:'', desc_en:'', desc_lv:'', price:'', old:'', img:'', e:'🍣', hit: false });
  const [msg, setMsg] = useState('');

  const [orders, setOrders] = useState([]);

  const statusLabel = s => ({new:'🆕 Новый',cooking:'👨‍🍳 Готовится',ready:'✅ Готов',delivered:'🚀 Доставлен',cancelled:'❌ Отменён'})[s] || s;

  async function loadOrders() {
    try {
      const r = await fetch(`${API}/api/admin/orders`, { headers: hdrs });
      const d = await r.json();
      if (Array.isArray(d)) setOrders(d);
      await loadOrders();
    } catch {}
  }

  async function updateOrderStatus(id, status) {
    await fetch(`${API}/api/admin/orders/${id}`, { method:'PATCH', headers: hdrs, body: JSON.stringify({status}) });
    await loadOrders();
  }

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const hdrs = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function adminLogin(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/api/admin/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ secret }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem('sr_admin', d.token);
      setToken(d.token);
    } catch(ex) { setLoginErr(ex.message); }
  }

  async function loadData() {
    if (!token) return;
    try {
      const [m, s] = await Promise.all([
        fetch(`${API}/api/admin/menu`, { headers: hdrs }).then(r => r.json()),
        fetch(`${API}/api/admin/stats`, { headers: hdrs }).then(r => r.json()),
      ]);
      setMenu(Array.isArray(m) ? m : []);
      setStats(s);
    } catch {}
  }

  useEffect(() => { loadData(); }, [token]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function startEdit(item) {
    setEditItem(item);
    setForm({
      cat: item.cat, e: item.e || '🍣',
      name_ru: item.name.ru, name_en: item.name.en, name_lv: item.name.lv || item.name.en,
      desc_ru: item.desc.ru, desc_en: item.desc.en, desc_lv: item.desc.lv || item.desc.en,
      price: item.price, old: item.old || '', img: item.img || '', hit: item.hit || false
    });
    setTab('add');
  }

  async function saveItem(e) {
    e.preventDefault();
    setLoading(true);
    const body = {
      cat: form.cat, e: form.e, img: form.img, hit: form.hit,
      price: parseFloat(form.price), old: form.old ? parseFloat(form.old) : null,
      name: { ru: form.name_ru, en: form.name_en, lv: form.name_lv || form.name_en },
      desc: { ru: form.desc_ru, en: form.desc_en, lv: form.desc_lv || form.desc_en },
    };
    try {
      const url = editItem ? `${API}/api/admin/menu/${editItem.id}` : `${API}/api/admin/menu`;
      const method = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: hdrs, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('Error saving');
      setMsg(editItem ? '✅ Обновлено!' : '✅ Добавлено!');
      setEditItem(null);
      setForm({ cat:'cold', name_ru:'', name_en:'', name_lv:'', desc_ru:'', desc_en:'', desc_lv:'', price:'', old:'', img:'', e:'🍣', hit:false });
      setTab('menu');
      await loadData();
    } catch(ex) { setMsg('❌ ' + ex.message); }
    finally { setLoading(false); setTimeout(() => setMsg(''), 3000); }
  }

  async function deleteItem(id) {
    if (!confirm('Удалить позицию?')) return;
    await fetch(`${API}/api/admin/menu/${id}`, { method:'DELETE', headers: hdrs });
    await loadData();
    setMsg('🗑 Удалено');
    setTimeout(() => setMsg(''), 2000);
  }

  async function toggleHit(id) {
    await fetch(`${API}/api/admin/menu/${id}/hit`, { method:'PATCH', headers: hdrs });
    await loadData();
  }

  const CATS = ['cold','hot','tempura','gunkan','nigiri','sashimi','double','sets','soup','wok','burger','salad','snacks','drinks'];
  const EMOJIS = ['🍣','🔥','🍤','🎎','🥗','🍜','🍱','🥤','🍟','🍛','🍔'];

  const filtered = menu.filter(item => {
    const matchCat = filterCat === 'all' || item.cat === filterCat;
    const matchSearch = !search || item.name.ru?.toLowerCase().includes(search.toLowerCase()) || item.name.en?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!token) return (
    <div className="adm-login">
      <div className="adm-login-box">
        <div className="adm-logo">🍣 SUSHI RĪGA</div>
        <h2 className="adm-title">Панель управления</h2>
        <form onSubmit={adminLogin}>
          <div className="form-group">
            <label className="form-label">Секретный ключ</label>
            <input className="form-input" type="password" placeholder="Введите ключ доступа"
              value={secret} onChange={e => setSecret(e.target.value)} required />
          </div>
          {loginErr && <div className="auth-err">{loginErr}</div>}
          <button className="btn-primary" type="submit">Войти в панель</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="adm">
      {/* HEADER */}
      <div className="adm-hd">
        <div className="adm-hd-left">
          <span className="adm-hd-logo">🍣 SUSHI RĪGA</span>
          <span className="adm-hd-badge">Admin</span>
        </div>
        <div className="adm-hd-right">
          <a href="/" className="adm-hd-link" target="_blank">Открыть сайт ↗</a>
          <button className="adm-logout" onClick={() => { localStorage.removeItem('sr_admin'); setToken(''); }}>Выйти</button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="adm-stats">
          <div className="adm-stat"><div className="adm-stat-n">{stats.totalItems}</div><div className="adm-stat-l">Позиций в меню</div></div>
          <div className="adm-stat"><div className="adm-stat-n">{stats.totalUsers}</div><div className="adm-stat-l">Пользователей</div></div>
          <div className="adm-stat"><div className="adm-stat-n">{stats.categories}</div><div className="adm-stat-l">Категорий</div></div>
        </div>
      )}

      {msg && <div className="adm-msg">{msg}</div>}

      {/* TABS */}
      <div className="adm-tabs">
        <button className={'adm-tab'+(tab==='menu'?' on':'')} onClick={() => { setTab('menu'); setEditItem(null); }}>📋 Меню ({menu.length})</button>
        <button className={'adm-tab'+(tab==='orders'?' on':'')} onClick={() => setTab('orders')}>📦 Заказы</button>
        <button className={'adm-tab'+(tab==='add'?' on':''} onClick={() => { setTab('add'); setEditItem(null); setForm({ cat:'cold', name_ru:'', name_en:'', name_lv:'', desc_ru:'', desc_en:'', desc_lv:'', price:'', old:'', img:'', e:'🍣', hit:false }); }}>
          {editItem ? '✏️ Редактировать' : '➕ Добавить'}
        </button>
      </div>

      {/* MENU LIST */}
      {tab === 'menu' && (
        <div className="adm-body">
          <div className="adm-filters">
            <input className="adm-search" placeholder="🔍 Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="adm-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">Все категории</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="adm-grid">
            {filtered.map(item => (
              <div key={item.id} className="adm-card">
                <div className="adm-card-img">
                  {item.img ? <img src={item.img} alt="" onError={e=>e.target.style.display='none'} /> : <span style={{fontSize:'2.5rem'}}>{item.e}</span>}
                  {item.hit && <span className="adm-hit">ХИТ</span>}
                </div>
                <div className="adm-card-body">
                  <div className="adm-card-name">{item.name.ru}</div>
                  <div className="adm-card-cat">{item.cat}</div>
                  <div className="adm-card-price">€{item.price?.toFixed(2)}</div>
                </div>
                <div className="adm-card-actions">
                  <button className="adm-btn adm-btn-hit" onClick={() => toggleHit(item.id)} title={item.hit ? 'Убрать из хитов' : 'Сделать хитом'}>
                    {item.hit ? '⭐' : '☆'}
                  </button>
                  <button className="adm-btn adm-btn-edit" onClick={() => startEdit(item)}>✏️</button>
                  <button className="adm-btn adm-btn-del" onClick={() => deleteItem(item.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="adm-body">
          <div className="adm-orders">
            {orders.length === 0 ? (
              <div style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}>Заказов пока нет</div>
            ) : orders.map(o => (
              <div key={o.id} className="adm-order">
                <div className="adm-order-hd">
                  <span className="adm-order-num">#{o.id}</span>
                  <span className={'adm-order-status adm-status-'+o.status}>{statusLabel(o.status)}</span>
                  <span className="adm-order-time">{new Date(o.createdAt).toLocaleString('ru-RU',{timeZone:'Europe/Riga'})}</span>
                  <select className="adm-select" style={{marginLeft:'auto',height:30,fontSize:'.75rem'}}
                    value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                    <option value="new">🆕 Новый</option>
                    <option value="cooking">👨‍🍳 Готовится</option>
                    <option value="ready">✅ Готов</option>
                    <option value="delivered">🚀 Доставлен</option>
                    <option value="cancelled">❌ Отменён</option>
                  </select>
                </div>
                <div className="adm-order-body">
                  <div className="adm-order-info">
                    <b>{o.name}</b> · {o.phone} · {o.address}
                    {o.note && <span style={{color:'var(--muted)'}}> · {o.note}</span>}
                  </div>
                  <div className="adm-order-items">
                    {o.items?.map((i,idx) => <span key={idx} className="adm-order-item">{i.e} {i.name?.ru} ×{i.qty}</span>)}
                  </div>
                  <div className="adm-order-total">
                    {o.payMethod === 'cash' ? '💵' : '💳'} €{o.total?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM */}
      {tab === 'add' && (
        <div className="adm-body">
          <form onSubmit={saveItem} className="adm-form">
            <h3 className="adm-form-title">{editItem ? `Редактировать: ${editItem.name.ru}` : 'Добавить новую позицию'}</h3>

            <div className="adm-row">
              <div className="form-group">
                <label className="form-label">Категория *</label>
                <select className="form-input" value={form.cat} onChange={e => set('cat', e.target.value)}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Эмодзи</label>
                <select className="form-input" value={form.e} onChange={e => set('e', e.target.value)}>
                  {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Хит продаж</label>
                <select className="form-input" value={form.hit ? 'yes' : 'no'} onChange={e => set('hit', e.target.value === 'yes')}>
                  <option value="no">Нет</option>
                  <option value="yes">Да ⭐</option>
                </select>
              </div>
            </div>

            <div className="adm-row">
              <div className="form-group" style={{flex:2}}>
                <label className="form-label">URL картинки</label>
                <input className="form-input" type="url" placeholder="https://..." value={form.img} onChange={e => set('img', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Цена (€) *</label>
                <input className="form-input" type="number" step="0.1" min="0" placeholder="8.90" value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Старая цена (€)</label>
                <input className="form-input" type="number" step="0.1" min="0" placeholder="11.00" value={form.old} onChange={e => set('old', e.target.value)} />
              </div>
            </div>

            {form.img && <img src={form.img} alt="" className="adm-preview" onError={e=>e.target.style.display='none'} />}

            <div className="adm-section">Название</div>
            <div className="adm-row">
              {[['ru','🇷🇺 RU'],['en','🇬🇧 EN'],['lv','🇱🇻 LV']].map(([lang, lbl]) => (
                <div key={lang} className="form-group">
                  <label className="form-label">{lbl} *</label>
                  <input className="form-input" type="text" placeholder={`Название (${lang})`} value={form[`name_${lang}`]} onChange={e => set(`name_${lang}`, e.target.value)} required={lang==='ru'} />
                </div>
              ))}
            </div>

            <div className="adm-section">Описание</div>
            <div className="adm-row">
              {[['ru','🇷🇺 RU'],['en','🇬🇧 EN'],['lv','🇱🇻 LV']].map(([lang, lbl]) => (
                <div key={lang} className="form-group">
                  <label className="form-label">{lbl}</label>
                  <input className="form-input" type="text" placeholder={`Описание (${lang})`} value={form[`desc_${lang}`]} onChange={e => set(`desc_${lang}`, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="adm-form-btns">
              <button className="btn-primary" type="submit" disabled={loading} style={{flex:1}}>
                {loading ? '...' : editItem ? '💾 Сохранить изменения' : '➕ Добавить в меню'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setTab('menu'); setEditItem(null); }}>Отмена</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
