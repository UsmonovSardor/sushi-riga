import React from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function Cart({ isOpen, onClose, onCheckout }) {
  const { cart, change, total } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const lbl = (lv,ru,en) => lang==='lv'?lv:lang==='ru'?ru:en;
  const count = cart.reduce((s,i)=>s+i.qty,0);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-modal" role="dialog" aria-modal="true">
        {/* Handle */}
        <div className="cart-handle" />

        {/* Header */}
        <div className="cart-modal-hd">
          <div className="cart-modal-info">
            <span className="cart-modal-title">
              {lbl('Jūsu grozs','Ваша корзина','Your Cart')}
            </span>
            {count>0 && <span className="cart-modal-cnt">{count} {lbl('prece','товар','items')}</span>}
          </div>
          <button className="cart-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Items */}
        <div className="cart-modal-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-ico">🛒</div>
              <div className="cart-empty-t">{t.empty_t}</div>
              <div className="cart-empty-p">{t.empty_p}</div>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map(item => (
                <div key={item.id} className="cart-row">
                  {/* Image */}
                  <div className="cart-row-img">
                    <span className="cart-row-emoji">{item.e}</span>
                    <img src={item.img} alt=""
                      onError={e=>e.target.style.opacity=0} />
                  </div>

                  {/* Info */}
                  <div className="cart-row-info">
                    <div className="cart-row-name">{item.name[lang]}</div>
                    <div className="cart-row-price">€{item.price.toFixed(2)}</div>
                  </div>

                  {/* Qty pill */}
                  <div className="cart-row-qty">
                    <button className="cart-qbtn" onClick={()=>change(item.id,-1)}>−</button>
                    <span className="cart-qnum">{item.qty}</span>
                    <button className="cart-qbtn cart-qbtn--p" onClick={()=>change(item.id,+1)}>+</button>
                  </div>

                  {/* Line total */}
                  <div className="cart-row-sum">€{(item.price*item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-modal-ft">
            <div className="cart-modal-total">
              <span>{t.total || lbl('Kopā','Итого','Total')}</span>
              <span className="cart-modal-sum">€{total.toFixed(2)}</span>
            </div>
            <button className="cart-modal-btn"
              onClick={()=>{ onClose(); setTimeout(onCheckout,100); }}>
              {lbl('Noformēt pasūtījumu','Оформить заказ','Checkout')}
              <span className="cart-modal-arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
