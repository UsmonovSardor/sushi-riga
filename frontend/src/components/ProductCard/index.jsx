import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { clImg, clSrcSet } from '../../utils/img';
import { useTilt } from '../../utils/useTilt';
import { useReveal } from '../../utils/reveal';
import T from '../../i18n/translations';

const getText = (value, lang, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.ru || value.lv || fallback;
};

export default function ProductCard({ item, delay = 0, reviewSummary }) {
  const { add, change, cart } = useCart();
  const { lang } = useLanguage();
  const t = T[lang];

  const [bump, setBump] = useState(false);
  const [ripples, setRipples] = useState([]);
  const cardRef = useTilt(9);
  useReveal(cardRef); // scroll-triggered entrance (shares the card ref with tilt)

  const imageUrl = item.img || item.image || item.photo || item.url;
  const name = getText(item.name, lang, 'Product');
  const desc = getText(item.desc, lang, '');

  const sale = item.old ? Math.round((1 - item.price / item.old) * 100) : 0;
  const inCart = cart?.filter(c => c.id === item.id).reduce((s, c) => s + c.qty, 0) || 0;
  const avg = reviewSummary?.avg || 0;
  const count = reviewSummary?.count || 0;

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  };

  // Fly-to-cart: a clone of the product image arcs into the header cart button.
  const flyToCart = () => {
    try {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const img = cardRef.current?.querySelector('.card-img img');
      const target = document.querySelector('.h-cart-btn');
      if (!img || !target || typeof img.animate !== 'function') return;
      const s = img.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      if (!s.width || !tr.width) return;
      const clone = img.cloneNode(true);
      clone.removeAttribute('loading');
      Object.assign(clone.style, {
        position: 'fixed', left: `${s.left}px`, top: `${s.top}px`,
        width: `${s.width}px`, height: `${s.height}px`, objectFit: 'cover',
        borderRadius: '16px', zIndex: 99999, pointerEvents: 'none', margin: 0,
        boxShadow: '0 12px 30px rgba(0,0,0,.28)', willChange: 'transform, opacity',
      });
      document.body.appendChild(clone);
      const dx = (tr.left + tr.width / 2) - (s.left + s.width / 2);
      const dy = (tr.top + tr.height / 2) - (s.top + s.height / 2);
      const anim = clone.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '16px' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 44}px) scale(.6)`, opacity: .95, offset: .6 },
        { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: .2, borderRadius: '50%' },
      ], { duration: 650, easing: 'cubic-bezier(.5,0,.6,1)' });
      anim.onfinish = () => {
        clone.remove();
        target.classList.add('h-cart-pop');
        setTimeout(() => target.classList.remove('h-cart-pop'), 360);
      };
      anim.oncancel = () => clone.remove();
      // Guaranteed cleanup — never leave a clone behind if the tab is backgrounded
      // (animations throttle when hidden, so onfinish may not fire).
      setTimeout(() => clone.remove(), 1200);
    } catch {}
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    addRipple(e);
    flyToCart();
    add(item);
    setBump(true);
    setTimeout(() => setBump(false), 400);
  };

  // Stepper controls (shown once the item is in the cart)
  const handleInc = (e) => {
    e.stopPropagation();
    flyToCart();
    add(item);
  };

  const handleDec = (e) => {
    e.stopPropagation();
    change(item.id, -1); // qty→0 removes the item (handled in CartContext)
  };

  return (
    <div className="card" ref={cardRef} onClick={handleAdd}>
      <span className="card-glare" aria-hidden="true" />
      <div className="card-img">
        {item.hit && <span className="badge badge-hit">{t.b_hit || 'ХИТ'}</span>}
        {sale > 0 && <span className="badge badge-sale">-{sale}%</span>}
        <span className="card-emoji">{item.e}</span>

        <img
          src={clImg(imageUrl, 600)}
          srcSet={clSrcSet(imageUrl, [300, 450, 600])}
          sizes="(max-width:500px) 50vw, (max-width:640px) 33vw, (max-width:900px) 25vw, 20vw"
          alt={name}
          loading="lazy"
          decoding="async"
          className="product-img"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-sushi.png';
          }}
        />
        <span className="card-img-grad" aria-hidden="true" />
      </div>

      <div className="card-body">
        <div className="card-name">{name}</div>

        {avg > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0 4px' }}>
            <span style={{ color: '#f59e0b', fontSize: '.8rem', lineHeight: 1 }}>
              {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
            </span>
            <span style={{ fontSize: '.72rem', color: '#9ca3af', fontWeight: 600 }}>
              {avg} ({count})
            </span>
          </div>
        )}

        <div className="card-desc">{desc}</div>

        <div className="card-foot">
          <div className="card-prices">
            <span className="card-price">€{Number(item.price || 0).toFixed(2)}</span>
            {item.old && <span className="card-old">€{Number(item.old).toFixed(2)}</span>}
          </div>

          {inCart > 0 ? (
            <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
              <button className="qty-btn qty-minus" onClick={handleDec} aria-label="Decrease quantity">−</button>
              <span className="qty-num" aria-live="polite">{inCart}</span>
              <button className="qty-btn qty-plus" onClick={handleInc} aria-label="Increase quantity">+</button>
            </div>
          ) : (
            <button
              className={'card-add' + (bump ? ' bump' : '')}
              onClick={handleAdd}
              aria-label="Add to cart"
            >
              {ripples.map(r => (
                <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
              ))}
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
