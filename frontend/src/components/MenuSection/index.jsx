import React, { useEffect, useState } from 'react';
import ProductCard from '../ProductCard';
import { menuApi, reviewsApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function MenuSection({ category }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const [items,   setItems]   = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [menuData, sumData] = await Promise.all([
          category === 'hit' ? menuApi.getHits() : menuApi.getByCategory(category),
          reviewsApi.getSummary().catch(() => ({})),
        ]);
        setItems(Array.isArray(menuData) ? menuData : []);
        setSummary(sumData || {});
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  if (loading) return <div className="menu-loading"><span className="spinner"/></div>;
  if (!items.length) return null;

  return (
    <section className="menu-section" id={`cat-${category}`}>
      <div className="cards-grid">
        {items.map((item, i) => (
          <ProductCard
            key={item.id}
            item={item}
            delay={i * 40}
            reviewSummary={summary[item.id] || null}
          />
        ))}
      </div>
    </section>
  );
}
