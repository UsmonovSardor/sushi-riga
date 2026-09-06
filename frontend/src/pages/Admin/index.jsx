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

const SOURCE = {
  web: { label: 'Sayt', icon: '🌐', color: '#e0f2fe', text: '#0369a1' },
  tma: { label: 'Telegram', icon: '✈️', color: '#e0eaff', text: '#3730a3' },
};

// Customer segment (priority order: VIP → at-risk → regular → new).
const DAY = 86400000;
function segmentOf(c) {
  const daysSince = c.lastOrder ? (Date.now() - new Date(c.lastOrder)) / DAY : Infinity;
  if ((c.totalSpent || 0) >= 100) return 'vip';
  if ((c.ordersCount || 0) >= 1 && daysSince > 30) return 'risk';
  if ((c.ordersCount || 0) >= 3) return 'regular';
  return 'new';
}
const SEGMENT = {
  vip:     { label: '👑 VIP', color: '#fef3c7', text: '#92400e' },
  regular: { label: '🔁 Doimiy', color: '#dcfce7', text: '#15803d' },
  risk:    { label: '⚠️ Yo‘qolayotgan', color: '#fee2e2', text: '#991b1b' },
  new:     { label: '🆕 Yangi', color: '#e0e7ff', text: '#3730a3' },
};

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

const emptyPromo = () => ({
  badge_lv: '', badge_ru: '', badge_en: '',
  title_lv: '', title_ru: '', title_en: '',
  sub_lv: '', sub_ru: '', sub_en: '',
  cta_lv: '', cta_ru: '', cta_en: '',
  img: '', video: '', link: '', theme: 'dark', active: true, sort: 0,
});

const PROMO_LINKS = ['hit', 'cold', 'hot', 'tempura', 'special', 'double', 'sets', 'food', 'salad', 'snacks', 'drinks'];

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

function PromoPreview({ p, pl, small }) {
  const title = pl(p.title_lv, p.title_ru || p.title_lv, p.title_en || p.title_lv);
  const sub = pl(p.sub_lv, p.sub_ru, p.sub_en);
  const cta = pl(p.cta_lv, p.cta_ru || p.cta_lv, p.cta_en || p.cta_lv);
  const badge = pl(p.badge_lv, p.badge_ru || p.badge_lv, p.badge_en || p.badge_lv);
  return (
    <div style={{ position: 'relative', height: small ? 128 : 190, borderRadius: 18, overflow: 'hidden', background: '#1a1416', color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,.18)' }}>
      {p.video
        ? <video src={p.video} muted loop autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : p.img ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${p.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /> : null}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg,rgba(14,10,12,.82),rgba(14,10,12,.42) 42%,transparent 72%)' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: small ? '14px 18px' : '20px 26px', maxWidth: '72%' }}>
        {badge && <span style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(4px)', fontSize: '.6rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>{badge}</span>}
        <div style={{ fontWeight: 900, fontSize: small ? '1.15rem' : '1.6rem', lineHeight: 1.08, letterSpacing: '-.5px', whiteSpace: 'pre-line' }}>{title || 'Sarlavha…'}</div>
        {sub && <div style={{ fontSize: small ? '.78rem' : '.9rem', opacity: .9, marginTop: 4 }}>{sub}</div>}
        {cta && <span style={{ marginTop: 12, alignSelf: 'flex-start', background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: '.78rem', padding: '8px 16px', borderRadius: 11 }}>{cta} →</span>}
      </div>
    </div>
  );
}

function CustomerDetail({ c, orders, topItems, onClose, fmt, fmtT, digits }) {
  const seg = SEGMENT[segmentOf(c)];
  const src = SOURCE[c.channel || 'web'];
  const initial = (c.name || '?').trim().charAt(0).toUpperCase() || '?';
  const wa = digits(c.phone);
  const contacts = [
    { label: '☎️ Qo‘ng‘iroq', href: `tel:${c.phone}`, bg: '#dcfce7', col: '#15803d' },
    wa && { label: '💬 WhatsApp', href: `https://wa.me/${wa}`, bg: '#dcfce7', col: '#128c7e' },
    c.username && { label: '✈️ Telegram', href: `https://t.me/${c.username}`, bg: '#e0eaff', col: '#3730a3' },
  ].filter(Boolean);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640, boxShadow: '0 24px 80px rgba(0,0,0,.35)', margin: 'auto', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem' }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>{c.name} {c.surname}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ background: seg.color, color: seg.text, fontSize: '.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{seg.label}</span>
              <span style={{ background: src.color, color: src.text, fontSize: '.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{src.icon} {src.label}</span>
              <span style={{ background: 'rgba(255,255,255,.22)', fontSize: '.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{c.registered ? '⭐ Ro‘yxatda' : '👤 Mehmon'}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {contacts.map(ct => (
              <a key={ct.label} href={ct.href} target="_blank" rel="noreferrer" style={{ background: ct.bg, color: ct.col, textDecoration: 'none', fontWeight: 800, fontSize: '.82rem', padding: '9px 16px', borderRadius: 10 }}>{ct.label}</a>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 18 }}>
            {[
              ['Buyurtma', c.ordersCount, '#0f172a'],
              ['Jami (LTV)', `€${fmt(c.totalSpent)}`, '#e31e24'],
              ['O‘rtacha', `€${fmt(c.avgOrder)}`, '#64748b'],
              ['Birinchi', c.firstOrder ? new Date(c.firstOrder).toLocaleDateString('ru-RU') : '—', '#64748b'],
              ['Oxirgi', c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('ru-RU') : '—', '#64748b'],
            ].map(([t, v, col]) => (
              <div key={t} style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{t}</div>
                <div style={{ fontWeight: 900, fontSize: '1.02rem', color: col, marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>

          {c.address && <div style={{ fontSize: '.82rem', color: '#475569', marginBottom: 18 }}>📍 {c.address}</div>}

          {topItems.length > 0 && (
            <>
              <div style={{ fontWeight: 800, fontSize: '.72rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Sevimli taomlar</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {topItems.map(it => (
                  <span key={it.name} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 999, padding: '6px 12px', fontSize: '.78rem', fontWeight: 700 }}>{it.e} {it.name} ×{it.qty}</span>
                ))}
              </div>
            </>
          )}

          <div style={{ fontWeight: 800, fontSize: '.72rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>Buyurtmalar tarixi ({orders.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {orders.length === 0 && <div style={{ color: '#94a3b8', fontSize: '.84rem' }}>Buyurtma yo'q</div>}
            {orders.slice().reverse().map(o => (
              <div key={o.id} style={{ border: '1px solid #f1f5f9', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontWeight: 900, color: '#e31e24', fontSize: '.84rem' }}>#{o.id}</span>
                  <span style={{ background: STATUS[o.status || 'new']?.color, color: STATUS[o.status || 'new']?.text, borderRadius: 20, padding: '2px 10px', fontSize: '.68rem', fontWeight: 700 }}>{STATUS[o.status || 'new']?.icon} {STATUS[o.status || 'new']?.label}</span>
                  <span style={{ background: SOURCE[o.source || 'web']?.color, color: SOURCE[o.source || 'web']?.text, borderRadius: 20, padding: '2px 9px', fontSize: '.66rem', fontWeight: 800 }}>{SOURCE[o.source || 'web']?.icon}</span>
                  <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>{fmtT(o.createdAt)}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 900, color: '#0f172a' }}>€{fmt(o.total)}</span>
                </div>
                <div style={{ fontSize: '.75rem', color: '#64748b' }}>{(o.items || []).map(it => `${it.name?.lv || it.name?.ru || it.name?.en} ×${it.qty}`).join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { lang } = useLanguage();

  const [token, setToken] = useState(() => localStorage.getItem('sr_admin') || '');
  const [secret, setSecret] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState(emptyPromo());
  const [promoEditId, setPromoEditId] = useState(null);
  const [promoImgLoad, setPromoImgLoad] = useState(false);
  const promoFileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [search, setSrch] = useState('');
  const [catF, setCatF] = useState('all');
  const [stF, setStF] = useState('all');
  const [srcF, setSrcF] = useState('all');       // order channel filter
  const [custSeg, setCustSeg] = useState('all');  // customer segment filter
  const [custDetail, setCustDetail] = useState(null); // customer-360 modal
  const [editItem, setEdit] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [imgMode, setImgMode] = useState('url');
  const [imgLoad, setImgLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
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

  const load = useCallback(async (manual = false) => {
    if (!token) return;

    try {
      setLoading(true);

      const noCache = { ...hdrs, 'Cache-Control': 'no-cache' };

      const [s, o, m, rv, cu, pr] = await Promise.all([
        fetch(`${API}/api/admin/stats?t=${Date.now()}`, {
          headers: noCache,
          cache: 'no-store',
        }).then(async r => {
          const data = await r.json().catch(() => ({}));
          // An expired/invalid admin token (e.g. a stale one from before the
          // JWT switch) → drop to the login screen instead of showing errors.
          if (r.status === 401) {
            localStorage.removeItem('sr_admin');
            setToken('');
            throw new Error('Session expired — please log in again');
          }
          if (!r.ok) throw new Error(data.error || 'Stats error');
          return data;
        }),

        fetch(`${API}/api/admin/orders?t=${Date.now()}`, {
          headers: noCache,
          cache: 'no-store',
        }).then(r => r.json()),

        fetch(`${API}/api/admin/menu?t=${Date.now()}`, {
          headers: noCache,
          cache: 'no-store',
        }).then(r => r.json()),

        fetch(`${API}/api/reviews/all?t=${Date.now()}`, {
          headers: noCache,
          cache: 'no-store',
        }).then(r => r.json()).catch(() => []),

        fetch(`${API}/api/admin/customers?t=${Date.now()}`, {
          headers: noCache,
          cache: 'no-store',
        }).then(r => r.json()).catch(() => []),

        fetch(`${API}/api/admin/promos?t=${Date.now()}`, {
          headers: noCache,
          cache: 'no-store',
        }).then(r => r.json()).catch(() => []),
      ]);

      setStats(s);
      setOrders(Array.isArray(o) ? o.slice().reverse() : []);
      setMenu(Array.isArray(m) ? m : []);
      setReviews(Array.isArray(rv) ? rv : []);
      setCustomers(Array.isArray(cu) ? cu : []);
      setPromos(Array.isArray(pr) ? pr : []);
      setLastUpdated(new Date());

      if (manual) {
        setMsg('✅ Maʼlumotlar yangilandi');
        setTimeout(() => setMsg(''), 2500);
      }
    } catch (e) {
      console.error(e);
      setMsg('❌ Yangilashda xato: ' + e.message);
      setTimeout(() => setMsg(''), 3500);
    } finally {
      setLoading(false);
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
    setTimeout(() => load(), 300);
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
    setTimeout(() => load(), 300);
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
    setTimeout(() => load(), 300);
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
    setTimeout(() => load(), 300);
  }

  const toggleSel = id => setSelected(s => {
    const ns = new Set(s);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });

  const filtOrders = orders.filter(o =>
    (stF === 'all' || o.status === stF) &&
    (srcF === 'all' || (o.source || 'web') === srcF) &&
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

  const filtCustomers = customers.filter(c => {
    if (custSeg !== 'all' && segmentOf(c) !== custSeg) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.name || ''} ${c.surname || ''}`.toLowerCase().includes(q) ||
      String(c.phone || '').replace(/\s/g, '').includes(search.replace(/\s/g, ''))
    );
  });

  const custTotals = customers.reduce((a, c) => {
    a.registered += c.registered ? 1 : 0;
    a.repeat += c.ordersCount > 1 ? 1 : 0;
    a.revenue += Number(c.totalSpent) || 0;
    return a;
  }, { registered: 0, repeat: 0, revenue: 0 });

  const segCounts = customers.reduce((a, c) => {
    a[segmentOf(c)] = (a[segmentOf(c)] || 0) + 1;
    return a;
  }, {});

  // A customer's own orders (matched by normalized phone) — powers the 360 view.
  const digits = v => String(v || '').replace(/\D/g, '');
  const customerOrders = c => {
    const key = digits(c?.phone);
    if (!key) return [];
    return orders.filter(o => digits(o.customerPhone || o.phone) === key);
  };
  const customerTopItems = c => {
    const m = new Map();
    customerOrders(c).forEach(o => (o.items || []).forEach(it => {
      const k = it.name?.lv || it.name?.ru || it.name?.en || String(it.id);
      const cur = m.get(k) || { name: k, e: it.e || '🍣', qty: 0 };
      cur.qty += Number(it.qty) || 0;
      m.set(k, cur);
    }));
    return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);
  };

  const exportCustomersCSV = () => {
    const head = ['Ism', 'Familiya', 'Telefon', 'Manzil', 'Royxatda', 'Kanal', 'Buyurtma', 'Jami EUR', 'Ortacha EUR', 'Birinchi', 'Oxirgi', 'Segment'];
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtCustomers.map(c => [
      c.name, c.surname, c.phone, c.address, c.registered ? 'ha' : 'yoq',
      c.channel === 'tma' ? 'Telegram' : 'Sayt', c.ordersCount,
      fmt(c.totalSpent), fmt(c.avgOrder),
      c.firstOrder ? new Date(c.firstOrder).toLocaleDateString('ru-RU') : '',
      c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('ru-RU') : '',
      SEGMENT[segmentOf(c)]?.label.replace(/[^\p{L} ]/gu, '').trim() || '',
    ].map(esc).join(','));
    const csv = '﻿' + [head.map(esc).join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `cherry-mijozlar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash(`📥 ${filtCustomers.length} ta mijoz eksport qilindi`);
  };

  // ── Dashboard analytics — all computed client-side from the loaded orders ──
  const valid = orders.filter(o => o.status !== 'cancelled');
  const last7 = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('ru-RU', { weekday: 'short' }), orders: 0, revenue: 0 });
    }
    const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
    valid.forEach(o => {
      const k = new Date(o.createdAt).toISOString().slice(0, 10);
      if (k in idx) { days[idx[k]].orders++; days[idx[k]].revenue += Number(o.total) || 0; }
    });
    return days;
  })();
  const topItems = (() => {
    const m = new Map();
    valid.forEach(o => (o.items || []).forEach(it => {
      const k = it.name?.lv || it.name?.ru || it.name?.en || String(it.id);
      const cur = m.get(k) || { name: k, e: it.e || '🍣', qty: 0, revenue: 0 };
      cur.qty += Number(it.qty) || 0;
      cur.revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
      m.set(k, cur);
    }));
    return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  })();
  const bySrc = valid.reduce((a, o) => {
    const s = o.source === 'tma' ? 'tma' : 'web';
    a[s].orders++; a[s].revenue += Number(o.total) || 0;
    return a;
  }, { web: { orders: 0, revenue: 0 }, tma: { orders: 0, revenue: 0 } });
  const byHour = (() => {
    const h = Array.from({ length: 24 }, () => 0);
    valid.forEach(o => { h[new Date(o.createdAt).getHours()]++; });
    return h;
  })();
  const aov = valid.length ? valid.reduce((s, o) => s + (Number(o.total) || 0), 0) / valid.length : 0;
  const maxDayRev = Math.max(1, ...last7.map(d => d.revenue));
  const maxHour = Math.max(1, ...byHour);

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
          setForm(f => ({ ...f, img: d.url }));
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

  // ── Hero slides / banners ──
  async function handlePromoMedia(file) {
    if (!file) return;
    const isVideo = (file.type || '').startsWith('video');
    if (isVideo && file.size > 24 * 1024 * 1024) { flash('❌ Video juda katta (max ~24MB)'); return; }
    setPromoImgLoad(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const r = await fetch(`${API}/api/admin/upload-image`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({ base64: ev.target.result, ext: file.name.split('.').pop(), resourceType: isVideo ? 'video' : 'image' }),
        });
        const d = await r.json();
        if (d.url) {
          setPromoForm(f => (isVideo ? { ...f, video: d.url } : { ...f, img: d.url }));
          flash(isVideo ? '✅ Video yuklandi' : '✅ Rasm yuklandi');
        } else flash('❌ ' + (d.error || 'Xato'));
      } catch { flash('❌ Yuklashda xato'); }
      finally { setPromoImgLoad(false); }
    };
    reader.readAsDataURL(file);
  }

  function editPromo(p) {
    setPromoEditId(p.id);
    setPromoForm({
      badge_lv: p.badge?.lv || '', badge_ru: p.badge?.ru || '', badge_en: p.badge?.en || '',
      title_lv: p.title?.lv || '', title_ru: p.title?.ru || '', title_en: p.title?.en || '',
      sub_lv: p.subtitle?.lv || '', sub_ru: p.subtitle?.ru || '', sub_en: p.subtitle?.en || '',
      cta_lv: p.cta?.lv || '', cta_ru: p.cta?.ru || '', cta_en: p.cta?.en || '',
      img: p.img || '', video: p.video || '', link: p.link || '', theme: p.theme || 'dark', active: p.active !== false, sort: p.sort || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function savePromo(e) {
    e.preventDefault();
    const pf = promoForm;
    if (!pf.title_lv && !pf.title_ru && !pf.title_en) { flash('❌ Sarlavha kerak'); return; }
    const body = {
      badge: { lv: pf.badge_lv, ru: pf.badge_ru || pf.badge_lv, en: pf.badge_en || pf.badge_lv },
      title: { lv: pf.title_lv, ru: pf.title_ru || pf.title_lv, en: pf.title_en || pf.title_lv },
      subtitle: { lv: pf.sub_lv, ru: pf.sub_ru, en: pf.sub_en },
      cta: { lv: pf.cta_lv, ru: pf.cta_ru || pf.cta_lv, en: pf.cta_en || pf.cta_lv },
      img: pf.img, video: pf.video, link: pf.link, theme: pf.theme, active: pf.active, sort: Number(pf.sort) || 0,
    };
    try {
      const url = promoEditId ? `${API}/api/admin/promos/${promoEditId}` : `${API}/api/admin/promos`;
      const r = await fetch(url, { method: promoEditId ? 'PUT' : 'POST', headers: hdrs, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('Xato');
      flash(promoEditId ? '✅ Yangilandi' : "✅ Qo'shildi");
      setPromoForm(emptyPromo()); setPromoEditId(null);
      await load();
    } catch (ex) { flash('❌ ' + ex.message); }
  }

  async function togglePromoActive(p) {
    await fetch(`${API}/api/admin/promos/${p.id}`, { method: 'PUT', headers: hdrs, body: JSON.stringify({ active: !p.active }) });
    setPromos(list => list.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
    setTimeout(() => load(), 300);
  }

  async function delPromo(id) {
    if (!window.confirm(tr('confirmDelete'))) return;
    await fetch(`${API}/api/admin/promos/${id}`, { method: 'DELETE', headers: hdrs });
    setPromos(list => list.filter(x => x.id !== id));
    if (promoEditId === id) { setPromoForm(emptyPromo()); setPromoEditId(null); }
    flash("🗑 O'chirildi");
  }

  const pl = (lv, ru, en) => (lang === 'lv' ? lv : lang === 'ru' ? ru : en);

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
          <button
            onClick={() => load(true)}
            disabled={loading}
            style={{
              background: loading ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.2)',
              color: '#fff',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: '.78rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ Yangilanmoqda...' : '🔄 Yangilash'}
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
          ['customers', `👥 Mijozlar (${customers.length})`],
          ['menu', `🍣 Menyu (${menu.length})`],
          ['promos', `🎞 Banner (${promos.length})`],
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
        {tab === 'stats' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 }}>
              {[
                ['📦', 'Jami buyurtmalar', stats.totalOrders, '#2563eb'],
                ['🟢', 'Bugungi buyurtmalar', stats.todayOrders, '#16a34a'],
                ['💰', 'Umumiy daromad', `€${fmt(stats.totalRevenue)}`, '#e31e24'],
                ['👥', 'Mijozlar', stats.totalUsers, '#7c3aed'],
              ].map(([icon, title, value, color]) => (
                <div key={title} style={{ ...S.card, padding: 22 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                  <div style={{ color: '#64748b', fontSize: '.82rem', fontWeight: 800 }}>{title}</div>
                  <div style={{ color, fontSize: '1.8rem', fontWeight: 950, marginTop: 6 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, padding: 22, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>📈 Oxirgi 7 kun</h3>
                <span style={{ fontSize: '.8rem', color: '#64748b' }}>O'rtacha chek: <b style={{ color: '#e31e24' }}>€{fmt(aov)}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 170 }}>
                {last7.map(d => (
                  <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#0f172a' }}>€{Math.round(d.revenue)}</div>
                    <div style={{ width: '100%', maxWidth: 46, height: `${Math.round((d.revenue / maxDayRev) * 120)}px`, minHeight: 4, background: 'linear-gradient(180deg,#f87171,#e31e24)', borderRadius: '8px 8px 0 0' }} title={`${d.orders} buyurtma`} />
                    <div style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 700 }}>{d.label}</div>
                    <div style={{ fontSize: '.66rem', color: '#cbd5e1' }}>{d.orders} ta</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ ...S.card, padding: 22 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>📡 Manba bo'yicha</h3>
                {Object.entries(SOURCE).map(([k, v]) => {
                  const s = bySrc[k];
                  const totalO = bySrc.web.orders + bySrc.tma.orders;
                  const pct = totalO ? Math.round((s.orders / totalO) * 100) : 0;
                  return (
                    <div key={k} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem', fontWeight: 800, marginBottom: 6 }}>
                        <span>{v.icon} {v.label}</span>
                        <span>{s.orders} ta · €{fmt(s.revenue)} · {pct}%</span>
                      </div>
                      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: v.text, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...S.card, padding: 22 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>🔥 Top taomlar</h3>
                {topItems.length === 0 && <div style={{ color: '#94a3b8', fontSize: '.85rem' }}>Ma'lumot yo'q</div>}
                {topItems.map((it, i) => (
                  <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize: '.8rem', fontWeight: 900, color: '#cbd5e1', width: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: '1.05rem' }}>{it.e}</span>
                    <span style={{ flex: 1, fontSize: '.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                    <span style={{ fontSize: '.8rem', fontWeight: 800, color: '#e31e24' }}>{it.qty}×</span>
                    <span style={{ fontSize: '.75rem', color: '#94a3b8', minWidth: 52, textAlign: 'right' }}>€{fmt(it.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...S.card, padding: 22, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>🕐 Faol soatlar</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 92 }}>
                {byHour.map((n, h) => (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: `${Math.round((n / maxHour) * 66)}px`, minHeight: n ? 3 : 0, background: n ? '#6366f1' : 'transparent', borderRadius: '3px 3px 0 0' }} title={`${h}:00 — ${n} ta`} />
                    {h % 3 === 0 && <div style={{ fontSize: '.6rem', color: '#94a3b8' }}>{h}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
              <div style={{ ...S.card, padding: 22 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>📊 Statuslar</h3>

                {Object.entries(STATUS).map(([k, v]) => {
                  const count = stats.byStatus?.[k] || 0;
                  const percent = stats.totalOrders ? Math.round((count / stats.totalOrders) * 100) : 0;

                  return (
                    <div key={k} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', fontWeight: 800 }}>
                        <span>{v.icon} {v.label}</span>
                        <span>{count}</span>
                      </div>

                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: v.text, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...S.card, padding: 22 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>💳 To‘lov turlari</h3>

                {Object.entries(stats.byPay || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 800 }}>
                    <span>{PAY[k] || k}</span>
                    <span>{v}</span>
                  </div>
                ))}

                <div style={{ marginTop: 18, padding: 14, background: '#f8fafc', borderRadius: 12, color: '#64748b', fontSize: '.82rem' }}>
                  Oxirgi yangilanish: <b>{lastUpdated ? lastUpdated.toLocaleTimeString('ru-RU') : '—'}</b>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="🔍 Ism yoki #raqam..." value={search} onChange={e => setSrch(e.target.value)} style={{ ...S.inp, flex: 1, minWidth: 200 }} />

              <select value={stF} onChange={e => setStF(e.target.value)} style={{ ...S.inp, width: 180, cursor: 'pointer' }}>
                <option value="all">Barcha status ({orders.length})</option>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label} ({orders.filter(o => o.status === k).length})</option>
                ))}
              </select>

              <select value={srcF} onChange={e => setSrcF(e.target.value)} style={{ ...S.inp, width: 170, cursor: 'pointer' }}>
                <option value="all">Barcha manba</option>
                {Object.entries(SOURCE).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label} ({orders.filter(o => (o.source || 'web') === k).length})</option>
                ))}
              </select>

              {selected.size > 0 && <button onClick={deleteSelected} style={S.btn('#ef4444')}>🗑 Tanlanganlar ({selected.size})</button>}

              <button onClick={clearAll} style={S.btn('#1e293b')}>🗑 Hammasini tozala</button>
            </div>

            {filtOrders.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                <input type="checkbox" checked={filtOrders.every(o => selected.has(o.id))} onChange={toggleAll} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <span style={{ fontSize: '.8rem', color: '#64748b' }}>Hammasini tanlash ({filtOrders.length})</span>
              </div>
            )}

            {filtOrders.length === 0 && (
              <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Buyurtmalar topilmadi</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtOrders.map(o => (
                <div key={o.id} style={{ ...S.card, overflow: 'hidden', border: `1.5px solid ${selected.has(o.id) ? '#e31e24' : '#f1f5f9'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSel(o.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} onClick={e => e.stopPropagation()} />
                    <span style={{ fontWeight: 900, fontSize: '.92rem', color: '#e31e24' }}>#{o.id}</span>
                    <span style={{ background: STATUS[o.status || 'new']?.color, color: STATUS[o.status || 'new']?.text, borderRadius: 20, padding: '3px 12px', fontSize: '.73rem', fontWeight: 700 }}>
                      {STATUS[o.status || 'new']?.icon} {STATUS[o.status || 'new']?.label}
                    </span>
                    <span style={{ background: SOURCE[o.source || 'web']?.color, color: SOURCE[o.source || 'web']?.text, borderRadius: 20, padding: '3px 11px', fontSize: '.7rem', fontWeight: 800 }}>
                      {SOURCE[o.source || 'web']?.icon} {SOURCE[o.source || 'web']?.label}
                    </span>
                    <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>🕐 {fmtT(o.createdAt)}</span>
                    <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>{PAY[o.payMethod] || o.payMethod}</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <select value={o.status || 'new'} onChange={e => changeStatus(o.id, e.target.value)} style={{ height: 36, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: '.76rem', cursor: 'pointer', outline: 'none', background: '#fff', fontWeight: 700 }}>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>

                      <button onClick={() => deleteOrder(o.id)} style={{ ...S.btn('#fef2f2', '#e31e24', '0 10px'), height: 36, fontSize: '1rem' }}>🗑</button>
                    </div>
                  </div>

                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8, marginBottom: 12, fontSize: '.85rem' }}>
                      <span>👤 <b>{o.name}</b></span>
                      <a href={`tel:${o.phone}`} style={{ color: '#e31e24', textDecoration: 'none' }}>📞 {o.phone}</a>
                      {o.address && <span style={{ color: '#64748b' }}>📍 {o.address}</span>}
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

        {tab === 'customers' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 18 }}>
              {[
                ['👥', 'Jami mijozlar', customers.length, '#7c3aed'],
                ['⭐', "Ro'yxatdan o'tgan", custTotals.registered, '#2563eb'],
                ['🔁', 'Takroriy mijoz', custTotals.repeat, '#16a34a'],
                ['💰', 'Jami tushum', `€${fmt(custTotals.revenue)}`, '#e31e24'],
              ].map(([icon, title, value, color]) => (
                <div key={title} style={{ ...S.card, padding: 18 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ color: '#64748b', fontSize: '.76rem', fontWeight: 800 }}>{title}</div>
                  <div style={{ color, fontSize: '1.5rem', fontWeight: 950, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="🔍 Ism yoki telefon..." value={search} onChange={e => setSrch(e.target.value)} style={{ ...S.inp, flex: 1, minWidth: 200 }} />
              <button onClick={exportCustomersCSV} style={S.btn('#16a34a')}>📥 CSV eksport</button>
              <span style={{ fontSize: '.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{filtCustomers.length} ta</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['all', `Hammasi (${customers.length})`], ...Object.entries(SEGMENT).map(([k, v]) => [k, `${v.label} (${segCounts[k] || 0})`])].map(([k, label]) => (
                <button key={k} onClick={() => setCustSeg(k)} style={{
                  padding: '7px 14px', borderRadius: 999, border: '1.5px solid ' + (custSeg === k ? '#e31e24' : '#e2e8f0'),
                  background: custSeg === k ? '#fff5f5' : '#fff', color: custSeg === k ? '#e31e24' : '#475569',
                  fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap',
                }}>{label}</button>
              ))}
            </div>

            {filtCustomers.length === 0 && (
              <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Mijoz topilmadi</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtCustomers.map((c, i) => {
                const initial = (c.name || '?').trim().charAt(0).toUpperCase() || '?';
                const seg = SEGMENT[segmentOf(c)];
                const src = SOURCE[c.channel || 'web'];
                return (
                  <div key={(c.phone || 'x') + i} onClick={() => setCustDetail(c)} style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', color: '#fff', background: c.registered ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,#94a3b8,#64748b)' }}>
                      {initial}
                    </div>

                    <div style={{ minWidth: 160, flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '.92rem' }}>{c.name} {c.surname}</span>
                        <span style={{ background: seg.color, color: seg.text, fontSize: '.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{seg.label}</span>
                        <span style={{ background: src.color, color: src.text, fontSize: '.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>{src.icon}</span>
                      </div>
                      <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} style={{ color: '#e31e24', textDecoration: 'none', fontSize: '.82rem', fontWeight: 700 }}>📞 {c.phone}</a>
                      {c.address && <div style={{ fontSize: '.76rem', color: '#94a3b8', marginTop: 2 }}>📍 {c.address}</div>}
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginLeft: 'auto', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '.64rem', color: '#94a3b8', fontWeight: 700 }}>BUYURTMA</div>
                        <div style={{ fontWeight: 900, fontSize: '1rem' }}>{c.ordersCount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '.64rem', color: '#94a3b8', fontWeight: 700 }}>JAMI</div>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: '#e31e24' }}>€{fmt(c.totalSpent)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '.64rem', color: '#94a3b8', fontWeight: 700 }}>O'RTACHA</div>
                        <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#64748b' }}>€{fmt(c.avgOrder)}</div>
                      </div>
                      <div style={{ minWidth: 90 }}>
                        <div style={{ fontSize: '.64rem', color: '#94a3b8', fontWeight: 700 }}>OXIRGI</div>
                        <div style={{ fontWeight: 700, fontSize: '.76rem', color: '#64748b' }}>{c.lastOrder ? fmtT(c.lastOrder) : '—'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {custDetail && (
          <CustomerDetail
            c={custDetail}
            orders={customerOrders(custDetail)}
            topItems={customerTopItems(custDetail)}
            onClose={() => setCustDetail(null)}
            fmt={fmt}
            fmtT={fmtT}
            digits={digits}
          />
        )}

        {tab === 'menu' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="🔍 Mahsulot nomi..." value={search} onChange={e => setSrch(e.target.value)} style={{ ...S.inp, flex: 1, minWidth: 180 }} />

              <select value={catF} onChange={e => setCatF(e.target.value)} style={{ ...S.inp, width: 160, cursor: 'pointer' }}>
                <option value="all">Barchasi ({menu.length})</option>
                {CATS.map(c => <option key={c} value={c}>{c} ({menu.filter(i => i.cat === c).length})</option>)}
              </select>

              <button onClick={() => { setTab('add'); setEdit(null); setForm(emptyForm()); }} style={S.btn('#e31e24')}>+ Qo'shish</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 18 }}>
              {filtMenu.map(item => (
                <div key={item.id} style={{ ...S.card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', paddingTop: '65%', background: '#f8fafc', overflow: 'hidden' }}>
                    {item.img ? (
                      <img src={item.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem' }}>{item.e}</span>
                    )}

                    {item.hit && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#e31e24', color: '#fff', fontSize: '.55rem', fontWeight: 900, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>HIT</span>
                    )}
                  </div>

                  <div style={{ padding: '12px 14px', flex: 1 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, marginBottom: 4 }}>{item.name?.lv || item.name?.ru || item.name?.en}</div>
                    <div style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: 6 }}>{item.cat}</div>
                    <div style={{ fontSize: '.95rem', fontWeight: 900, color: '#e31e24' }}>€{item.price?.toFixed(2)}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 4, padding: '8px 12px 12px' }}>
                    <button onClick={() => toggleHit(item.id)} style={{ ...S.btn(item.hit ? '#fef3c7' : '#f1f5f9', item.hit ? '#92400e' : '#475569', '0 10px'), height: 32, fontSize: '.85rem' }}>{item.hit ? '⭐' : '☆'}</button>
                    <button onClick={() => startEdit(item)} style={{ ...S.btn('#eff6ff', '#2563eb'), flex: 1, height: 32, fontSize: '.78rem', justifyContent: 'center' }}>✏️ Tahrir</button>
                    <button onClick={() => delItem(item.id)} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 32, fontSize: '.85rem' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'promos' && (
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <div style={{ ...S.card, padding: 24, marginBottom: 22 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 18px', color: '#0f172a' }}>
                {promoEditId ? '✏️ Banner tahrirlash' : '➕ Yangi banner (hero slayd)'}
              </h2>

              <form onSubmit={savePromo}>
                <label style={S.lbl}>Yorliq (badge — kichik yozuv)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[['badge_lv', '🇱🇻'], ['badge_ru', '🇷🇺'], ['badge_en', '🇬🇧']].map(([k, f]) => (
                    <input key={k} style={S.inp} placeholder={`${f} 🔥 Aksiya`} value={promoForm[k]} onChange={e => setPromoForm(p => ({ ...p, [k]: e.target.value }))} />
                  ))}
                </div>

                <label style={S.lbl}>Sarlavha * (Enter bosib 2-qatorga o'ting)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[['title_lv', '🇱🇻'], ['title_ru', '🇷🇺'], ['title_en', '🇬🇧']].map(([k, f]) => (
                    <textarea key={k} rows={2} style={{ ...S.inp, height: 'auto', minHeight: 60, padding: '10px 14px', resize: 'vertical', lineHeight: 1.3 }} placeholder={`${f} Sarlavha`} value={promoForm[k]} onChange={e => setPromoForm(p => ({ ...p, [k]: e.target.value }))} />
                  ))}
                </div>

                <label style={S.lbl}>Matn (ixtiyoriy)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[['sub_lv', '🇱🇻'], ['sub_ru', '🇷🇺'], ['sub_en', '🇬🇧']].map(([k, f]) => (
                    <input key={k} style={S.inp} placeholder={`${f} Matn`} value={promoForm[k]} onChange={e => setPromoForm(p => ({ ...p, [k]: e.target.value }))} />
                  ))}
                </div>

                <label style={S.lbl}>Tugma matni (ixtiyoriy)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[['cta_lv', '🇱🇻'], ['cta_ru', '🇷🇺'], ['cta_en', '🇬🇧']].map(([k, f]) => (
                    <input key={k} style={S.inp} placeholder={`${f} masalan: Buyurtma`} value={promoForm[k]} onChange={e => setPromoForm(p => ({ ...p, [k]: e.target.value }))} />
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={S.lbl}>Tartib (kichik = oldinda)</label>
                    <input type="number" style={S.inp} value={promoForm.sort} onChange={e => setPromoForm(p => ({ ...p, sort: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.lbl}>Holat</label>
                    <select style={{ ...S.inp, cursor: 'pointer' }} value={promoForm.active ? 'yes' : 'no'} onChange={e => setPromoForm(p => ({ ...p, active: e.target.value === 'yes' }))}>
                      <option value="yes">✅ Faol (saytda ko'rinadi)</option>
                      <option value="no">⏸ O'chiq</option>
                    </select>
                  </div>
                </div>

                <label style={S.lbl}>Havola (bosilganda qayerga)</label>
                <input style={S.inp} placeholder="Bo'lim id (sets, hit...) yoki https://..." value={promoForm.link} onChange={e => setPromoForm(p => ({ ...p, link: e.target.value }))} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 16px' }}>
                  {PROMO_LINKS.map(s => (
                    <button key={s} type="button" onClick={() => setPromoForm(p => ({ ...p, link: s }))} style={{ padding: '5px 11px', borderRadius: 999, border: '1px solid ' + (promoForm.link === s ? '#e31e24' : '#e2e8f0'), background: promoForm.link === s ? '#fff5f5' : '#fff', color: promoForm.link === s ? '#e31e24' : '#64748b', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>

                <label style={S.lbl}>Media — rasm yoki video</label>
                <div onClick={() => promoFileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handlePromoMedia(e.dataTransfer.files[0]); }} style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '20px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', marginBottom: 10 }}>
                  <input ref={promoFileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => handlePromoMedia(e.target.files[0])} />
                  {promoImgLoad ? <span style={{ color: '#64748b' }}>⏳ Yuklanmoqda...</span> : <span style={{ color: '#64748b', fontSize: '.84rem' }}>🎬 Video yoki 📸 rasm tanlang / shu yerga tashlang</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={S.lbl}>🎬 Video URL</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input style={{ ...S.inp, flex: 1, minWidth: 0 }} type="url" placeholder="https://...mp4" value={promoForm.video} onChange={e => setPromoForm(p => ({ ...p, video: e.target.value }))} />
                      {promoForm.video && <button type="button" onClick={() => setPromoForm(p => ({ ...p, video: '' }))} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 42 }}>✕</button>}
                    </div>
                  </div>
                  <div>
                    <label style={S.lbl}>📸 Rasm URL (poster)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input style={{ ...S.inp, flex: 1, minWidth: 0 }} type="url" placeholder="https://...jpg" value={promoForm.img} onChange={e => setPromoForm(p => ({ ...p, img: e.target.value }))} />
                      {promoForm.img && <button type="button" onClick={() => setPromoForm(p => ({ ...p, img: '' }))} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 42 }}>✕</button>}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: 16 }}>💡 Video bo'lsa — u fon bo'ladi; rasm — poster (video yuklanguncha) yoki video bo'lmasa fon bo'lib turadi.</div>

                <label style={S.lbl}>Ko'rinishi</label>
                <div style={{ marginBottom: 18 }}>
                  <PromoPreview p={promoForm} pl={pl} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" style={{ ...S.btn('#e31e24'), height: 46, flex: 1, justifyContent: 'center', fontSize: '.92rem' }}>{promoEditId ? '💾 Saqlash' : "➕ Qo'shish"}</button>
                  {promoEditId && <button type="button" onClick={() => { setPromoForm(emptyPromo()); setPromoEditId(null); }} style={{ ...S.btn('#f1f5f9', '#475569'), height: 46, padding: '0 22px' }}>Bekor</button>}
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {promos.length === 0 && <div style={{ ...S.card, padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Hali promo yo'q — birinchisini qo'shing 👆</div>}
              {promos.map(p => (
                <div key={p.id} style={{ ...S.card, padding: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', opacity: p.active ? 1 : .55 }}>
                  <div style={{ flex: '1 1 320px', minWidth: 240 }}>
                    <PromoPreview
                      p={{ badge_lv: p.badge?.lv, badge_ru: p.badge?.ru, badge_en: p.badge?.en, title_lv: p.title?.lv, title_ru: p.title?.ru, title_en: p.title?.en, sub_lv: p.subtitle?.lv, sub_ru: p.subtitle?.ru, sub_en: p.subtitle?.en, cta_lv: p.cta?.lv, cta_ru: p.cta?.ru, cta_en: p.cta?.en, img: p.img, video: p.video }}
                      pl={pl}
                      small
                    />
                    {p.link && <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: 6 }}>🔗 {p.link}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: p.active ? '#dcfce7' : '#f1f5f9', color: p.active ? '#15803d' : '#64748b' }}>{p.active ? '✅ Faol' : "⏸ O'chiq"}</span>
                    <button onClick={() => togglePromoActive(p)} style={{ ...S.btn('#f1f5f9', '#475569', '0 12px'), height: 34, fontSize: '.82rem' }}>{p.active ? '⏸' : '▶️'}</button>
                    <button onClick={() => editPromo(p)} style={{ ...S.btn('#eff6ff', '#2563eb', '0 12px'), height: 34, fontSize: '.82rem' }}>✏️</button>
                    <button onClick={() => delPromo(p.id)} style={{ ...S.btn('#fff5f5', '#e31e24', '0 12px'), height: 34, fontSize: '.82rem' }}>🗑</button>
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
              <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Hali izoh yo'q</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => {
                const mi = menu.find(m => m.id === r.menuId);

                return (
                  <div key={r.id} style={{ ...S.card, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>{mi?.e || '🍣'}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '.88rem' }}>{mi?.name?.lv || mi?.name?.ru || mi?.name?.en || `#${r.menuId}`}</span>
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

                    <button onClick={() => deleteReview(r.id)} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 32, flexShrink: 0, fontSize: '.85rem' }}>🗑</button>
                  </div>
                );
              })}
            </div>
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
                  <input style={S.inp} type="number" step="0.1" min="0" placeholder="8.90" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                </div>

                <div>
                  <label style={S.lbl}>Eski narx €</label>
                  <input style={S.inp} type="number" step="0.1" min="0" placeholder="11.00" value={form.old} onChange={e => setForm(f => ({ ...f, old: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={S.lbl}>Rasm</label>

                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {['url', 'file'].map(m => (
                    <button key={m} type="button" onClick={() => setImgMode(m)} style={{ ...S.btn(imgMode === m ? '#e31e24' : '#f1f5f9', imgMode === m ? '#fff' : '#475569'), height: 34, fontSize: '.78rem' }}>
                      {m === 'url' ? '🔗 URL havolasi' : '📁 Fayl yuklash'}
                    </button>
                  ))}
                </div>

                {imgMode === 'url' ? (
                  <input style={S.inp} type="url" placeholder="https://..." value={form.img} onChange={e => setForm(f => ({ ...f, img: e.target.value }))} />
                ) : (
                  <div
                    style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '24px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e31e24'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e2e8f0'; handleFile(e.dataTransfer.files[0]); }}
                  >
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                    {imgLoad ? (
                      <div style={{ color: '#64748b' }}>⏳ Yuklanmoqda...</div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📸</div>
                        <div style={{ fontSize: '.84rem', color: '#64748b' }}>Rasm tanlang yoki bu yerga tashlang</div>
                        <div style={{ fontSize: '.74rem', color: '#94a3b8', marginTop: 4 }}>JPG, PNG, WEBP</div>
                      </div>
                    )}
                  </div>
                )}

                {form.img && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={form.img} alt="Preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #e2e8f0' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <div style={{ flex: 1, fontSize: '.78rem', color: '#64748b', wordBreak: 'break-all' }}>{form.img}</div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, img: '' }))} style={{ ...S.btn('#fff5f5', '#e31e24', '0 10px'), height: 32 }}>✕</button>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.7px', color: '#94a3b8', marginBottom: 14 }}>Nomi</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[
                    ['name_lv', '🇱🇻 Latviešu'],
                    ['name_ru', '🇷🇺 Русский'],
                    ['name_en', '🇬🇧 English'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label style={S.lbl}>{l}</label>
                      <input style={S.inp} placeholder="Nom..." value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={k === 'name_lv' || k === 'name_ru'} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 800, fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.7px', color: '#94a3b8', marginBottom: 14 }}>Tavsif</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[
                    ['desc_lv', '🇱🇻 Latviešu'],
                    ['desc_ru', '🇷🇺 Русский'],
                    ['desc_en', '🇬🇧 English'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label style={S.lbl}>{l}</label>
                      <input style={S.inp} placeholder="Tavsif..." value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
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
