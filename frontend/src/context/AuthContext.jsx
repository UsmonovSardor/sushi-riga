import React, { createContext, useContext, useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sr_token');
    const saved = localStorage.getItem('sr_user');

    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }

    if (!token) {
      setLoad(false);
      return;
    }

    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => {
        localStorage.setItem('sr_user', JSON.stringify(u));
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem('sr_token');
        localStorage.removeItem('sr_user');
        setUser(null);
      })
      .finally(() => setLoad(false));
  }, []);

  // Parse JSON defensively — a cold Railway backend can answer with a non-JSON
  // 502/504 HTML page, and a bare r.json() would throw a cryptic SyntaxError
  // instead of a readable "please try again".
  const safeJson = async (r) => {
    try { return await r.json(); } catch { return {}; }
  };

  const register = async (name, surname, address, phone, lang = 'lv') => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surname, address, phone, lang }),
    });

    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Registration error');

    localStorage.setItem('sr_token', d.token);
    localStorage.setItem('sr_user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  };

  const login = async (name, surname, phone, lang = 'lv') => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surname, phone, lang }),
    });

    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Login error');

    localStorage.setItem('sr_token', d.token);
    localStorage.setItem('sr_user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  };

  const logout = () => {
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
