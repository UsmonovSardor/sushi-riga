import type { MenuItem, Order, ReviewSummary, Review, PendingReview, AuthUser } from './types';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'https://sushi-riga-api-production-7b54.up.railway.app';

export const API = `${BASE_URL}/api`;

const TOKEN_KEY = 'cs_tma_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

/* ---------------- Menu ---------------- */
export const menuApi = {
  getAll: () => req<MenuItem[]>(`${API}/menu`),
  getByCategory: (cat: string) => req<MenuItem[]>(`${API}/menu/category/${cat}`),
  getHits: () => req<MenuItem[]>(`${API}/menu/hits`),
  search: (q: string) => req<MenuItem[]>(`${API}/menu/search?q=${encodeURIComponent(q)}`),
};

/* ---------------- Reviews ---------------- */
export const reviewsApi = {
  summary: () => req<ReviewSummary>(`${API}/reviews/summary`),
  forMenu: (menuId: string) => req<Review[]>(`${API}/reviews/menu/${menuId}`),
  myPending: () => req<PendingReview[]>(`${API}/reviews/my-pending`, { headers: authHeaders() }),
  add: (body: { menuId: string; orderId: string; rating: number; comment?: string }) =>
    req<Review>(`${API}/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
};

/* ---------------- Telegram auth ----------------
   POST initData → backend verifies HMAC → returns JWT + user.
   Endpoint added in Phase 0 backend work: /api/tma/auth
------------------------------------------------- */
export const authApi = {
  telegram: (initData: string) =>
    req<{ token: string; user: AuthUser }>(`${API}/tma/auth`, {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),
  me: () => req<AuthUser>(`${API}/auth/me`, { headers: authHeaders() }),
};

/* ---------------- TMA config + payments ---------------- */
export const tmaApi = {
  config: () => req<{ payments: boolean; botUsername: string }>(`${API}/tma/config`),
  invoice: (orderId: string) =>
    req<{ url: string }>(`${API}/tma/pay/invoice`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ orderId }),
    }),
};

/* ---------------- Orders ---------------- */
export interface CreateOrderPayload {
  name: string;
  surname?: string;
  phone: string;
  address?: string;
  note?: string;
  lang: string;
  payMethod?: 'cash' | 'card';
  items: { id: string; qty: number; e?: string; name?: unknown; price?: number }[];
}

export const ordersApi = {
  mine: () => req<Order[]>(`${API}/orders/my`, { headers: authHeaders() }),
  create: (body: CreateOrderPayload) =>
    req<{ success: boolean; orderId: string; order: Order }>(`${API}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
};
