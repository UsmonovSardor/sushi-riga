import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';
import ProductCard     from '../ProductCard';
import T from '../../i18n/translations';

export default function MenuSection({ sectionId, emoji, titleKey, cats }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = T[lang];

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    (async () => {
      try {
        let all = [];
        if (sectionId === 'hit') {
          const res = await menuApi.getHits();
          all = Array.isArray(res) ? res : [];
        } else {
          const safeCats = Array.isArray(cats) ? cats : [];
          const results = await Promise.allSettled(safeCats.map(c => menuApi.getByCategory(c)));
          results.forEach(r => {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
              all = [...all, ...r.value];
            }
          });
        }
        setItems(all);
      } catch(e) {
        console.error('MenuSection error:', sectionId, e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]);

  if (loading) return (
    <section className="sec">
      <div className="sec-h">
        <span className="skeleton" style={{width:120,height:22,display:'block',borderRadius:8}} />
      </div>
      <div className="grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{width:'100%',paddingTop:'68%'}} />
            <div style={{padding:'10px'}}>
              <div className="skeleton" style={{height:14,marginBottom:6,borderRadius:6}} />
              <div className="skeleton" style={{height:11,width:'70%',borderRadius:6}} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  if (!items.length) return null;

  return (
    <section id={'sec-' + sectionId} className="sec">
      <div className="sec-h">
        <span className="sec-name">{emoji} {t[titleKey]}</span>
        <span className="sec-cnt">{items.length}</span>
      </div>
      <div className="grid">
        {items.map((item, i) => (
          <ProductCard key={item.id} item={item} delay={Math.min(i, 8) * 40} />
        ))}
      </div>
    </section>
  );
}
