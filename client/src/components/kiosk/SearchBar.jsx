import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import VirtualKeyboard from './VirtualKeyboard.jsx';

export default function SearchBar({ value, onChange, autoFocus = false, placeholder, inputId = 'service-search' }) {
  const { t } = useLanguage();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const closeKeyboard = useCallback(() => setKeyboardOpen(false), []);
  return <>
    <div className="search-box">
      <Search size={30} aria-hidden="true" />
      <label className="sr-only" htmlFor={inputId}>{placeholder || t.searchPlaceholder}</label>
      <input id={inputId} type="search" inputMode="none" maxLength={80} autoComplete="off" autoFocus={autoFocus} value={value} onClick={() => setKeyboardOpen(true)} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || t.searchPlaceholder} />
      {value && <button type="button" className="search-box__clear" onClick={() => onChange('')} aria-label={t.clearSearch}><X size={26} /><span>{t.clearSearch}</span></button>}
    </div>
    {keyboardOpen && <VirtualKeyboard value={value} onChange={onChange} onClose={closeKeyboard} />}
  </>;
}
