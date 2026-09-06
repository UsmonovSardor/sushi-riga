import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Lang, User } from '../types';

const BASE = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (name: string, surname: string, phone: string, lang?: Lang) => Promise<User>;
  register: (name: string, surname: string, address: string, phone: string, lang?: Lang) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);
export const useAuth = (): AuthCtx => {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((u: User) => {
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
  const safeJson = async (r: Response): Promise<any> => {
    try { return await r.json(); } catch { return {}; }
  };

  const register = async (name: string, surname: string, address: string, phone: string, lang: Lang = 'lv'): Promise<User> => {
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

  const login = async (name: string, surname: string, phone: string, lang: Lang = 'lv'): Promise<User> => {
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
