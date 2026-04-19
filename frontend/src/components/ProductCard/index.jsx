import React, { useState } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function ProductCard({ item, delay = 0 }) {
  const { add, cart }  = useCart();
  const { lang }       = useLanguage();
  const t              = T[lang];
  const [bump, setBump] = useState(false);
  const sale = item.old ? Math.round((1 - item.price / item.old) * 100) : 0;
  const inCart = cart?.filter(c => c.id === item.id).reduce((s,c)=>s+c.qty,0) || 0;

  const handleAdd = e => {
    e.stopPropagation();
    add(item);
    setBump(true);
    setTimeout(() => setBump(false), 300);
  };

  return (
    <div className="card" style={{ animationDelay: delay + 'ms' }} onClick={handleAdd}>
      <div className="card-img">
        {item.hit  && <span className="badge badge-hit">{t.b_hit}</span>}
        {sale > 0  && <span className="badge badge-sale">-{sale}%</span>}
        {item.new  && <span className="badge badge-new">NEW</span>}
        <span className="card-emoji">{item.e}</span>
        <img src={item.img} alt={item.name[lang]} onError={e=>e.target.style.display='none'}/>
      </div>
      <div className="card-body">
        <div className="card-name">{item.name[lang]}</div>
        <div className="card-desc">{item.desc[lang]}</div>
        <div className="card-foot">
          <div>
            <span className="card-price">€{item.price.toFixed(2)}</span>
            {item.old && <span className="card-old">€{item.old.toFixed(2)}</span>}
          </div>
          {inCart > 0 ? (
            <div className={'card-add card-add--active' + (bump?' bump':'')} onClick={handleAdd}>
              {inCart}
            </div>
          ) : (
            <div className={'card-add' + (bump?' bump':'')} onClick={handleAdd}>+</div>
          )}
        </div>
      </div>
    </div>
  );
}
