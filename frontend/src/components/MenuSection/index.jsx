import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';
import ProductCard     from '../ProductCard';
import T from '../../i18n/translations';

export default function MenuSection({ sectionId, emoji, titleKey, cats }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = T[lang];
  const retriesRef = useRef(0);

  const fetchData = async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      let all = [];
      if (sectionId === 'hit') {
        const res = await menuApi.getHits();
        all = Array.isArray(res) ? res : [];
      } else {
        const safeCats = Array.isArray(cats) ? cats : [];
        const results = await Promise.allSettled(safeCats.map(c => menuApi.getByCategory(c)));
        results.forEach(r => {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) all = [...all, ...r.value];
        });
      }
      setItems(all);
    } catch(e) {
      // Auto-retry up to 3 times silently
      if (retriesRef.current < 3) {
        retriesRef.current++;
        setTimeout(fetchData, 2000 * retriesRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { retriesRef.current = 0; fetchData(); }, [sectionId]);

  if (loading) return (
    <section className="sec">
      <div className="sec-h">
        <span className="skeleton" style={{width:130,height:22,display:'inline-block',borderRadius:8}}/>
      </div>
      <div className="grid">
        {[...Array(5)].map((_,i)=>(
          <div key={i} className="card">
            <div className="skeleton" style={{width:'100%',paddingTop:'70%'}}/>
            <div style={{padding:'10px 11px'}}>
              <div className="skeleton" style={{height:13,marginBottom:6,borderRadius:6}}/>
              <div className="skeleton" style={{height:11,width:'65%',borderRadius:6}}/>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  if (!items.length) return null;

  return (
    <section id={'sec-'+sectionId} className="sec">
      <div className="sec-h">
        <span className="sec-name">{emoji} {t[titleKey]}</span>
        <span className="sec-cnt">{items.length}</span>
      </div>
      <div className="grid">
        {items.map((item,i) => (
          <ProductCard key={item.id} item={item} delay={Math.min(i,8)*40}/>
        ))}
      </div>
    </section>
  );
}
