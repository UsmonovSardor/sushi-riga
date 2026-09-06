'use strict';

/* ============================================================================
   Order-events hub — a tiny in-process pub/sub for Server-Sent Events.

   Keyed by customer id (the JWT `id`, which equals users_data.id and, for
   Telegram users, their telegram id). Each open SSE response registers here;
   adminController.updateOrder publishes a status change and every live
   connection for that customer receives it instantly.

   NOTE: in-memory, so it broadcasts within a single process only. This app
   runs as one Railway instance; if it is ever scaled horizontally, swap this
   for Redis pub/sub (same publish/subscribe surface).
   ========================================================================== */

/** @type {Map<string, Set<import('http').ServerResponse>>} */
const channels = new Map();

function subscribe(userId, res) {
  const key = String(userId);
  let set = channels.get(key);
  if (!set) { set = new Set(); channels.set(key, set); }
  set.add(res);

  return function unsubscribe() {
    const s = channels.get(key);
    if (!s) return;
    s.delete(res);
    if (s.size === 0) channels.delete(key);
  };
}

/** Push a JSON payload to every open connection for `userId`. */
function publish(userId, data) {
  const set = channels.get(String(userId));
  if (!set || set.size === 0) return;
  const frame = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(frame); } catch { /* dead socket; cleaned up on 'close' */ }
  }
}

/** For diagnostics/tests. */
function connectionCount() {
  let n = 0;
  for (const set of channels.values()) n += set.size;
  return n;
}

module.exports = { subscribe, publish, connectionCount };
