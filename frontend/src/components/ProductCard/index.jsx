import React from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';
export default function ProductCard({ item, delay = 0 }) {
  const { add } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];
  const sale = item.old ? Math.round((1 - item.price / item.old) * 100) : 0;
  return (
    <div className="card" style={{ animationDelay: delay + 'ms' }} onClick={() => add(item)}>
      <div className="card-img">
        {item.hit && <span className="badge badge-hit">{t.b_hit}</span>}
        {sale > 0 && <span className="badge badge-sale">-{sale}%</span>}
        <span className="card-emoji">{item.e}</span>
        <img src={item.img} alt={item.name[lang]} onError={e => e.target.style.display='none'} />
      </div>
      <div className="card-body">
        <div className="card-name">{item.name[lang]}</div>
        <div className="card-desc">{item.desc[lang]}</div>
        <div className="card-footer">
          <div>
            <span className="card-price">€{item.price.toFixed(2)}</span>
            {item.old && <span className="card-old">€{item.old.toFixed(2)}</span>}
          </div>
          <button className="card-add" onClick={e => { e.stopPropagation(); add(item); }} aria-label="Add">+</button>
        </div>
      </div>
    </div>
  );
}