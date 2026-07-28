import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PayMethod = 'cash' | 'card';

interface CheckoutState {
  name: string;
  phone: string;
  address: string;
  note: string;
  payMethod: PayMethod;
  set: (patch: Partial<Omit<CheckoutState, 'set'>>) => void;
}

/** Remembers delivery details between orders. */
export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      name: '',
      phone: '',
      address: '',
      note: '',
      payMethod: 'cash',
      set: (patch) => set(patch),
    }),
    { name: 'cs_tma_checkout' }
  )
);
