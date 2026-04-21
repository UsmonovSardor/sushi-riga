import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';
import ProductCard     from '../ProductCard';
import T from '../../i18n/translations';

export default function MenuSection({ sectionId, emoji, titleKey, cats }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const { lang } = useLanguage();
  const t = T[lang];
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetchData = async () => {
    if (!sectionId) return;
    setLoading(true);
    setError(false);
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
      if (mounted.current) setItems(all);
    } catch(e) {
      console.error('MenuSection error:', sectionId, e.message);
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [sectionId]);

  if (loading) return (
    <section className="sec">
      <div className="sec-h">
        <span className="skeleton" style={{width:120,height:22,display:'inline-block',borderRadius:8}} />
      </div>
      <div className="grid">
        {[...Array(5)].map((_,i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{width:'100%',paddingTop:'70%'}} />
            <div style={{padding:10}}>
              <div className="skeleton" style={{height:14,marginBottom:6,borderRadius:6}} />
              <div className="skeleton" style={{height:11,width:'70%',borderRadius:6}} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  if (error) return (
    <section className="sec">
      <div className="sec-h"><span className="sec-name">{emoji} {t[titleKey]}</span></div>
      <div style={{textAlign:'center',padding:'20px',color:'var(--muted)'}}>
        <button onClick={fetchData} style={{background:'var(--red)',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:'.84rem',fontWeight:700}}>
          🔄 {lang==='lv'?'Mēģināt vēlreiz':lang==='en'?'Retry':'Повторить'}
        </button>
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
        {items.map((item, i) => (
          <ProductCard key={item.id} item={item} delay={Math.min(i,8)*40} />
        ))}
      </div>
    </section>
  );
}
