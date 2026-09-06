import { QueryClient } from '@tanstack/react-query';

/**
 * One shared client for the app. Defaults tuned for a storefront:
 * - menu/promos change rarely → generous staleTime, served from cache instantly.
 * - one retry (a cold Railway backend often needs a second try) with a short cap.
 * - no refetch-on-focus for the menu-heavy screens (avoids surprise reflows);
 *   hooks that need freshness (orders) opt in via their own options.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Stable, typed query keys — one place to invalidate from. */
export const qk = {
  menu: ['menu'] as const,
  reviewSummary: ['reviews', 'summary'] as const,
  promos: ['promos'] as const,
  myOrders: ['orders', 'mine'] as const,
  myPending: ['reviews', 'pending'] as const,
  itemReviews: (menuId: string) => ['reviews', 'item', menuId] as const,
};
