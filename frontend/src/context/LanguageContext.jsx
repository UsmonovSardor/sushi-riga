import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);
export const useLanguage = () => useContext(Ctx);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('sr_lang');
      if (['ru','lv','en'].includes(saved)) return saved;
    } catch {}
    // Default: Latvian (site is in Latvia)
    return 'lv';
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem('sr_lang', l); } catch {}
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
