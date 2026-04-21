import React, { createContext, useContext, useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]   = useState(null);
  const [loading, setLoad]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sr_token');
    if (!token) { setLoad(false); return; }
    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { if (u?.id) setUser(u); else localStorage.removeItem('sr_token'); })
      .catch(() => {
        // Keep user logged in on network error - don't clear token
        const saved = localStorage.getItem('sr_user');
        if (saved) try { setUser(JSON.parse(saved)); } catch {}
      })
      .finally(() => setLoad(false));
  }, []);

  const register = async (name, email, password, phone) => {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Registration error');
    localStorage.setItem('sr_token', d.token);
    localStorage.setItem('sr_user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  };

  const login = async (email, password) => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
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
