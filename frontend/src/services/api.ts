import type {
  MenuItem, Promo, Order, Review, ReviewSummary, PendingReview,
  CreateOrderInput, CreateOrderResult, AddReviewInput,
} from '../types';

const BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  'https://sushi-riga-api-production-7b54.up.railway.app';

export const BASE = `${BASE_URL}/api`;
export default BASE_URL;

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('sr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
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

  return res.json() as Promise<T>;
}

export const menuApi = {
  getAll: () => req<MenuItem[]>(`${BASE}/menu`),
  getByCategory: (cat: string) => req<MenuItem[]>(`${BASE}/menu/category/${cat}`),
  getHits: () => req<MenuItem[]>(`${BASE}/menu/hits`),
  search: (q: string) => req<MenuItem[]>(`${BASE}/menu/search?q=${encodeURIComponent(q)}`),
};

export const ordersApi = {
  getMine: () => req<Order[]>(`${BASE}/orders/my`, { headers: authHeaders() }),
  create: (body: CreateOrderInput) =>
    req<CreateOrderResult>(`${BASE}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
};

export const promosApi = {
  getActive: () => req<Promo[]>(`${BASE}/promos`),
};

export const reviewsApi = {
  getSummary: () => req<ReviewSummary>(`${BASE}/reviews/summary`),
  getMyPending: () => req<PendingReview[]>(`${BASE}/reviews/my-pending`, { headers: authHeaders() }),
  add: (body: AddReviewInput) =>
    req<Review>(`${BASE}/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  getForItem: (menuId: string) => req<Review[]>(`${BASE}/reviews/menu/${menuId}`),
};
