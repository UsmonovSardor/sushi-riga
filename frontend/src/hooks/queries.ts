import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi, promosApi, ordersApi, reviewsApi } from '../services/api';
import { qk } from '../lib/queryClient';
import type {
  MenuItem, Promo, Order, Review, ReviewSummary, PendingReview,
  CreateOrderInput, CreateOrderResult, AddReviewInput,
} from '../types';

// ── Menu ────────────────────────────────────────────────────────────────────
export function useMenuQuery() {
  return useQuery<MenuItem[]>({
    queryKey: qk.menu,
    queryFn: menuApi.getAll,
  });
}

export function useReviewSummary() {
  return useQuery<ReviewSummary>({
    queryKey: qk.reviewSummary,
    queryFn: reviewsApi.getSummary,
    // Reviews are non-critical: never surface an error state, just fall back to {}.
    retry: 0,
    placeholderData: {},
  });
}

// ── Promos ──────────────────────────────────────────────────────────────────
export function usePromos() {
  return useQuery<Promo[]>({
    queryKey: qk.promos,
    queryFn: promosApi.getActive,
    staleTime: 5 * 60_000,
  });
}

// ── Orders ──────────────────────────────────────────────────────────────────
/**
 * The signed-in customer's orders. When `poll` is on, refetches every 30s so a
 * "ready" status pushed by the kitchen shows up without a manual reload — this
 * replaces the old hand-rolled setInterval + silent catch{}.
 */
export function useMyOrders(opts: { enabled?: boolean; poll?: boolean } = {}) {
  const { enabled = true, poll = false } = opts;
  return useQuery<Order[]>({
    queryKey: qk.myOrders,
    queryFn: ordersApi.getMine,
    enabled,
    staleTime: 10_000,
    refetchInterval: poll ? 30_000 : false,
  });
}

export function useMyPending(enabled = true) {
  return useQuery<PendingReview[]>({
    queryKey: qk.myPending,
    queryFn: reviewsApi.getMyPending,
    enabled,
    retry: 0,
    placeholderData: [],
  });
}

export function useItemReviews(menuId: string | null) {
  return useQuery<Review[]>({
    queryKey: qk.itemReviews(menuId ?? ''),
    queryFn: () => reviewsApi.getForItem(menuId as string),
    enabled: !!menuId,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation<CreateOrderResult, Error, CreateOrderInput>({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myOrders });
    },
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation<Review, Error, AddReviewInput>({
    mutationFn: reviewsApi.add,
    onSuccess: (_review, vars) => {
      qc.invalidateQueries({ queryKey: qk.myPending });
      qc.invalidateQueries({ queryKey: qk.reviewSummary });
      qc.invalidateQueries({ queryKey: qk.itemReviews(vars.menuId) });
    },
  });
}
