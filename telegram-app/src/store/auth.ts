import { create } from 'zustand';
import type { AuthUser } from '@/lib/types';
import { authApi, setToken, clearToken } from '@/lib/api';
import { tg, isTelegram, getTgUser } from '@/lib/telegram';

type AuthStatus = 'idle' | 'loading' | 'ready' | 'guest' | 'error';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error?: string;
  init: () => Promise<void>;
  setUser: (u: AuthUser) => void;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'idle',
  user: null,

  init: async () => {
    set({ status: 'loading' });

    // Outside Telegram (e.g. browser dev) → guest mode with a mocked profile
    if (!isTelegram() || !tg) {
      const u = getTgUser();
      set({
        status: 'guest',
        user: {
          id: 'guest',
          name: u?.first_name || 'Guest',
          surname: u?.last_name || '',
          phone: '',
          role: 'user',
          points: 0,
        },
      });
      return;
    }

    try {
      const { token, user } = await authApi.telegram(tg.initData);
      setToken(token);
      set({ status: 'ready', user });
    } catch (e) {
      clearToken();
      const u = getTgUser();
      // Fail-soft: still let the user browse as guest
      set({
        status: 'guest',
        user: {
          id: String(u?.id || 'guest'),
          name: u?.first_name || 'Guest',
          surname: u?.last_name || '',
          phone: '',
          role: 'user',
          points: 0,
        },
        error: (e as Error).message,
      });
    }
  },

  setUser: (u) => set({ user: u }),
}));
