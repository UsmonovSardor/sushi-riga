import React from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Cart({ isOpen, onClose, onCheckout }) {
  const { cart, change, total } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];

  if (!isOpen) return null;

  const lbl = (lv, ru, en) => lang==='lv' ? lv : lang==='ru' ? ru : en;

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-modal">
        {/* Header */}
        <div className="cart-modal-hd">
          <div className="cart-modal-title">
            🛒 {t.cart_title || lbl('Jūsu grozs','Ваша корзина','Your cart')}
          </div>
          <button className="cart-modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Items */}
        <div className="cart-modal-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-ei">🛒</div>
              <div className="cart-et">{t.empty_t}</div>
              <div className="cart-ep">{t.empty_p}</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-row-item">
              <div className="cart-thumb">
                <span className="cart-thumb-emoji">{item.e}</span>
                <img src={item.img} alt="" loading="lazy"
                  onError={e => { e.target.style.opacity=0; }}
                  style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
              </div>
              <div className="cart-info">
                <div className="cart-iname">{item.name[lang]}</div>
                <div className="cart-iprice">€{item.price.toFixed(2)} × {item.qty}</div>
              </div>
              <div className="qty-row">
                <button className="qty-b" onClick={() => change(item.id, -1)}>−</button>
                <span className="qty-n">{item.qty}</span>
                <button className="qty-b" onClick={() => change(item.id, +1)}>+</button>
              </div>
              <div className="cart-item-total">€{(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-modal-ft">
            <div className="cart-total">
              <span>{t.total || lbl('Kopā','Итого','Total')}</span>
              <span className="cart-total-sum">€{total.toFixed(2)}</span>
            </div>
            <button className="cart-checkout-btn" onClick={() => { onClose(); setTimeout(onCheckout, 100); }}>
              {lbl('Pasūtīt →','Оформить заказ →','Checkout →')}
            </button>
            <div className="cart-secure">🔒 {lbl('Droši un ātri','Безопасно и быстро','Safe & fast')}</div>
          </div>
        )}
      </div>
    </>
  );
}
