import { Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function SearchBar({ value, onChange, autoFocus = false }) {
  const { t } = useLanguage();
  return <div className="search-box">
    <Search size={30} aria-hidden="true" />
    <label className="sr-only" htmlFor="service-search">{t.searchPlaceholder}</label>
    <input id="service-search" type="search" maxLength={80} autoComplete="off" autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={t.searchPlaceholder} />
    {value && <button className="search-box__clear" onClick={() => onChange('')} aria-label={t.clearSearch}><X size={26} /><span>{t.clearSearch}</span></button>}
  </div>;
}
