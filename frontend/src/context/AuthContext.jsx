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
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setUser(u); else localStorage.removeItem('sr_token'); })
      .catch(() => localStorage.removeItem('sr_token'))
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
    setUser(d.user);
    return d.user;
  };

  const logout = () => {
    localStorage.removeItem('sr_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
