import { useTranslation } from 'react-i18next';
import type { Lang } from '@/lib/types';

/** Current UI language, typed to our supported set. */
export function useLang(): Lang {
  const { i18n } = useTranslation();
  const l = i18n.language as Lang;
  return (['lv', 'ru', 'en'] as const).includes(l) ? l : 'ru';
}
