import React, { useEffect, useState } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

 export default function CartBar({ onOpen, onCheckout, hidden = false }) {
  const { cart, total } = useCart();
  const { lang }        = useLanguage();
  const t               = T[lang];
  const [show, setShow] = useState(false);
  const [bump, setBump] = useState(false);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    if (count > 0) {
      setShow(true);
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [count]);

  if (!show || hidden) return null;

  return (
    <div className={'cartbar' + (bump ? ' cartbar--bump' : '')}>
      <button className="cartbar-btn" onClick={onOpen} aria-label="Open cart">
        <div className="cartbar-left">
          <span className="cartbar-badge">{count}</span>
          <span className="cartbar-lbl">
            {t.cart_title || (lang==='lv'?'Grozs':lang==='en'?'Cart':'Корзина')}
          </span>
        </div>
        <div className="cartbar-right">
          <span className="cartbar-total">€{total.toFixed(2)}</span>
          <span className="cartbar-chevron">→</span>
        </div>
      </button>
    </div>
  );
}
