import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { promosApi } from '../../services/api';

const DISMISS_KEY = 'sr_promo_dismissed';

export default function PromoBanner({ onOrderNow }) {
  const { lang } = useLanguage();
  const [promos, setPromos] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]')); } catch { return new Set(); }
  });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    promosApi.getActive()
      .then(list => { if (!cancelled) setPromos(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visible = promos.filter(p => !dismissed.has(p.id));

  // Auto-rotate when more than one banner is live.
  useEffect(() => {
    if (visible.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % visible.length), 6000);
    return () => clearInterval(t);
  }, [visible.length]);

  if (!visible.length) return null;

  const p = visible[idx % visible.length];
  const L = obj => obj?.[lang] || obj?.lv || obj?.ru || obj?.en || '';
  const theme = ['red', 'dark', 'gold'].includes(p.theme) ? p.theme : 'red';
  const title = L(p.title);
  const sub = L(p.subtitle);
  const cta = L(p.cta);

  const dismiss = (id) => {
    setDismissed(prev => {
      const next = new Set(prev); next.add(id);
      try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...next].slice(-50))); } catch {}
      return next;
    });
    setIdx(0);
  };

  const go = () => {
    const link = p.link || '';
    if (!link) { onOrderNow?.(); return; }
    if (/^https?:\/\//.test(link)) { window.open(link, '_blank', 'noopener'); return; }
    const el = document.getElementById('sec-' + link);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    else onOrderNow?.();
  };

  return (
    <section className="promo-wrap" aria-label="Promo">
      <div className={`promo-banner promo-banner--${theme}`} onClick={go} role="button" tabIndex={0}>
        {p.img && (
          <div className="promo-banner-img" style={{ backgroundImage: `url(${p.img})` }} aria-hidden="true" />
        )}

        <div className="promo-banner-body">
          {title && <div className="promo-banner-title">{title}</div>}
          {sub && <div className="promo-banner-sub">{sub}</div>}
          {cta && (
            <span className="promo-banner-cta">
              {cta}<span className="promo-banner-arrow">→</span>
            </span>
          )}
        </div>

        {visible.length > 1 && (
          <div className="promo-banner-dots" onClick={e => e.stopPropagation()}>
            {visible.map((_, i) => (
              <button
                key={i}
                className={'promo-banner-dot' + (i === idx % visible.length ? ' on' : '')}
                onClick={() => setIdx(i)}
                aria-label={`Promo ${i + 1}`}
              />
            ))}
          </div>
        )}

        <button
          className="promo-banner-x"
          onClick={e => { e.stopPropagation(); dismiss(p.id); }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </section>
  );
}
