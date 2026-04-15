import React, { useState, useEffect } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery]   = useState('');
  const [menu, setMenu]     = useState([]);
  const [results, setResults] = useState([]);
  const { add }  = useCart();
  const { lang } = useLanguage();

  useEffect(() => { menuApi.getAll().then(setMenu); }, []);
  useEffect(() => {
    const q = query.toLowerCase();
    setResults(q ? menu.filter(i => i.name[lang].toLowerCase().includes(q) || i.desc[lang].toLowerCase().includes(q)) : menu);
  }, [query, menu, lang]);

  if (!isOpen) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1500, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:80 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'90%', maxWidth:600, maxHeight:'70vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:'1.2rem' }}>🔍</span>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск..."
            style={{ flex:1, border:'none', outline:'none', fontSize:'1rem', fontFamily:'inherit' }} />
          <button onClick={onClose} style={{ color:'var(--muted)', fontSize:'1.1rem' }}>✕</button>
        </div>
        <div style={{ overflowY:'auto', padding:12 }}>
          {results.map(item => (
            <div key={item.id} onClick={() => { add(item); onClose(); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderRadius:10, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#f8f8f8'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              <div style={{ width:50, height:50, borderRadius:8, overflow:'hidden', background:'var(--gray)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem' }}>
                <img src={item.img} alt="" onError={e => e.target.style.display='none'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'.9rem' }}>{item.name[lang]}</div>
                <div style={{ fontSize:'.76rem', color:'var(--muted)' }}>{item.desc[lang]}</div>
              </div>
              <span style={{ fontWeight:800, color:'var(--red)' }}>€{item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
