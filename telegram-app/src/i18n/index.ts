import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '@/lib/types';
import ru from './locales/ru';
import lv from './locales/lv';
import en from './locales/en';

const STORE_KEY = 'cs_tma_lang';

export function detectLang(tgLangCode?: string): Lang {
  const saved = localStorage.getItem(STORE_KEY) as Lang | null;
  if (saved && ['lv', 'ru', 'en'].includes(saved)) return saved;
  const code = (tgLangCode || navigator.language || 'ru').slice(0, 2).toLowerCase();
  if (code === 'lv') return 'lv';
  if (code === 'en') return 'en';
  return 'ru';
}

export function setLang(l: Lang): void {
  localStorage.setItem(STORE_KEY, l);
  i18n.changeLanguage(l);
}

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    lv: { translation: lv },
    en: { translation: en },
  },
  lng: detectLang(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export default i18n;
