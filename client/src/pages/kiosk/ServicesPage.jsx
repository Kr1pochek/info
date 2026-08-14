import { useState } from 'react';
import SearchBar from '../../components/kiosk/SearchBar.jsx';
import ServiceCard from '../../components/kiosk/ServiceCard.jsx';
import SearchSuggestions from '../../components/common/SearchSuggestions.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useServiceSearch } from '../../hooks/useServiceSearch.js';

export default function ServicesPage() {
  const [query, setQuery] = useState(''); const { language, t } = useLanguage(); const search = useServiceSearch(query, language);
  return <section className="page-section"><header className="page-title"><span>{t.allServices}</span><h1>{t.searchResults}</h1><p>{t.subtitle}</p></header><SearchBar value={query} onChange={setQuery} autoFocus />
    <div className="search-page-results">{query.trim().length < 2 ? <EmptyState text={t.subtitle} /> : search.loading ? <LoadingState text={t.loading} /> : search.error ? <ErrorState title={t.unavailableTitle} text={search.error} /> : search.results.length ? <div className="service-grid">{search.results.map((item) => <ServiceCard service={item} key={item.id} />)}</div> : <><SearchSuggestions suggestions={search.suggestions} onSelect={setQuery} /><EmptyState text={t.noResults} /></>}</div>
  </section>;
}
