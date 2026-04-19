import React, { useState, useEffect, useRef } from 'react';
import { useCart }     from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi }     from '../../services/api';
import T from '../../i18n/translations';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query,   setQuery]   = useState('');
  const [menu,    setMenu]    = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoad]    = useState(false);
  const { add }  = useCart();
  const { lang } = useLanguage();
  const t        = T[lang];
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLoad(true);
      menuApi.getAll()
        .then(data => { setMenu(data); setResults(data); })
        .catch(() => {})
        .finally(() => setLoad(false));
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setResults(!q ? menu : menu.filter(i =>
      i.name[lang]?.toLowerCase().includes(q) ||
      i.desc[lang]?.toLowerCase().includes(q) ||
      i.cat?.toLowerCase().includes(q)
    ));
  }, [query, menu, lang]);

  if (!isOpen) return null;

  return (
    <>
      <div className="srch-bg" onClick={onClose} />
      <div className="srch-box">
        <div className="srch-hd">
          <div className="srch-input-wrap">
            <span className="srch-icon">🔍</span>
            <input
              ref={inputRef}
              className="srch-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.search_placeholder || 'Поиск по меню...'}
            />
            {query && (
              <button className="srch-clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          <button className="srch-cancel" onClick={onClose}>
            {lang==='ru'?'Закрыть':lang==='lv'?'Aizvērt':'Close'}
          </button>
        </div>

        <div className="srch-results">
          {loading && (
            <div className="srch-empty">
              <div className="srch-empty-ico">⏳</div>
              <div>{lang==='ru'?'Загрузка...':lang==='lv'?'Ielādē...':'Loading...'}</div>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="srch-empty">
              <div className="srch-empty-ico">🔍</div>
              <div>{lang==='ru'?'Ничего не найдено':lang==='lv'?'Nekas nav atrasts':'Nothing found'}</div>
            </div>
          )}
          {!loading && results.map(item => (
            <div key={item.id} className="srch-item"
              onClick={() => { add(item); onClose(); }}>
              <div className="srch-item-img">
                <span className="srch-item-emoji">{item.e}</span>
                <img src={item.img} alt="" onError={e => e.target.style.display='none'} />
              </div>
              <div className="srch-item-info">
                <div className="srch-item-name">{item.name[lang]}</div>
                <div className="srch-item-desc">{item.desc[lang]}</div>
              </div>
              <div className="srch-item-right">
                <span className="srch-item-price">€{item.price.toFixed(2)}</span>
                <span className="srch-item-add">+</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
