import React, { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('sr_admin') || '');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const hdrs = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fmt = n => typeof n === 'number' ? n.toFixed(2) : '0.00';

  // 🔄 LOAD FUNCTION
  const load = useCallback(async (manual = false) => {
    try {
      setLoading(true);

      const r = await fetch(`${API}/api/admin/stats?t=${Date.now()}`, {
        headers: hdrs,
        cache: 'no-store'
      });

      const data = await r.json();

      if (!r.ok) throw new Error(data.error || 'Stats error');

      setStats(data);
      setLastUpdated(new Date());

      if (manual) {
        setMsg('✅ Yangilandi');
        setTimeout(() => setMsg(''), 2000);
      }

    } catch (e) {
      console.error(e);
      setMsg('❌ Xato: ' + e.message);
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  // 🔐 LOGIN
  const [secret, setSecret] = useState('');
  const [err, setErr] = useState('');

  async function login(e) {
    e.preventDefault();

    try {
      const r = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      });

      const d = await r.json();

      if (!r.ok) throw new Error(d.error);

      localStorage.setItem('sr_admin', d.token);
      setToken(d.token);

    } catch (e) {
      setErr(e.message);
    }
  }

  // 🔐 LOGIN SCREEN
  if (!token) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={login}>
          <h2>Admin Login</h2>
          <input
            type="password"
            placeholder="Parol"
            value={secret}
            onChange={e => setSecret(e.target.value)}
          />
          <button>Kirish</button>
          {err && <p style={{ color: 'red' }}>{err}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Inter' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>📊 Admin Panel</h1>

        <button
          onClick={() => load(true)}
          disabled={loading}
          style={{
            background: '#e31e24',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 10,
            cursor: 'pointer'
          }}
        >
          {loading ? '⏳ Yangilanmoqda...' : '🔄 Yangilash'}
        </button>
      </div>

      {msg && <div style={{ marginBottom: 10 }}>{msg}</div>}

      {/* STATS */}
      {stats && (
        <div>

          {/* CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 16,
            marginBottom: 20
          }}>
            <Card title="Jami buyurtmalar" value={stats.totalOrders} color="#2563eb" />
            <Card title="Bugungi buyurtmalar" value={stats.todayOrders} color="#16a34a" />
            <Card title="Daromad" value={`€${fmt(stats.totalRevenue)}`} color="#e31e24" />
            <Card title="Mijozlar" value={stats.totalUsers} color="#7c3aed" />
          </div>

          {/* STATUS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            
            <div style={box}>
              <h3>Statuslar</h3>

              {Object.entries(stats.byStatus || {}).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  {k}: {v}
                </div>
              ))}
            </div>

            <div style={box}>
              <h3>To‘lovlar</h3>

              {Object.entries(stats.byPay || {}).map(([k, v]) => (
                <div key={k}>
                  {k}: {v}
                </div>
              ))}

              <p style={{ marginTop: 10 }}>
                Yangilandi: {lastUpdated?.toLocaleTimeString()}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// 🔥 CARD COMPONENT
function Card({ title, value, color }) {
  return (
    <div style={{
      background: '#fff',
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{ color: '#888' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

const box = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
};
