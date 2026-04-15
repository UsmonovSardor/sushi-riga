import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';
import ProductCard     from '../ProductCard';
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
  }, [sectionId, lang]);

  if (!items.length) return null;

  return (
    <div id={'sec-' + sectionId} style={{ marginTop: 40 }}>
      <div style={{ marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--dark)' }}>{emoji} {t[titleKey]}</span>
        <span style={{ fontSize:'.8rem', color:'var(--muted)', background:'var(--gray)', padding:'3px 10px', borderRadius:20, fontWeight:600 }}>{items.length}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
        {items.map((item, idx) => <ProductCard key={item.id} item={item} delay={Math.min(idx, 8) * 40} />)}
      </div>
    </div>
  );
}
