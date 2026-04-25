import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const API = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';

const STATUS = {
  new: { label: 'Yangi', color: '#dbeafe', text: '#1d4ed8', icon: '🆕' },
  cooking: { label: 'Tayyorlanmoqda', color: '#fef9c3', text: '#a16207', icon: '👨‍🍳' },
  ready: { label: 'Tayyor', color: '#dcfce7', text: '#15803d', icon: '✅' },
  delivered: { label: 'Berildi', color: '#f0fdf4', text: '#166534', icon: '🚀' },
  cancelled: { label: 'Bekor', color: '#fee2e2', text: '#991b1b', icon: '❌' },
};

const TEXT = {
  confirmDelete: {
    en: 'Are you sure you want to delete?',
    ru: 'Вы уверены, что хотите удалить?',
    lv: 'Vai tiešām vēlaties dzēst?',
  },
  confirmDeleteSelected: {
    en: 'Are you sure you want to delete selected orders?',
    ru: 'Вы уверены, что хотите удалить выбранные заказы?',
    lv: 'Vai tiešām vēlaties dzēst atlasītos pasūtījumus?',
  },
  confirmClearAll: {
    en: 'Delete ALL orders? This cannot be undone!',
    ru: 'Удалить ВСЕ заказы? Это действие нельзя отменить!',
    lv: 'Dzēst VISUS pasūtījumus? To nevarēs atcelt!',
  },
  confirmDeleteReview: {
    en: 'Are you sure you want to delete this review?',
    ru: 'Вы уверены, что хотите удалить этот отзыв?',
    lv: 'Vai tiešām vēlaties dzēst šo atsauksmi?',
  },
};

const PAY = { cash: '💵 Naqd', card: '💳 Karta' };

const CATS = [
  'cold', 'hot', 'tempura', 'gunkan', 'nigiri', 'sashimi',
  'double', 'sets', 'soup', 'wok', 'burger', 'salad',
  'poke', 'snacks', 'drinks'
];

const EMOJIS = [
  '🍣', '🔥', '🍤', '🎎', '🥗', '🍜', '🍱', '🥤', '🍟',
  '🍛', '🍔', '🎁', '🍒', '🦐', '🥢', '🐟', '🍙', '🌮'
];

const S = {
  inp: {
    width: '100%',
    height: 42,
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '0 14px',
    fontSize: '.88rem',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'Inter,sans-serif',
  },
  lbl: {
    fontSize: '.72rem',
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 5,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,.07)',
    border: '1px solid #f1f5f9',
  },
  btn: (bg, col = '#fff', pad = '0 18px') => ({
    background: bg,
    color: col,
    border: 'none',
    borderRadius: 10,
    padding: pad,
    height: 40,
    fontWeight: 700,
    fontSize: '.84rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'Inter,sans-serif',
    whiteSpace: 'nowrap',
  }),
};

const Stars = ({ n, size = 16, onClick }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span
        key={i}
        onClick={onClick ? () => onClick(i) : undefined}
        style={{
          fontSize: size,
          color: i <= n ? '#f59e0b' : '#d1d5db',
          cursor: onClick ? 'pointer' : 'default',
          lineHeight: 1,
        }}
      >
        ★
      </span>
    ))}
  </span>
);

const emptyForm = () => ({
  cat: 'cold',
  e: '🍣',
  name_ru: '',
  name_lv: '',
  name_en: '',
  desc_ru: '',
  desc_lv: '',
  desc_en: '',
  price: '',
  old: '',
  img: '',
  hit: false,
});

export default function Admin() {
  const { lang } = useLanguage();

  const [token, setToken] = useState(() => localStorage.getItem('sr_admin') || '');
  const [secret, setSecret] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [tab, setTab] = useState('orders');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [msg, setMsg] = useState('');
  const [search, setSrch] = useState('');
  const [catF, setCatF] = useState('all');
  const [stF, setStF] = useState('all');
  const [editItem, setEdit] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [imgMode, setImgMode] = useState('url');
  const [imgLoad, setImgLoad] = useState(false);
  const fileRef = useRef(null);

  const hdrs = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const tr = key => TEXT[key]?.[lang] || TEXT[key]?.ru || TEXT[key]?.en || '';
  const flash = m => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };

  const fmt = n => typeof n === 'number' ? n.toFixed(2) : '0.00';

  const fmtT = iso =>
    iso
      ? new Date(iso).toLocaleString('ru-RU', {
          timeZone: 'Europe/Riga',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const load = useCallback(async () => {
    if (!token) return;

    try {
      const [s, o, m, rv] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: hdrs }).then(r => r.json()),
        fetch(`${API}/api/admin/orders`, { headers: hdrs }).then(r => r.json()),
        fetch(`${API}/api/admin/menu`, { headers: hdrs }).then(r => r.json()),
        fetch(`${API}/api/reviews/all`, { headers: hdrs }).then(r => r.json()).catch(() => []),
      ]);

      setStats(s);
      setOrders(Array.isArray(o) ? o.slice().reverse() : []);
      setMenu(Array.isArray(m) ? m : []);
      setReviews(Array.isArray(rv) ? rv : []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;

    const id = setInterval(() => {
      if (tab === 'orders' || tab === 'stats') load();
    }, 30000);

    return () => clearInterval(id);
  }, [token, tab, load]);

  async function login(e) {
    e.preventDefault();

    try {
      const r = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });

      const d = await r.json();

      if (!r.ok) throw new Error(d.error || 'Login error');

      localStorage.setItem('sr_admin', d.token);
      setToken(d.token);
    } catch (ex) {
      setLoginErr(ex.message);
    }
  }

  async function changeStatus(id, status) {
    await fetch(`${API}/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: hdrs,
      body: JSON.stringify({ status }),
    });

    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
  }

  async function deleteOrder(id) {
    if (!window.confirm(tr('confirmDelete'))) return;

    await fetch(`${API}/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: hdrs,
    });

    setOrders(p => p.filter(o => o.id !== id));
    setSelected(s => {
      const ns = new Set(s);
      ns.delete(id);
      return ns;
    });

    flash("🗑 O'chirildi");
  }

  async function deleteSelected() {
    if (!selected.size || !window.confirm(`${selected.size} — ${tr('confirmDeleteSelected')}`)) return;

    await fetch(`${API}/api/admin/orders`, {
      method: 'DELETE',
      headers: hdrs,
      body: JSON.stringify({ ids: [...selected] }),
    });

    setOrders(p => p.filter(o => !selected.has(o.id)));
    setSelected(new Set());
    flash(`🗑 ${selected.size} ta o'chirildi`);
  }

  async function clearAll() {
    if (!window.confirm(tr('confirmClearAll'))) return;

    await fetch(`${API}/api/admin/orders`, {
      method: 'DELETE',
      headers: hdrs,
      body: JSON.stringify({}),
    });

    setOrders([]);
    setSelected(new Set());
    flash('🗑 Barchasi tozalandi');
  }

  const toggleSel = id => setSelected(s => {
    const ns = new Set(s);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });

  const filtOrders = orders.filter(o =>
    (stF === 'all' || o.status === stF) &&
    (
      !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search)
    )
  );

  const filtMenu = menu.filter(i =>
    (catF === 'all' || i.cat === catF) &&
    (
      !search ||
      i.name?.ru?.toLowerCase().includes(search.toLowerCase()) ||
      i.name?.lv?.toLowerCase().includes(search.toLowerCase()) ||
      i.name?.en?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const toggleAll = () => {
    const vis = filtOrders.map(o => o.id);
    const all = vis.every(id => selected.has(id));

    setSelected(s => {
      const ns = new Set(s);
      vis.forEach(id => all ? ns.delete(id) : ns.add(id));
      return ns;
    });
  };

  async function handleFile(file) {
    if (!file) return;

    setImgLoad(true);

    const reader = new FileReader();

    reader.onload = async ev => {
      try {
        const base64 = ev.target.result;
        const ext = file.name.split('.').pop();

        const r = await fetch(`${API}/api/admin/upload-image`, {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({ base64, ext }),
        });

        const d = await r.json();

        if (d.url) {
          setForm(f => ({ ...f, img: API + d.url }));
          flash('✅ Rasm yuklandi');
        } else {
          flash('❌ ' + (d.error || 'Xato'));
        }
      } catch (e) {
        flash('❌ Upload xato');
      } finally {
        setImgLoad(false);
      }
    };

    reader.readAsDataURL(file);
  }

  async function saveItem(e) {
    e.preventDefault();
    setSaving(true);

    const body = {
      cat: form.cat,
      e: form.e,
      hit: form.hit,
      img: form.img,
      price: parseFloat(form.price) || 0,
      old: form.old ? parseFloat(form.old) : null,
      name: {
        ru: form.name_ru,
        lv: form.name_lv || form.name_ru,
        en: form.name_en || form.name_ru,
      },
      desc: {
        ru: form.desc_ru,
        lv: form.desc_lv || form.desc_ru,
        en: form.desc_en || form.desc_ru,
      },
    };

    try {
      const url = editItem ? `${API}/api/admin/menu/${editItem.id}` : `${API}/api/admin/menu`;

      const r = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: hdrs,
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error('Xato');

      flash(editItem ? '✅ Yangilandi' : "✅ Qo'shildi");
      setEdit(null);
      setForm(emptyForm());
      setTab('menu');
      await load();
    } catch (ex) {
      flash('❌ ' + ex.message);
    } finally {
      setSaving(false);
    }
  }

  async function delItem(id) {
    if (!window.confirm(tr('confirmDelete'))) return;

    await fetch(`${API}/api/admin/menu/${id}`, {
      method: 'DELETE',
      headers: hdrs,
    });

    flash("🗑 O'chirildi");
    await load();
  }

  async function toggleHit(id) {
    await fetch(`${API}/api/admin/menu/${id}/hit`, {
      method: 'PATCH',
      headers: hdrs,
    });

    await load();
  }

  function startEdit(item) {
    setEdit(item);
    setImgMode('url');

    setForm({
      cat: item.cat,
      e: item.e || '🍣',
      hit: !!item.hit,
      img: item.img || '',
      price: item.price,
      old: item.old || '',
      name_ru: item.name?.ru || '',
      name_lv: item.name?.lv || '',
      name_en: item.name?.en || '',
      desc_ru: item.desc?.ru || '',
      desc_lv: item.desc?.lv || '',
      desc_en: item.desc?.en || '',
    });

    setTab('add');
  }

  async function deleteReview(id) {
    if (!window.confirm(tr('confirmDeleteReview'))) return;

    await fetch(`${API}/api/reviews/${id}`, {
      method: 'DELETE',
      headers: hdrs,
    });

    setReviews(p => p.filter(r => r.id !== id));
    flash("🗑 Izoh o'chirildi");
  }

  const newCount = orders.filter(o => o.status === 'new').length;

  if (!token) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 40px', width: '100%', maxWidth: 380, boxShadow: '0 24px 80px rgba(0,0,0,.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>🍒</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e31e24' }}>Cherry Sushi</div>
          <div style={{ fontSize: '.85rem', color: '#9ca3af', marginTop: 6 }}>Admin boshqaruv paneli</div>
        </div>

        <form onSubmit={login}>
          <div style={{ marginBottom: 18 }}>
            <label style={S.lbl}>Parol</label>
            <input
              style={S.inp}
              type="password"
              placeholder="Admin parolini kiriting"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
              autoFocus
            />
          </div>

          {loginErr && (
            <div style={{ background: '#fef2f2', color: '#e31e24', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem', marginBottom: 14 }}>
              {loginErr}
            </div>
          )}

          <button style={{ ...S.btn('#e31e24'), width: '100%', height: 48, fontSize: '.95rem', justifyContent: 'center' }} type="submit">
            Kirish →
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ background: 'linear-gradient(90deg,#c0392b,#e31e24)', padding: '10px 24px', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(227,30,36,.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.8rem' }}>🍒</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>Cherry Sushi</div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.7rem' }}>Admin Panel</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={load} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
            🔄 Yangilash
          </button>

          <a href="/" target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: '.78rem', fontWeight: 700, textDecoration: 'none' }}>
            Sayt ↗
          </a>

          <button onClick={() => { localStorage.removeItem('sr_admin'); setToken(''); }} style={{ background: '#fff', border: 'none', color: '#e31e24', borderRadius: 10, padding: '8px 16px', fontSize: '.78rem', fontWeight: 800, cursor: 'pointer' }}>
            Chiqish
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('❌') ? '#fff5f5' : '#f0fdf4', borderBottom: `3px solid ${msg.startsWith('❌') ? '#e31e24' : '#22c55e'}`, padding: '11px 24px', fontSize: '.88rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto', position: 'sticky', top: 64, zIndex: 90 }}>
        {[
          ['stats', '📊 Statistika'],
          ['orders', `📦 Buyurtmalar${newCount > 0 ? ` (${newCount} 🔴)` : ''}`],
          ['menu', `🍣 Menyu (${menu.length})`],
          ['reviews', `⭐ Baholar (${reviews.length})`],
          ['add', editItem ? '✏️ Tahrirlash' : "➕ Qo'shish"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setTab(k);
              setSrch('');
              if (k !== 'add') {
                setEdit(null);
                setForm(emptyForm());
              }
            }}
            style={{
              padding: '14px 18px',
              fontWeight: 800,
              fontSize: '.82rem',
              background: tab === k ? '#fff5f5' : 'transparent',
              border: 'none',
              borderBottom: `3px solid ${tab === k ? '#e31e24' : 'transparent'}`,
              color: tab === k ? '#e31e24' : '#64748b',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter,sans-serif',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 24px 80px' }}>
        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 Ism yoki #raqam..."
                value={search}
                onChange={e => setSrch(e.target.value)}
                style={{ ...S.inp, flex: 1, minWidth: 200 }}
              />

              <select value={stF} onChange={e => setStF(e.target.value)} style={{ ...S.inp, width: 200, cursor: 'pointer' }}>
                <option value="all">Barchasi ({orders.length})</option>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label} ({orders.filter(o => o.status === k).length})
                  </option>
                ))}
              </select>

              {selected.size > 0 && (
                <button onClick={deleteSelected} style={S.btn('#ef4444')}>
                  🗑 Tanlanganlar ({selected.size})
                </button>
              )}

              <button onClick={clearAll} style={S.btn('#1e293b')}>
                🗑 Hammasini tozala
              </button>
            </div>

            {filtOrders.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                <input
                  type="checkbox"
                  checked={filtOrders.every(o => selected.has(o.id))}
                  onChange={toggleAll}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '.8rem', color: '#64748b' }}>
                  Hammasini tanlash ({filtOrders.length})
                </span>
              </div>
            )}

            {filtOrders.length === 0 && (
              <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                Buyurtmalar topilmadi
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtOrders.map(o => (
                <div key={o.id} style={{ ...S.card, overflow: 'hidden', border: `1.5px solid ${selected.has(o.id) ? '#e31e24' : '#f1f5f9'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleSel(o.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                      onClick={e => e.stopPropagation()}
                    />

                    <span style={{ fontWeight: 900, fontSize: '.92rem', color: '#e31e24' }}>#{o.id}</span>

                    <span style={{ background: STATUS[o.status || 'new']?.color, color: STATUS[o.status || 'new']?.text, borderRadius: 20, padding: '3px 12px', fontSize: '.73rem', fontWeight: 700 }}>
                      {STATUS[o.status || 'new']?.icon} {STATUS[o.status || 'new']?.label}
                    </span>

                    <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>🕐 {fmtT(o.createdAt)}</span>
                    <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>{PAY[o.payMethod] || o.payMethod}</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <select
                        value={o.status || 'new'}
                        onChange={e => changeStatus(o.id, e.target.value)}
                        style={{ height: 36, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: '.76rem', cursor: 'pointer', outline: 'none', background: '#fff', fontWeight: 700 }}
                      >
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.icon} {v.label}
                          </option>
                        ))}
                      </select>

                      <button onClick={() => deleteOrder(o.id)} style={{ ...S.btn('#fef2f2', '#e31e24', '0 10px'), height: 36, fontSize: '1rem' }}>
                        🗑
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8, marginBottom: 12, fontSize: '.85rem' }}>
                      <span>👤 <b>{o.name}</b></span>
                      <a href={`tel:${o.phone}`} style={{ color: '#e31e24', textDecoration: 'none' }}>📞 {o.phone}</a>
                      {o.note && <span style={{ color: '#64748b' }}>💬 {o.note}</span>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {o.items?.map((it, i) => (
                        <span key={i} style={{ background: '#f8fafc', borderRadius: 999, padding: '6px 14px', fontSize: '.77rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>
                          {it.e} {it.name?.lv || it.name?.ru || it.name?.en} ×{it.qty}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#e31e24', display: 'flex', justifyContent: 'space-between' }}>
                      <span>💰 Jami</span>
                      <span>€{fmt(o.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'menu' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 Mahsulot nomi..."
                value={search}
                onChange={e => setSrch(e.target.value)}
                style={{ ...S.inp, flex: 1, minWidth: 180 }}
              />

              <select value={catF} onChange={e => setCatF(e.target.value)} style={{ ...S.inp, width: 160, cursor: 'pointer' }}>
                <option value="all">Barchasi ({menu.length})</option>
                {CATS.map(c => (
                  <option key={c} value={c}>
                    {c} ({menu.filter(i => i.cat === c).length})
                  </option>
                ))}
              </select>

              <button onClick={() => { setTab('add'); setEdit(null); setForm(emptyForm()); }} style={S.btn('#e31e24')}>
                + Qo'shish
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 18 }}>
              {filtMenu.map(item => (
                <div key={item.id} style={{ ...S.card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', paddingTop: '65%', background: '#f8fafc', overflow: 'hidden' }}>
                    {item.img ? (
                      <img
                        src={item.img}
                        alt=""
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem' }}>
                        {item.e}
                      </span>
                    )}

                    {item.hit && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#e31e24', color: '#fff', fontSize: '.55rem', fontWeight: 900, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                        HIT
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '12px 14px', flex: 1 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, marginBottom: 4 }}>
                      {item.name?.lv || item.name?.ru || item.name?.en}
                    </div>
                    <div style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: 6 }}>
                      {item.cat}
                    </div>
                    <div style={{ fontSize: '.95rem', fontWeight: 900, color: '#e31e24' }}>
                      €{item.price?.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4, padding: '8px 12px 12px' }}>
                    <button onClick={() => toggleHit(item.id)} style={{ ...S.btn(item.hit ? '#fef3c7' : '#f1f5f9', item.hit ? '#92400e' : '#475569', '0 10px'), height: 32, fontSize: '.85rem' }}>
                      {item.hit ? '⭐' : '☆'}
                    </button>

                    <button onClick={() => startEdit(item)} style={{ ...S.btn('#eff6ff', '#2563eb'), flex: 1, height: 32, fontSize: '.78rem', justifyContent: 'center' }}>
                      ✏️ Tahrir
                    </button>

                    <button onClick={() => delItem(item.id)} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 32, fontSize: '.85rem' }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            <div style={{ ...S.card, padding: '20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => {
                const cnt = reviews.filter(r => r.rating === star).length;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars n={star} size={18} />
                    <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{cnt}</span>
                  </div>
                );
              })}

              <div style={{ marginLeft: 'auto', fontSize: '.85rem', color: '#64748b' }}>
                Jami: <b>{reviews.length}</b> | O'rtacha: <b>{reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'}</b> ⭐
              </div>
            </div>

            {reviews.length === 0 && (
              <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                Hali izoh yo'q
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => {
                const mi = menu.find(m => m.id === r.menuId);

                return (
                  <div key={r.id} style={{ ...S.card, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>
                      {mi?.e || '🍣'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '.88rem' }}>
                          {mi?.name?.lv || mi?.name?.ru || mi?.name?.en || `#${r.menuId}`}
                        </span>
                        <Stars n={r.rating} size={16} />
                        <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>{fmtT(r.createdAt)}</span>
                        <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>Buyurtma #{r.orderId}</span>
                      </div>

                      {r.comment && (
                        <div style={{ fontSize: '.84rem', color: '#374151', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                          {r.comment}
                        </div>
                      )}
                    </div>

                    <button onClick={() => deleteReview(r.id)} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 32, flexShrink: 0, fontSize: '.85rem' }}>
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'stats' && stats && (
          <div style={{ ...S.card, padding: 24 }}>
            <h2>📊 Statistika</h2>
            <p>Jami buyurtmalar: <b>{stats.totalOrders}</b></p>
            <p>Bugungi buyurtmalar: <b>{stats.todayOrders}</b></p>
            <p>Umumiy daromad: <b>€{fmt(stats.totalRevenue)}</b></p>
          </div>
        )}

        {tab === 'add' && (
          <div style={{ ...S.card, padding: '28px', maxWidth: 860 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 24, color: '#0f172a' }}>
              {editItem ? `✏️ ${editItem.name?.lv || editItem.name?.ru || editItem.name?.en}` : '➕ Yangi mahsulot'}
            </h2>

            <form onSubmit={saveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={S.lbl}>Kategoriya *</label>
                  <select style={{ ...S.inp, cursor: 'pointer' }} value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={S.lbl}>Emoji</label>
                  <select style={{ ...S.inp, cursor: 'pointer' }} value={form.e} onChange={e => setForm(f => ({ ...f, e: e.target.value }))}>
                    {EMOJIS.map(em => <option key={em} value={em}>{em} {em}</option>)}
                  </select>
                </div>

                <div>
                  <label style={S.lbl}>Hit</label>
                  <select style={{ ...S.inp, cursor: 'pointer' }} value={form.hit ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, hit: e.target.value === 'yes' }))}>
                    <option value="no">Yo'q</option>
                    <option value="yes">⭐ Ha</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={S.lbl}>Narx € *</label>
                  <input
                    style={S.inp}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="8.90"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={S.lbl}>Eski narx €</label>
                  <input
                    style={S.inp}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="11.00"
                    value={form.old}
                    onChange={e => setForm(f => ({ ...f, old: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={S.lbl}>Rasm</label>

                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {['url', 'file'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setImgMode(m)}
                      style={{
                        ...S.btn(
                          imgMode === m ? '#e31e24' : '#f1f5f9',
                          imgMode === m ? '#fff' : '#475569'
                        ),
                        height: 34,
                        fontSize: '.78rem',
                      }}
                    >
                      {m === 'url' ? '🔗 URL havolasi' : '📁 Fayl yuklash'}
                    </button>
                  ))}
                </div>

                {imgMode === 'url' ? (
                  <input
                    style={S.inp}
                    type="url"
                    placeholder="https://..."
                    value={form.img}
                    onChange={e => setForm(f => ({ ...f, img: e.target.value }))}
                  />
                ) : (
                  <div
                    style={{
                      border: '2px dashed #e2e8f0',
                      borderRadius: 12,
                      padding: '24px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#e31e24';
                    }}
                    onDragLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      handleFile(e.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])}
                    />

                    {imgLoad ? (
                      <div style={{ color: '#64748b' }}>⏳ Yuklanmoqda...</div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📸</div>
                        <div style={{ fontSize: '.84rem', color: '#64748b' }}>
                          Rasm tanlang yoki bu yerga tashlang
                        </div>
                        <div style={{ fontSize: '.74rem', color: '#94a3b8', marginTop: 4 }}>
                          JPG, PNG, WEBP
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {form.img && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={form.img}
                      alt="Preview"
                      style={{
                        width: 120,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1.5px solid #e2e8f0',
                      }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                    <div style={{ flex: 1, fontSize: '.78rem', color: '#64748b', wordBreak: 'break-all' }}>
                      {form.img}
                    </div>

                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, img: '' }))}
                      style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 32 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.7px', color: '#94a3b8', marginBottom: 14 }}>
                  Nomi
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[
                    ['name_lv', '🇱🇻 Latviešu'],
                    ['name_ru', '🇷🇺 Русский'],
                    ['name_en', '🇬🇧 English'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label style={S.lbl}>{l}</label>
                      <input
                        style={S.inp}
                        placeholder="Nom..."
                        value={form[k]}
                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                        required={k === 'name_lv' || k === 'name_ru'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 800, fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.7px', color: '#94a3b8', marginBottom: 14 }}>
                  Tavsif
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[
                    ['desc_lv', '🇱🇻 Latviešu'],
                    ['desc_ru', '🇷🇺 Русский'],
                    ['desc_en', '🇬🇧 English'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label style={S.lbl}>{l}</label>
                      <input
                        style={S.inp}
                        placeholder="Tavsif..."
                        value={form[k]}
                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ ...S.btn('#e31e24'), flex: 1, height: 46, fontSize: '.92rem', justifyContent: 'center' }} type="submit" disabled={saving}>
                  {saving ? '⏳...' : editItem ? '💾 Saqlash' : "➕ Qo'shish"}
                </button>

                <button type="button" style={{ ...S.btn('#f1f5f9', '#475569'), height: 46, padding: '0 24px' }} onClick={() => { setTab('menu'); setEdit(null); setForm(emptyForm()); }}>
                  Bekor
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
