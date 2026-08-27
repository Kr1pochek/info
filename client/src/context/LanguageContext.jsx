import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { messages } from '../utils/localization.js';
import { track } from '../api/analytics.js';

const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('ru');
  const setLanguage = useCallback((value, silent = false) => { setLanguageState(value); if (!silent) track('LANGUAGE_CHANGE', { metadata: { language: value } }); }, []);
  const resetLanguage = useCallback(() => setLanguage('ru', true), [setLanguage]);
  const value = useMemo(() => ({ language, setLanguage, t: messages[language], resetLanguage }), [language, resetLanguage, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
