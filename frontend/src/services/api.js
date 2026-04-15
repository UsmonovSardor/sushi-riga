const BASE = '/api';

export const menuApi = {
  getAll:       () => fetch(`${BASE}/menu`).then(r => r.json()),
  getByCategory:(cat) => fetch(`${BASE}/menu/category/${cat}`).then(r => r.json()),
  getHits:      () => fetch(`${BASE}/menu/hits`).then(r => r.json()),
};

export const orderApi = {
  create: (data) => fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
};
