import { SearchCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function SearchSuggestions({ suggestions, onSelect, className = '' }) {
  const { t } = useLanguage();
  if (!suggestions?.length) return null;

  return <aside className={`search-suggestions ${className}`.trim()} aria-live="polite">
    <div className="search-suggestions__title"><SearchCheck size={24} /><strong>{t.didYouMean}</strong></div>
    <div className="search-suggestions__options">
      {suggestions.map((suggestion) => <button type="button" onClick={() => onSelect(suggestion)} aria-label={`${t.searchSuggestion}: ${suggestion}`} key={suggestion}>{suggestion}</button>)}
    </div>
  </aside>;
}
