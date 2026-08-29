import { useCallback, useEffect, useState } from 'react';
import api, { apiMessage } from '../../api/client.js';
import SearchBar from '../../components/kiosk/SearchBar.jsx';
import ServiceCard from '../../components/kiosk/ServiceCard.jsx';
import SearchSuggestions from '../../components/common/SearchSuggestions.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useServiceSearch } from '../../hooks/useServiceSearch.js';

export default function ServicesPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const { language, t } = useLanguage();
  const search = useServiceSearch(query, language);
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/services', { params: { limit: 100 } });
      setItems(response.data.data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const searching = query.trim().length >= 2;
  const shownItems = searching ? search.results : items || [];
  const pageError = error || (searching ? search.error : '');

  return <section className="page-section government-services-page">
    <header className="page-title"><span>{language === 'kz' ? '41 мемлекеттік қызмет' : '41 государственная услуга'}</span><h1>{t.governmentServicesList}</h1><p>{language === 'kz' ? 'Қажетті қызметті тізімнен таңдаңыз немесе атауы бойынша табыңыз.' : 'Выберите нужную услугу из полного списка или найдите её по названию.'}</p></header>
    <SearchBar value={query} onChange={setQuery} />
    <div className="section-heading section-heading--compact"><div><span>{searching ? t.searchResults : t.allServices}</span><h2>{t.servicesFound}: {shownItems.length}</h2></div></div>
    <div className="search-page-results">{(!items && !error) || (searching && search.loading)
      ? <LoadingState text={t.loading} />
      : pageError
        ? <ErrorState title={t.unavailableTitle} text={pageError} onRetry={error ? load : undefined} retryText={t.retry} />
        : shownItems.length
          ? <div className="service-grid">{shownItems.map((item) => <ServiceCard service={item} key={item.id} />)}</div>
          : <><SearchSuggestions suggestions={search.suggestions} onSelect={setQuery} /><EmptyState text={t.noResults} /></>}
    </div>
  </section>;
}
