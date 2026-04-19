import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
export default function Cart({ onCheckout }) {
  const { cart, change, subtotal, delivery, total, count, isOpen, setIsOpen } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={() => setIsOpen(false)} />}
      <div className={'cart-drawer ' + (isOpen ? 'open' : 'closed')}>
        <div className="cart-head">
          <span className="cart-title">🛒 {t.cart_title}</span>
          <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>
        <div className="cart-body">
          {!cart.length ? (
            <div className="cart-empty">
              <div className="empty-icon">🛒</div>
              <b>{t.empty_t}</b>
              <p style={{marginTop:6,fontSize:'.82rem',color:'var(--muted)'}}>{t.empty_p}</p>
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
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => change(item.id,-1)}>−</button>
                <span className="qty-num">{item.qty}</span>
                <button className="qty-btn" onClick={() => change(item.id,+1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-foot">
            <div className="cart-row"><span>{t.subtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
            <div className="cart-row"><span>{t.delivery}</span><span>{delivery===0 ? '✅ '+t.free : '€'+delivery.toFixed(2)}</span></div>
            <div className="cart-total"><span>{t.total}</span><span>€{total.toFixed(2)}</span></div>
            <button className="checkout-btn" onClick={onCheckout}>{t.checkout}</button>
          </div>
        )}
      </div>
    </>
  );
}