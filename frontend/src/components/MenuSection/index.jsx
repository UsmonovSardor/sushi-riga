import React, { useEffect, useState } from 'react';
import ProductCard from '../ProductCard';
import { menuApi, reviewsApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function MenuSection({ category, onCount }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const [items,   setItems]   = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      category === 'hit'
        ? menuApi.getHits()
        : menuApi.getByCategory(category),
      reviewsApi.getSummary().catch(() => ({})),
    ]).then(([data, sum]) => {
      if (cancelled) return;
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
      setSummary(sum || {});
      onCount?.(arr.length);
    }).catch(() => {
      if (!cancelled) setItems([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [category, lang]);

  if (loading) return (
    <div className="menu-loading">
      {[1,2,3,4,5,6].map(i => <div key={i} className="card-skeleton"/>)}
    </div>
  );

  if (!items.length) return (
    <div className="menu-empty">
      <span>🍱</span>
      <p>{t.empty_t || 'Mahsulotlar topilmadi'}</p>
    </div>
  );

  return (
    <div className="menu-grid">
      {items.map((item, i) => (
        <ProductCard
          key={item.id}
          item={item}
          delay={i * 40}
          reviewSummary={summary[item.id]}
        />
      ))}
    </div>
  );
}
