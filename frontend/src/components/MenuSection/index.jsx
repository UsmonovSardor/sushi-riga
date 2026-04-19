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
    (async () => {
      try {
        let all = [];
        if (sectionId==='hit') { all = await menuApi.getHits(); }
        else { const rs=await Promise.all(cats.map(c=>menuApi.getByCategory(c))); rs.forEach(r=>{if(Array.isArray(r))all=[...all,...r];}); }
        setItems(all);
      } catch(e) { console.error(e); }
    })();
  }, [sectionId]);
  if (!items.length) return null;
  return (
    <section id={'sec-'+sectionId} className="sec">
      <div className="sec-h"><span className="sec-name">{emoji} {t[titleKey]}</span><span className="sec-cnt">{items.length}</span></div>
      <div className="grid">{items.map((item,i)=><ProductCard key={item.id} item={item} delay={Math.min(i,8)*35}/>)}</div>
    </section>
  );
}