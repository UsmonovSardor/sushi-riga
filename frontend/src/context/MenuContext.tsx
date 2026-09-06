import React, { createContext, useContext } from 'react';
import { useMenuQuery, useReviewSummary } from '../hooks/queries';
import type { MenuItem, ReviewSummary } from '../types';

interface MenuCtx {
  items: MenuItem[];
  summary: ReviewSummary;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

const Ctx = createContext<MenuCtx>({
  items: [], summary: {}, loading: true, error: false, reload: () => {},
});
export const useMenu = (): MenuCtx => useContext(Ctx);

/**
 * Loads the full menu + review summary ONCE for the whole app (via TanStack
 * Query's cache) instead of every section/search refetching its own slice.
 * The menu is critical (its error surfaces a retry UI); the review summary is
 * non-critical and falls back to {}. Keeps the previous `useMenu()` shape so
 * consumers are untouched.
 */
export function MenuProvider({ children }: { children: React.ReactNode }) {
  const menu = useMenuQuery();
  const summary = useReviewSummary();

  const value: MenuCtx = {
    items: menu.data ?? [],
    summary: summary.data ?? {},
    loading: menu.isPending,
    error: menu.isError,
    reload: () => { menu.refetch(); summary.refetch(); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
