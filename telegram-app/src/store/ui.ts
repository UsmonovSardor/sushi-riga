import { create } from 'zustand';
import type { MenuItem } from '@/lib/types';

interface UIState {
  product: MenuItem | null;
  openProduct: (item: MenuItem) => void;
  closeProduct: () => void;
}

/** Transient UI state (modals / sheets). */
export const useUI = create<UIState>((set) => ({
  product: null,
  openProduct: (item) => set({ product: item }),
  closeProduct: () => set({ product: null }),
}));
