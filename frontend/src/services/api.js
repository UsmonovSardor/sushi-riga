const BASE = '/api';
const json = res => res.ok ? res.json() : Promise.reject(res.statusText);

export const menuApi = {
  getAll:        ()    => fetch(`${BASE}/menu`).then(json),
  getByCategory: (cat) => fetch(`${BASE}/menu/category/${cat}`).then(json),
  getHits:       ()    => fetch(`${BASE}/menu/hits`).then(json),
};

export const orderApi = {
  create: (data) => fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(json),
};
