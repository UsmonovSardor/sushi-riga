import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const Ctx    = createContext(null);
export const useCart = () => useContext(Ctx);
const LS_KEY = 'sr_cart';

export function CartProvider({ children }) {
  const [cart,   setCart]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  const add = useCallback((item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex ? prev.map(i => i.id===item.id ? {...i,qty:i.qty+1} : i)
                : [...prev, {...item, qty:1}];
    });
  }, []);

  const change = useCallback((id, delta) => {
    setCart(prev => prev.map(i => i.id===id ? {...i,qty:i.qty+delta} : i).filter(i=>i.qty>0));
  }, []);

  const clear = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  const total = cart.reduce((s,i) => s + i.price*i.qty, 0);
  const count = cart.reduce((s,i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ cart, add, change, clear, total, count, isOpen, setIsOpen }}>
      {children}
    </Ctx.Provider>
  );
}
