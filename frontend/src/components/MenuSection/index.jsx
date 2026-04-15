import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';
import ProductCard     from '../ProductCard';
import T from '../../i18n/translations';

const KEY_MAP = { hit:'c_hit', sets:'c_sets', rolls:'c_rolls', sushi:'c_sushi', hot:'c_hot', drinks:'c_drinks' };

export default function MenuSection({ category, emoji }) {
  const [items, setItems] = useState([]);
  const { lang } = useLanguage();
  const t = T[lang];

  useEffect(() => {
    (category === 'hit' ? menuApi.getHits() : menuApi.getByCategory(category))
      .then(setItems).catch(console.error);
  }, [category]);

  return (
    <div id={'sec-' + category} style={{ marginTop: 36 }}>
      <div style={{ marginBottom:18 }}>
        <span style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--dark)' }}>{emoji} {t[KEY_MAP[category]]}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        {items.map((item, i) => <ProductCard key={item.id} item={item} delay={i * 50} />)}
      </div>
    </div>
  );
}
