import React, { useState, useRef } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function ProductCard({ item, delay = 0 }) {
  const { add, cart }   = useCart();
  const { lang }        = useLanguage();
  const t               = T[lang];
  const [bump, setBump] = useState(false);
  const [ripples, setRipples] = useState([]);
  const cardRef = useRef(null);
  const sale = item.old ? Math.round((1 - item.price / item.old) * 100) : 0;
  const inCart = cart?.filter(c => c.id === item.id).reduce((s,c) => s + c.qty, 0) || 0;

  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    addRipple(e);
    add(item);
    setBump(true);
    setTimeout(() => setBump(false), 400);
  };

  return (
    <div
      className="card"
      style={{ animationDelay: delay + 'ms' }}
      ref={cardRef}
      onClick={handleAdd}
    >
      <div className="card-img">
        {item.hit && <span className="badge badge-hit">{t.b_hit || 'ХИТ'}</span>}
        {sale > 0  && <span className="badge badge-sale">-{sale}%</span>}
        <span className="card-emoji">{item.e}</span>
        <img
          src={item.img}
          alt={item.name[lang]}
          loading="lazy"
          onError={e => e.target.style.display = 'none'}
        />
        {/* Shimmer on hover */}
        <div className="card-shimmer" />
      </div>

      <div className="card-body">
        <div className="card-name">{item.name[lang]}</div>
        <div className="card-desc">{item.desc[lang]}</div>
        <div className="card-foot">
          <div className="card-prices">
            <span className="card-price">€{item.price.toFixed(2)}</span>
            {item.old && <span className="card-old">€{item.old.toFixed(2)}</span>}
          </div>
          <button
            className={'card-add' + (inCart > 0 ? ' card-add--active' : '') + (bump ? ' bump' : '')}
            onClick={handleAdd}
            aria-label="Add to cart"
          >
            {ripples.map(r => (
              <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
            ))}
            {inCart > 0 ? inCart : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
