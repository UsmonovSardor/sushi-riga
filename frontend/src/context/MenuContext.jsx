import React, { createContext, useContext, useEffect, useState } from 'react';
import { menuApi, reviewsApi } from '../services/api';

const Ctx = createContext({ items: [], summary: {}, loading: true });
export const useMenu = () => useContext(Ctx);

// Loads the full menu + review summary ONCE for the whole app instead of
// every section/search refetching its own slice. This collapses ~25-30 cold
// requests on first paint down to 2.
export function MenuProvider({ children }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      menuApi.getAll().catch(() => []),
      reviewsApi.getSummary().catch(() => ({})),
    ])
      .then(([data, sum]) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
        setSummary(sum && typeof sum === 'object' ? sum : {});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <Ctx.Provider value={{ items, summary, loading }}>
      {children}
    </Ctx.Provider>
  );
}
