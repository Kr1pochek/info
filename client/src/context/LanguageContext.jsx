import { createContext, useContext, useMemo, useState } from 'react';
import { messages } from '../utils/localization.js';
import { track } from '../api/analytics.js';

const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('ru');
  const setLanguage = (value, silent = false) => { setLanguageState(value); if (!silent) track('LANGUAGE_CHANGE', { metadata: { language: value } }); };
  const value = useMemo(() => ({ language, setLanguage, t: messages[language], resetLanguage: () => setLanguage('ru', true) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
