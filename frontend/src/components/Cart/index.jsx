import React from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Cart({ isOpen, onClose, onCheckout }) {
  const { cart, change, clear, total } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];

  return (
    <>
      {isOpen && <div className="cart-bg" onClick={onClose} />}
      <div className={'cart-sheet' + (isOpen ? ' open' : ' closed')} role="dialog" aria-modal="true">
        <div className="cart-hd">
          <span className="cart-hd-title">
            {t.cart_title || (lang==='lv'?'Jūsu grozs':lang==='en'?'Your cart':'Ваша корзина')}
          </span>
          <button className="cart-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-ei">🛒</div>
              <div className="cart-et">{t.empty_t}</div>
              <div className="cart-ep">{t.empty_p}</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-row-item">
              <div className="cart-thumb">
                <img src={item.img} alt="" onError={e => e.target.style.display='none'} />
              </div>
              <div className="cart-info">
                <div className="cart-iname">{item.e} {item.name[lang]}</div>
                <div className="cart-iprice">€{(item.price * item.qty).toFixed(2)}</div>
              </div>
              <div className="qty-row">
                <button className="qty-b" onClick={() => change(item.id, -1)} aria-label="Remove">−</button>
                <span className="qty-n">{item.qty}</span>
                <button className="qty-b" onClick={() => change(item.id, +1)} aria-label="Add">+</button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-ft">
            <div className="cart-total">
              <span>{t.total || 'Kopā'}</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <button className="cart-submit" onClick={() => { onClose(); onCheckout(); }}>
              {t.checkout || (lang==='lv'?'Noformēt pasūtījumu':lang==='en'?'Checkout':'Оформить заказ')} →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
