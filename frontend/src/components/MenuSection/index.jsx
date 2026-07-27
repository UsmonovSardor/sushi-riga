import React, { useMemo } from 'react';
import ProductCard from '../ProductCard';
import { useMenu } from '../../context/MenuContext';
import { useLanguage } from '../../context/LanguageContext';
import T from '../../i18n/translations';

export default function MenuSection({ sectionId, emoji, titleKey, cats = [], category }) {
  const { lang } = useLanguage();
  const t = T[lang];
  const { items: all, summary, loading } = useMenu();

  const sectionCats = useMemo(() => {
    if (Array.isArray(cats) && cats.length) return cats;
    if (category) return [category];
    return [];
  }, [cats, category]);

  const items = useMemo(() => {
    if (!Array.isArray(all)) return [];
    if (sectionId === 'hit' || sectionCats.includes('hit')) {
      return all.filter(i => i.hit);
    }
    return all.filter(i => sectionCats.includes(i.cat));
  }, [all, sectionId, sectionCats]);

  // 🔄 LOADING STATE
  if (loading) {
    return (
      <section id={`sec-${sectionId}`} className="sec">
        <div className="sec-h">
          <h2 className="sec-name">
            {emoji} {t[titleKey] || titleKey}
          </h2>
        </div>

        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  // ✅ NORMAL STATE
  return (
    <section id={`sec-${sectionId}`} className="sec sec-in">
      <div className="sec-h">
        <h2 className="sec-name">
          <span className="sec-emoji">{emoji}</span> {t[titleKey] || titleKey}
        </h2>

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
