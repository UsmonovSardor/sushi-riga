import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine, MenuItem } from '@/lib/types';

interface CartState {
  lines: CartLine[];
  add: (item: MenuItem) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  qtyOf: (id: string) => number;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (item) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === item.id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.id === item.id ? { ...l, qty: l.qty + 1 } : l
              ),
            };
          }
          const line: CartLine = {
            id: item.id,
            e: item.e || '🍣',
            name: item.name,
            price: item.price,
            qty: 1,
            img: item.img,
          };
          return { lines: [...s.lines, line] };
        }),

      inc: (id) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)),
        })),

      dec: (id) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
            .filter((l) => l.qty > 0),
        })),

      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),

      clear: () => set({ lines: [] }),

      qtyOf: (id) => get().lines.find((l) => l.id === id)?.qty ?? 0,

      count: () => get().lines.reduce((n, l) => n + l.qty, 0),

      subtotal: () => get().lines.reduce((s, l) => s + l.price * l.qty, 0),
    }),
    { name: 'cs_tma_cart' }
  )
);
