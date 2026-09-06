/* ============================================================================
   Domain types — the shapes the API returns and the app passes around.
   Kept in one place so the data layer, hooks, and components share one source
   of truth. Mirrors the backend's public response mappers.
   ========================================================================== */

export type Lang = 'lv' | 'ru' | 'en';

/** A localized text blob. Any subset of languages may be present. */
export type Localized = Partial<Record<Lang, string>>;

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivered' | 'cancelled';
export type PayMethod = 'cash' | 'card';
export type OrderSource = 'web' | 'tma';

export interface MenuItem {
  id: string;
  cat: string;
  e: string;
  name: Localized;
  desc: Localized;
  price: number;
  old: number | null;
  img: string;
  hit: boolean;
}

/** A line in the cart: menu fields plus a quantity. */
export interface CartItem {
  id: string;
  name: Localized | string;
  price: number;
  e?: string;
  img?: string;
  qty: number;
}

export interface OrderItem {
  id: string;
  e: string;
  name: Localized;
  price: number;
  qty: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  by: string;
}

export interface Order {
  id: string;
  createdAt: string;
  name: string;
  surname: string;
  phone: string;
  items: OrderItem[];
  total: number;
  payMethod: PayMethod;
  source: OrderSource;
  lang: Lang;
  status: OrderStatus;
  statusHistory: StatusEvent[];
  readyAt: string | null;
  deliveredAt: string | null;
}

export interface Promo {
  id: string;
  title: Localized;
  subtitle: Localized;
  badge: Localized;
  cta: Localized;
  img: string;
  video: string;
  link: string;
  theme: string;
  active: boolean;
  sort: number;
  startsAt: string | null;
  endsAt: string | null;
}

export interface Review {
  id: string;
  menuId: string;
  orderId: string;
  userId: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewStat {
  count: number;
  avg: number;
}

/** menuId → aggregate rating stats. */
export type ReviewSummary = Record<string, ReviewStat>;

export interface PendingReview {
  orderId: string;
  menuId: string;
  itemName: string;
  itemEmoji: string;
}

export interface User {
  id: string;
  name: string;
  surname: string;
  address: string;
  phone: string;
  role: string;
}

// ── Request payloads ────────────────────────────────────────────────────────
export interface CreateOrderInput {
  name: string;
  phone: string;
  items: Array<{ id: string; qty: number }>;
  surname?: string;
  note?: string;
  address?: string;
  lang?: Lang;
  payMethod?: PayMethod;
}

export interface CreateOrderResult {
  success: boolean;
  orderId: string;
  order: Order;
}

export interface AddReviewInput {
  menuId: string;
  orderId: string;
  rating: number;
  comment?: string;
}
