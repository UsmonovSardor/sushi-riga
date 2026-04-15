import React, { createContext, useContext, useState, useCallback } from 'react';
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [cart, setCart]     = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex
        ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const change = useCallback((id, delta) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
          .filter(i => i.qty > 0)
    );
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery  = subtotal >= 25 ? 0 : subtotal > 0 ? 2 : 0;
  const total     = subtotal + delivery;
  const count     = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ cart, add, change, clear, subtotal, delivery, total, count, isOpen, setIsOpen }}>
      {children}
    </Ctx.Provider>
  );
}
