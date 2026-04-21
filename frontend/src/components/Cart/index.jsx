import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Cart({ isOpen, onClose, onCheckout }) {
  const { cart, change, total } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const lbl = (lv, ru, en) => (lang === 'lv' ? lv : lang === 'ru' ? ru : en);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="cart-hd">
          <div className="cart-hd-left">
            <span className="cart-hd-ico">🛒</span>
            <span className="cart-hd-title">
              {lbl('Jūsu grozs', 'Ваша корзина', 'Your Cart')}
            </span>
            {count > 0 && <span className="cart-hd-count">{count}</span>}
          </div>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-ico">🛒</div>
              <div className="cart-empty-title">{t.empty_t}</div>
              <div className="cart-empty-sub">{t.empty_p}</div>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    <span className="cart-item-emoji">{item.e}</span>
                    <img
                      src={item.img}
                      alt=""
                      onError={(e) => {
                        e.target.style.opacity = 0;
                      }}
                    />
                  </div>

                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name[lang]}</div>
                    <div className="cart-item-price">€{item.price.toFixed(2)}</div>
                  </div>

                  <div className="cart-item-qty">
                    <button className="cart-qbtn" onClick={() => change(item.id, -1)}>−</button>
                    <span className="cart-qnum">{item.qty}</span>
                    <button className="cart-qbtn cart-qbtn--p" onClick={() => change(item.id, 1)}>+</button>
                  </div>

                  <div className="cart-item-sum">€{(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-footer-total">
              <span className="cart-footer-lbl">{t.total || lbl('Kopā', 'Итого', 'Total')}</span>
              <span className="cart-footer-val">€{total.toFixed(2)}</span>
            </div>
            <button
              className="cart-order-btn"
              onClick={() => {
                onClose();
                setTimeout(onCheckout, 100);
              }}
            >
              {lbl('Noformēt pasūtījumu', 'Оформить заказ', 'Checkout')}
              <span className="cart-order-btn-arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
