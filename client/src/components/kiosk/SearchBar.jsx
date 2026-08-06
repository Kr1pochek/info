import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import VirtualKeyboard from './VirtualKeyboard.jsx';

export default function SearchBar({ value, onChange, autoFocus = false }) {
  const { t } = useLanguage();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const closeKeyboard = useCallback(() => setKeyboardOpen(false), []);
  return <>
    <div className="search-box">
      <Search size={30} aria-hidden="true" />
      <label className="sr-only" htmlFor="service-search">{t.searchPlaceholder}</label>
      <input id="service-search" type="search" inputMode="none" maxLength={80} autoComplete="off" autoFocus={autoFocus} value={value} onClick={() => setKeyboardOpen(true)} onChange={(e) => onChange(e.target.value)} placeholder={t.searchPlaceholder} />
      {value && <button type="button" className="search-box__clear" onClick={() => onChange('')} aria-label={t.clearSearch}><X size={26} /><span>{t.clearSearch}</span></button>}
    </div>
    {keyboardOpen && <VirtualKeyboard value={value} onChange={onChange} onClose={closeKeyboard} />}
  </>;
}
