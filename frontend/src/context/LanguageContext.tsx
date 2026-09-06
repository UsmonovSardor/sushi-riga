import React, { createContext, useContext, useState } from 'react';
import type { Lang } from '../types';

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LanguageCtx | null>(null);
export const useLanguage = (): LanguageCtx => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLanguage must be used within LanguageProvider');
  return v;
};

const isLang = (v: unknown): v is Lang => v === 'ru' || v === 'lv' || v === 'en';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('sr_lang');
      if (isLang(saved)) return saved;
    } catch {}
    // Default: Latvian (site is in Latvia)
    return 'lv';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('sr_lang', l); } catch {}
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
