import React, { useEffect, useState } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function CartBar({ onCheckout }) {
  const { cart, total, setIsOpen } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const [visible, setVisible] = useState(false);
  const [bounce, setBounce]   = useState(false);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    if (cart.length > 0) {
      setVisible(true);
      setBounce(true);
      setTimeout(() => setBounce(false), 400);
    } else {
      setVisible(false);
    }
  }, [cart.length, count]);

  if (!visible) return null;

  return (
    <div className={'cartbar' + (bounce ? ' cartbar--bounce' : '')}>
      <button className="cartbar-btn" onClick={() => setIsOpen(true)}>
        <div className="cartbar-left">
          <span className="cartbar-badge">
            <span className="cartbar-badge-num">{count}</span>
          </span>
          <span className="cartbar-lbl">
            {t.cart_title || (lang === 'lv' ? 'Grozs' : 'Корзина')}
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
