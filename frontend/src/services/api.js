const BASE_URL = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
export const BASE = `${BASE_URL}/api`;
export default BASE_URL;

const req = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type':'application/json', 'Cache-Control':'no-cache', ...(opts.headers||{}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
};

export const menuApi = {
  getAll:        ()    => req(`${BASE}/menu`),
  getByCategory: (cat) => req(`${BASE}/menu/category/${cat}`),
  getHits:       ()    => req(`${BASE}/menu/hits`),
  search:        (q)   => req(`${BASE}/menu/search?q=${encodeURIComponent(q)}`),
};
