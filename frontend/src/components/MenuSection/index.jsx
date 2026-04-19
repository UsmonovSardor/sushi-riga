import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi } from '../../services/api';
import ProductCard from '../ProductCard';
import T from '../../i18n/translations';
export default function MenuSection({ sectionId, emoji, titleKey, cats }) {
  const [items, setItems] = useState([]);
  const { lang } = useLanguage();
  const t = T[lang];
  useEffect(() => {
    const fetchAll = async () => {
      try {
        let all = [];
        if (sectionId === 'hit') {
          all = await menuApi.getHits();
        } else {
          const results = await Promise.all(cats.map(c => menuApi.getByCategory(c)));
          results.forEach(r => { if (Array.isArray(r)) all = [...all, ...r]; });
        }
        setItems(all);
      } catch (e) { console.error(e); }
    };
    fetchAll();
  }, [sectionId]);
  if (!items.length) return null;
  return (
    <section id={'sec-' + sectionId} className="sec">
      <div className="sec-head">
        <span className="sec-title">{emoji} {t[titleKey]}</span>
        <span className="sec-count">{items.length}</span>
      </div>
      <div className="grid">
        {items.map((item, idx) => (
          <ProductCard key={item.id} item={item} delay={Math.min(idx, 8) * 40} />
        ))}
      </div>
    </section>
  );
}