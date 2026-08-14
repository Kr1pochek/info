import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import { track } from '../../api/analytics.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localized } from '../../utils/localization.js';
import SearchBar from '../../components/kiosk/SearchBar.jsx';
import ServiceCard from '../../components/kiosk/ServiceCard.jsx';
import AppIcon from '../../components/common/AppIcon.jsx';
import SearchSuggestions from '../../components/common/SearchSuggestions.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { findSearchSuggestions, normalizeSearchText } from '../../utils/searchSuggestions.js';

export default function CategoryPage() {
  const { categorySlug } = useParams(); const { language, t } = useLanguage();
  const [category, setCategory] = useState(null); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await api.get(`/categories/${categorySlug}`); setCategory(response.data.data); track('CATEGORY_OPEN', { categoryId: response.data.data.id }); } catch (err) { setError(apiMessage(err)); } finally { setLoading(false); } }, [categorySlug]);
  useEffect(() => { load(); }, [load]);
  const services = useMemo(() => {
    if (!category) return [];
    const q = normalizeSearchText(query); if (!q) return category.services;
    return category.services.filter((item) => normalizeSearchText(`${localized(item, 'title', language)} ${localized(item, 'shortDescription', language)} ${localized(item.category, 'title', language)}`).includes(q));
  }, [category, query, language]);
  const suggestions = useMemo(() => services.length || query.trim().length < 2 ? [] : findSearchSuggestions(query, category?.services, {
    getLabel: (item) => localized(item, 'title', language),
    getSearchText: (item) => [item.titleRu, item.titleKz, item.category?.titleRu, item.category?.titleKz],
  }), [category, language, query, services.length]);
  if (loading) return <LoadingState text={t.loading} />; if (error || !category) return <ErrorState title={t.unavailableTitle} text={error || t.unavailableText} onRetry={load} retryText={t.retry} />;
  return <section className="page-section"><header className="category-hero"><div className="category-hero__icon"><AppIcon name={category.icon} size={52} /></div><div><span>{t.category}</span><h1>{localized(category, 'title', language)}</h1><p>{localized(category, 'description', language)}</p></div></header><SearchBar value={query} onChange={setQuery} />
    <div className="section-heading section-heading--compact"><div><span>{t.allServices}</span><h2>{t.servicesFound}: {services.length}</h2></div></div>{services.length ? <div className="service-grid">{services.map((service) => <ServiceCard service={service} key={service.id} />)}</div> : <><SearchSuggestions suggestions={suggestions} onSelect={setQuery} /><EmptyState text={query ? t.noResults : t.noServices} /></>}
  </section>;
}
