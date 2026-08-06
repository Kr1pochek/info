import { useCallback, useEffect, useState } from 'react';
import { Headphones, MapPin, Phone, RotateCcw, X } from 'lucide-react';
import api, { apiMessage } from '../../api/client.js';
import { track } from '../../api/analytics.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { localized } from '../../utils/localization.js';
import { useServiceSearch } from '../../hooks/useServiceSearch.js';
import SearchBar from '../../components/kiosk/SearchBar.jsx';
import CategoryCard from '../../components/kiosk/CategoryCard.jsx';
import ServiceCard from '../../components/kiosk/ServiceCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';

export default function HomePage() {
  const { language, t, resetLanguage } = useLanguage(); const { resetFontSize } = useFontSize(); const { settings } = useSettings();
  const [categories, setCategories] = useState([]); const [popular, setPopular] = useState([]); const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [helpOpen, setHelpOpen] = useState(false);
  const search = useServiceSearch(query, language);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [categoriesResponse, popularResponse] = await Promise.all([api.get('/categories'), api.get('/services/popular')]); setCategories(categoriesResponse.data.data); setPopular(popularResponse.data.data); }
    catch (err) { setError(apiMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const reset = () => { setQuery(''); resetLanguage(); resetFontSize(); track('SESSION_RESET'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  if (loading) return <LoadingState text={t.loading} />;
  if (error) return <ErrorState title={t.unavailableTitle} text={t.unavailableText} onRetry={load} retryText={t.retry} />;
  const searching = query.trim().length >= 2;
  return <>
    <section className="hero-section">
      <div className="hero-section__eyebrow">{language === 'ru' ? 'Информационный киоск ДГД' : 'МКД ақпараттық киоскі'}</div>
      <h1>{t.question}</h1><p>{t.subtitle}</p><SearchBar value={query} onChange={setQuery} />
    </section>
    {searching ? <section className="content-section"><div className="section-heading"><div><span>{t.searchResults}</span><h2>{t.servicesFound}: {search.results.length}</h2></div></div>
      {search.loading ? <LoadingState text={t.loading} /> : search.error ? <ErrorState title={t.unavailableTitle} text={search.error} /> : search.results.length ? <div className="service-grid">{search.results.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <EmptyState text={t.noResults} />}
    </section> : <>
      <section className="content-section"><div className="section-heading"><div><span>01</span><h2>{t.categories}</h2></div><small>{categories.length}</small></div><div className="category-grid">{categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>
      <section className="content-section content-section--tinted"><div className="section-heading"><div><span>02</span><h2>{t.popular}</h2></div></div>{popular.length ? <div className="service-grid">{popular.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <EmptyState text={t.noServices} />}</section>
    </>}
    <section className="contact-strip">
      <div><Phone size={30} /><span>{t.contactCenter}<strong>{settings.contactPhone}</strong></span></div>
      <div><MapPin size={30} /><span>{t.office}<strong>{localized(settings, 'address', language)}</strong></span></div>
      <button className="button button--light" onClick={() => setHelpOpen(true)}><Headphones size={26} />{t.help}</button>
      <button className="button button--outline-light" onClick={reset}><RotateCcw size={25} />{t.reset}</button>
    </section>
    {helpOpen && <div className="modal-backdrop"><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Закрыть"><X /></button><div className="help-modal__icon"><Headphones size={44} /></div><h2 id="help-title">{t.help}</h2><p>{t.contactCenter}</p><strong>{settings.contactPhone}</strong><p>{localized(settings, 'workingHours', language)}</p><button className="button button--primary" onClick={() => setHelpOpen(false)}>{t.continue}</button></section></div>}
  </>;
}
