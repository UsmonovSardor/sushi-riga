import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../ProductCard';
import { menuApi, reviewsApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function MenuSection({ sectionId, emoji, titleKey, cats = [], category, onCount }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const sectionCats = useMemo(() => {
    if (Array.isArray(cats) && cats.length) return cats;
    if (category) return [category];
    return [];
  }, [cats, category]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadMenu = async () => {
      if (sectionId === 'hit' || sectionCats.includes('hit')) return menuApi.getHits();
      const results = await Promise.all(
        sectionCats.map(cat => menuApi.getByCategory(cat).catch(() => []))
      );
      return results.flat();
    };

    Promise.all([
      loadMenu(),
      reviewsApi.getSummary().catch(() => ({})),
    ])
      .then(([data, sum]) => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        setSummary(sum || {});
        onCount?.(arr.length);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sectionId, sectionCats, onCount]);

  if (loading) {
    return (
      <section id={sectionId} className="sec">
        <div className="sec-h">
          <h2 className="sec-name">{emoji} {t[titleKey] || titleKey}</h2>
        </div>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card-skeleton" />)}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section id={sectionId} className="sec">
      <div className="sec-h">
        <h2 className="sec-name">{emoji} {t[titleKey] || titleKey}</h2>
        <span className="sec-cnt">{items.length}</span>
      </div>

      <div className="grid">
        {items.map((item, i) => (
          <ProductCard
            key={item.id}
            item={item}
            delay={i * 40}
            reviewSummary={summary[item.id]}
          />
        ))}
      </div>
    </section>
  );
}
