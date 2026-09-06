import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BASE } from '../services/api';
import { qk } from '../lib/queryClient';

/**
 * Subscribes to the server's order-status SSE stream while the customer is
 * signed in. When the kitchen changes an order's status, the server pushes a
 * `{type:'status'}` event and we invalidate the orders query so the UI updates
 * instantly — no waiting for the 30s poll (which stays on as a fallback).
 *
 * EventSource cannot send an Authorization header, so the JWT rides in the query
 * string; the backend verifies it before opening the stream.
 */
export function useOrderStream(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('sr_token');
    if (!token) return;

    const es = new EventSource(`${BASE}/orders/stream?token=${encodeURIComponent(token)}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === 'status') {
          qc.invalidateQueries({ queryKey: qk.myOrders });
        }
      } catch { /* ignore heartbeat/non-JSON frames */ }
    };

    // On error EventSource auto-reconnects with backoff; nothing to do here.
    es.onerror = () => {};

    return () => es.close();
  }, [enabled, qc]);
}
