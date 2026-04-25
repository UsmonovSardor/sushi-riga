const BASE_URL = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
export const BASE = `${BASE_URL}/api`;
export default BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem('sr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const req = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.json();
};

export const menuApi = {
  getAll: () => req(`${BASE}/menu`),
  getByCategory: cat => req(`${BASE}/menu/category/${cat}`),
  getHits: () => req(`${BASE}/menu/hits`),
  search: q => req(`${BASE}/menu/search?q=${encodeURIComponent(q)}`),
};

export const ordersApi = {
  getMine: () => req(`${BASE}/orders/my`, { headers: authHeaders() }),
  create: body => req(`${BASE}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }),
};

export const reviewsApi = {
  getSummary: () => req(`${BASE}/reviews/summary`),
  getMyPending: () => req(`${BASE}/reviews/my-pending`, { headers: authHeaders() }),
  add: body => req(`${BASE}/reviews`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }),
  getForItem: menuId => req(`${BASE}/reviews/menu/${menuId}`),
};
