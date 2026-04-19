import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function CartBar({ onCheckout }) {
  const { cart, total, setIsOpen } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];

  if (!cart.length) return null;

  return (
    <div className="cartbar">
      <button
        className="cartbar-btn"
        onClick={() => setIsOpen(true)}
      >
        <div className="cartbar-left">
          <span className="cartbar-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>
          <span className="cartbar-lbl">{t.cart_title || 'Корзина'}</span>
        </div>
        <span className="cartbar-total">€{total.toFixed(2)}</span>
        <span className="cartbar-arrow">→</span>
      </button>
    </div>
  );
}
