import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function CartBar({ onOpen, onCheckout, hidden = false }) {
  const { cart, total } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const [show, setShow] = useState(false);
  const [bump, setBump] = useState(false);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    if (count > 0) {
      setShow(true);
      setBump(true);
      const timer = setTimeout(() => setBump(false), 400);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [count]);

  if (!show || hidden) return null;

  return (
    <div className={'cartbar' + (bump ? ' cartbar--bump' : '') + (count > 0 ? ' cartbar--active' : '')}>
      <button className="cartbar-btn" onClick={onCheckout || onOpen} aria-label={t.cart_title}>
        <div className="cartbar-left">
          <span className="cartbar-badge">{count}</span>
          <span className="cartbar-lbl">{t.cart_title}</span>
        </div>
        <div className="cartbar-right">
          <span className="cartbar-total">€{Number(total).toFixed(2)}</span>
          <span className="cartbar-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </button>
    </div>
  );
}
