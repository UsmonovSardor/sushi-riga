/* ============================================================
   Thin, typed wrapper over the official Telegram WebApp global.
   We load telegram-web-app.js in index.html and access
   window.Telegram.WebApp directly — most robust for production
   (no SDK version churn). Falls back gracefully in a browser.
   ============================================================ */

export interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface TgThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  secondary_bg_color?: string;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  colorScheme: 'light' | 'dark';
  themeParams: TgThemeParams;
  version: string;
  platform: string;
  isExpanded: boolean;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (c: string) => void;
  setBackgroundColor: (c: string) => void;
  enableClosingConfirmation: () => void;
  disableVerticalSwipes?: () => void;
  openInvoice: (url: string, cb: (status: InvoiceStatus) => void) => void;
  requestContact?: (cb: (ok: boolean) => void) => void;
  HapticFeedback: {
    impactOccurred: (s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (t: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leave?: boolean) => void;
    hideProgress: () => void;
    setText: (t: string) => void;
    setParams: (p: Partial<{ text: string; color: string; text_color: string; is_active: boolean; is_visible: boolean }>) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  openTelegramLink: (url: string) => void;
  shareToStory?: (media: string, params?: object) => void;
}

export type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export const tg: TgWebApp | undefined =
  typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

/** True when running inside a real Telegram client. */
export const isTelegram = (): boolean => Boolean(tg && tg.initData);

/** Initialise Telegram: mark ready, expand, apply theme + safe areas. */
export function initTelegram(): void {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor('#0E0F13');
    tg.setBackgroundColor('#0E0F13');
    tg.enableClosingConfirmation();

    // Reflect Telegram theme onto our root (default: our premium dark)
    const root = document.documentElement;
    root.setAttribute('data-theme', tg.colorScheme === 'light' ? 'light' : 'dark');

    // Safe-area insets so content clears the Telegram header/close pill
    const top = Math.max(0, (window.innerHeight - tg.viewportStableHeight) > 0 ? 0 : 0);
    root.style.setProperty('--tg-top', `${top}px`);
  } catch {
    /* not in Telegram — ignore */
  }
}

export const haptic = {
  light: () => tg?.HapticFeedback?.impactOccurred('light'),
  medium: () => tg?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => tg?.HapticFeedback?.impactOccurred('heavy'),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
  warning: () => tg?.HapticFeedback?.notificationOccurred('warning'),
  select: () => tg?.HapticFeedback?.selectionChanged(),
};

export function getTgUser(): TgUser | undefined {
  return tg?.initDataUnsafe?.user;
}

export function getStartParam(): string | undefined {
  return tg?.initDataUnsafe?.start_param;
}
