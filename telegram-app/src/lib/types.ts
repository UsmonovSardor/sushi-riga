export type Lang = 'lv' | 'ru' | 'en';

export interface Localized {
  lv?: string;
  ru?: string;
  en?: string;
}

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

export interface CartLine {
  id: string;
  e: string;
  name: Localized;
  price: number;
  qty: number;
  img?: string;
}

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  e: string;
  name: Localized;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  items: OrderItem[];
  total: number;
  payMethod: string;
  lang: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string; by: string }[];
  readyAt: string | null;
  deliveredAt: string | null;
}

export interface ReviewSummary {
  [menuId: string]: { count: number; avg: number };
}

export interface Review {
  id: string;
  menuId: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PendingReview {
  orderId: string;
  menuId: string;
  itemName: string;
  itemEmoji: string;
}

export interface AuthUser {
  id: string;
  name: string;
  surname: string;
  phone: string;
  address?: string;
  role: string;
  points?: number;
}
