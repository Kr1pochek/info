import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { messages } from '../utils/localization.js';

const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('kz');
  const setLanguage = useCallback((value) => { setLanguageState(value); }, []);
  const resetLanguage = useCallback(() => setLanguage('kz', true), [setLanguage]);
  const value = useMemo(() => ({ language, setLanguage, t: messages[language], resetLanguage }), [language, resetLanguage, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
