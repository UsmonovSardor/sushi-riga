import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { menuApi, reviewsApi } from '../services/api';

const Ctx = createContext({ items: [], summary: {}, loading: true, error: false, reload: () => {} });
export const useMenu = () => useContext(Ctx);

// Loads the full menu + review summary ONCE for the whole app instead of
// every section/search refetching its own slice. This collapses ~25-30 cold
// requests on first paint down to 2. A real menu-fetch failure sets `error`
// so the UI can show a retry state instead of a silently blank page.
export function MenuProvider({ children }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    let cancelled = false;

    // Reviews are non-critical (catch → {}); the menu is critical (let it reject).
    Promise.all([
      menuApi.getAll(),
      reviewsApi.getSummary().catch(() => ({})),
    ])
      .then(([data, sum]) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
        setSummary(sum && typeof sum === 'object' ? sum : {});
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);

  return (
    <Ctx.Provider value={{ items, summary, loading, error, reload: load }}>
      {children}
    </Ctx.Provider>
  );
}
