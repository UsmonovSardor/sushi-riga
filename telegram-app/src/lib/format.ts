import type { Lang, Localized } from './types';

/** Pick a localized string with graceful fallback. */
export function loc(v: Localized | string | undefined, lang: Lang): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.ru || v.lv || v.en || '';
}

/** €8.80 */
export function eur(n: number): string {
  return `€${(Math.round(n * 100) / 100).toFixed(2)}`;
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
