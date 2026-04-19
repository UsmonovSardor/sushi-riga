import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);
export const useLanguage = () => useContext(Ctx);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('sr_lang');
      if (['ru','lv','en'].includes(saved)) return saved;
    } catch {}
    // Auto-detect browser language
    const bl = navigator.language?.slice(0,2).toLowerCase();
    return ['lv','en'].includes(bl) ? bl : 'ru';
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem('sr_lang', l); } catch {}
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
