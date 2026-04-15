import React, { createContext, useContext, useState } from 'react';
const Ctx = createContext(null);
export const useLanguage = () => useContext(Ctx);
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ru');
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
