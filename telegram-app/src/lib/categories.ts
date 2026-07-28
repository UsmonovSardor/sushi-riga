/** Menu category taxonomy — mirrors the website (App.jsx / CategoryNav). */
export interface Category {
  id: string;
  e: string;
  /** DB `cat` values this tab maps to. */
  cats: string[];
  /** i18n key. */
  k: string;
}

export const CATEGORIES: Category[] = [
  { id: 'hit', e: '⭐', cats: ['__hit__'], k: 'cat.hit' },
  { id: 'cold', e: '🍣', cats: ['cold'], k: 'cat.cold' },
  { id: 'hot', e: '🔥', cats: ['hot'], k: 'cat.hot' },
  { id: 'tempura', e: '🍤', cats: ['tempura'], k: 'cat.tempura' },
  { id: 'special', e: '🎎', cats: ['gunkan', 'nigiri', 'sashimi'], k: 'cat.special' },
  { id: 'double', e: '🎯', cats: ['double'], k: 'cat.double' },
  { id: 'sets', e: '🎁', cats: ['sets'], k: 'cat.sets' },
  { id: 'food', e: '🍜', cats: ['food', 'soup', 'wok', 'burger'], k: 'cat.food' },
  { id: 'salad', e: '🥗', cats: ['salad'], k: 'cat.salad' },
  { id: 'snacks', e: '🍟', cats: ['snacks'], k: 'cat.snacks' },
  { id: 'drinks', e: '🥤', cats: ['drinks'], k: 'cat.drinks' },
];
