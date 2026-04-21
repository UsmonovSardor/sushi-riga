// API URL - works on any domain
const BASE_URL = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
const BASE = `${BASE_URL}/api`;

const json = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
};

const opts = { headers: { 'Cache-Control': 'no-cache' } };

export const menuApi = {
  getAll:        ()    => fetch(`${BASE}/menu`, opts).then(json),
  getByCategory: (cat) => fetch(`${BASE}/menu/category/${cat}`, opts).then(json),
  getHits:       ()    => fetch(`${BASE}/menu/hits`, opts).then(json),
  search:        (q)   => fetch(`${BASE}/menu/search?q=${encodeURIComponent(q)}`, opts).then(json),
};

export const orderApi = {
  create: (data) => fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(json),
};

export default BASE_URL;
