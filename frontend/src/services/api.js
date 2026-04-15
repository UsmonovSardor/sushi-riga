// In production, VITE_API_URL points to the Render backend URL
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

const json = async (res) => {
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};

export const menuApi = {
  getAll:        ()    => fetch(`${BASE}/menu`).then(json),
  getByCategory: (cat) => fetch(`${BASE}/menu/category/${cat}`).then(json),
  getHits:       ()    => fetch(`${BASE}/menu/hits`).then(json),
  search:        (q)   => fetch(`${BASE}/menu/search?q=${encodeURIComponent(q)}`).then(json),
};

export const orderApi = {
  create: (data) => fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(json),
};
