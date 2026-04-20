import React from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Cart({ isOpen, onClose, onCheckout }) {
  const { cart, change, total } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];

  const lbl = (lv, ru, en) => lang==='lv'?lv : lang==='ru'?ru : en;

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={onClose} />}
      <aside className={'cart-drawer' + (isOpen ? ' open' : '')}>

        {/* Header */}
        <div className="cart-hd">
          <div className="cart-hd-left">
            <span className="cart-hd-ico">🛒</span>
            <span className="cart-hd-title">
              {t.cart_title || lbl('Jūsu grozs','Ваша корзина','Your cart')}
            </span>
            {cart.length > 0 && (
              <span className="cart-hd-count">{cart.reduce((s,i)=>s+i.qty,0)}</span>
            )}
          </div>
          <button className="cart-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-ico">🛒</div>
              <div className="cart-empty-title">{t.empty_t}</div>
              <div className="cart-empty-sub">{t.empty_p}</div>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  {/* Image */}
                  <div className="cart-item-img">
                    <span className="cart-item-emoji">{item.e}</span>
                    <img
                      src={item.img} alt=""
                      onError={e => e.target.style.opacity=0}
                    />
                  </div>

                  {/* Info */}
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name[lang]}</div>
                    <div className="cart-item-price-row">
                      <span className="cart-item-price">€{item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Qty controls - Yandex Eda style pill */}
                  <div className="cart-item-qty">
                    <button className="cart-qty-btn" onClick={() => change(item.id, -1)}>−</button>
                    <span className="cart-qty-num">{item.qty}</span>
                    <button className="cart-qty-btn cart-qty-btn--plus" onClick={() => change(item.id, +1)}>+</button>
                  </div>

                  {/* Line total */}
                  <div className="cart-item-sum">€{(item.price*item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-footer-total">
              <span className="cart-footer-total-lbl">{t.total || lbl('Kopā','Итого','Total')}</span>
              <span className="cart-footer-total-val">€{total.toFixed(2)}</span>
            </div>

            <button
              className="cart-order-btn"
              onClick={() => { onClose(); setTimeout(onCheckout, 120); }}
            >
              <span>{lbl('Pasūtīt','Оформить заказ','Checkout')}</span>
              <span className="cart-order-btn-arrow">→</span>
            </button>

            <div className="cart-footer-safe">
              🔒 {lbl('Droši un ātri','Безопасно и быстро','Secure & fast')}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
