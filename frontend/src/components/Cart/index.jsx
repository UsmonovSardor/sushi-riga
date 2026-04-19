import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
export default function Cart({ onCheckout }) {
  const { cart, change, subtotal, delivery, total, isOpen, setIsOpen } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  return (
    <>
      {isOpen && <div className="cart-bg" onClick={() => setIsOpen(false)} />}
      <div className={'cart-drawer ' + (isOpen ? 'open' : 'closed')}>
        <div className="cart-top">
          <span className="cart-heading">🛒 {t.cart_title}</span>
          <button className="cart-close" onClick={() => setIsOpen(false)}>✕</button>
        </div>
        <div className="cart-list">
          {!cart.length ? (
            <div className="cart-empty">
              <div className="cart-empty-ico">🛒</div>
              <div className="cart-empty-t">{t.empty_t}</div>
              <div className="cart-empty-p">{t.empty_p}</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-img">
                <img src={item.img} alt="" onError={e => e.target.style.display='none'} />
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name[lang]}</div>
                <div className="cart-item-price">€{(item.price * item.qty).toFixed(2)}</div>
              </div>
              <div className="qty">
                <button className="qty-btn" onClick={() => change(item.id,-1)}>−</button>
                <span className="qty-num">{item.qty}</span>
                <button className="qty-btn" onClick={() => change(item.id,+1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-bottom">
            <div className="cart-row"><span>{t.subtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
            <div className="cart-row"><span>{t.delivery}</span><span>{delivery===0?'✅ '+t.free:'€'+delivery.toFixed(2)}</span></div>
            <hr className="cart-divider" />
            <div className="cart-total-row"><span>{t.total}</span><span>€{total.toFixed(2)}</span></div>
            <button className="order-btn" onClick={onCheckout}>{t.checkout}</button>
          </div>
        )}
      </div>
    </>
  );
}