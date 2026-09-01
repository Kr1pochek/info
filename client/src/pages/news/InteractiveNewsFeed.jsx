import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeDollarSign, CalendarDays, Image as ImageIcon, Landmark, RefreshCw, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import VirtualKeyboard from '../../components/kiosk/VirtualKeyboard.jsx';
import NewsCard, { newsDate } from '../../components/news/NewsCard.jsx';
import PriorityNewsModal from '../../components/news/PriorityNewsModal.jsx';
import SearchSuggestions from '../../components/common/SearchSuggestions.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatDayMonth, formatFullDate } from '../../utils/date.js';
import { localizedNews, newsCategories, newsCategoryClass, newsCategoryLabel, newsCopy } from '../../utils/news.js';
import { findSearchSuggestions } from '../../utils/searchSuggestions.js';

const RATE_ROTATION_MS = 5 * 1000;
const CATEGORY_ROTATION_MS = 8 * 1000;
export default function InteractiveNewsFeed({ dismissedPrioritySignature, dismissPriority }) {
  const { language } = useLanguage(); const copy = newsCopy[language]; const locale = language === 'kz' ? 'kk-KZ' : 'ru-RU';
  const [news, setNews] = useState(null); const [rates, setRates] = useState(null); const [rateIndex, setRateIndex] = useState(0); const [rateLoading, setRateLoading] = useState(true); const [error, setError] = useState('');
  const [priorityNews, setPriorityNews] = useState([]); const [priorityModalOpen, setPriorityModalOpen] = useState(false); const [priorityIndex, setPriorityIndex] = useState(0);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [displayedFilters, setDisplayedFilters] = useState({ category: '', search: '' });
  const [categoryTransition, setCategoryTransition] = useState('initial');
  const [suggestions, setSuggestions] = useState([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const loadRequestRef = useRef(0);
  const categoryChangeSourceRef = useRef('initial');
  const updateSearch = useCallback((search) => { categoryChangeSourceRef.current = 'manual'; setFilters((current) => ({ ...current, search })); }, []);
  const selectCategory = useCallback((category) => { categoryChangeSourceRef.current = 'manual'; setFilters((current) => ({ ...current, category })); }, []);
  const closeKeyboard = useCallback(() => setKeyboardOpen(false), []);
  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setError('');
    try {
      const search = filters.search.trim();
      const response = await api.get('/news', { params: { limit: 50, category: filters.category || undefined, search: search || undefined } });
      if (requestId !== loadRequestRef.current) return;
      const nextNews = response.data.data;
      let nextSuggestions = [];
      if (!nextNews.length && search.length >= 2) {
        try {
          const candidatesResponse = await api.get('/news', { params: { limit: 100, category: filters.category || undefined } });
          if (requestId !== loadRequestRef.current) return;
          nextSuggestions = findSearchSuggestions(search, candidatesResponse.data.data, {
            getLabel: (item) => localizedNews(item, language).title,
            getSearchText: (item) => [item.titleRu, item.titleKz, item.descriptionRu, item.descriptionKz],
          });
        } catch {
          // Подсказки улучшают поиск, но их недоступность не должна скрывать основной результат.
        }
      }
      setNews(nextNews); setSuggestions(nextSuggestions); setDisplayedFilters({ category: filters.category, search: filters.search }); setCategoryTransition(categoryChangeSourceRef.current);
    } catch (err) { if (requestId === loadRequestRef.current) { setSuggestions([]); setError(apiMessage(err)); } }
  }, [filters, language]);
  const loadRates = useCallback(async () => { setRateLoading(true); try { const response = await api.get('/news/informer'); const nextRates = response.data.data.rates || []; setRates(nextRates); setRateIndex((current) => nextRates.length ? current % nextRates.length : 0); } catch { setRates(null); setRateIndex(0); } finally { setRateLoading(false); } }, []);
  const loadPriorityNews = useCallback(async () => { try { const response = await api.get('/news/priority'); setPriorityNews(response.data.data); } catch { setPriorityNews([]); } }, []);
  useEffect(() => { const timer = setTimeout(load, filters.search.trim() ? 250 : 0); return () => clearTimeout(timer); }, [filters.search, load]);
  useEffect(() => { loadRates(); const timer = setInterval(loadRates, 60 * 60 * 1000); return () => clearInterval(timer); }, [loadRates]);
  useEffect(() => { if (!rates || rates.length < 2) return undefined; const timer = setInterval(() => setRateIndex((current) => (current + 1) % rates.length), RATE_ROTATION_MS); return () => clearInterval(timer); }, [rates]);
  useEffect(() => {
    if (keyboardOpen || filters.search.trim()) return undefined;
    const timer = setTimeout(() => {
      categoryChangeSourceRef.current = 'auto';
      setFilters((current) => {
        const currentIndex = newsCategories.findIndex((item) => item.value === current.category);
        const nextCategory = newsCategories[(currentIndex + 1) % newsCategories.length];
        return { ...current, category: nextCategory.value };
      });
    }, CATEGORY_ROTATION_MS);
    return () => clearTimeout(timer);
  }, [filters.category, filters.search, keyboardOpen]);
  useEffect(() => { loadPriorityNews(); const timer = setInterval(loadPriorityNews, 60 * 1000); return () => clearInterval(timer); }, [loadPriorityNews]);
  const prioritySignature = priorityNews.map((entry) => `${entry.id}:${entry.updatedAt}:${entry.expiresAt}`).join('|');
  useEffect(() => { if (!prioritySignature) { setPriorityModalOpen(false); return; } if (prioritySignature === dismissedPrioritySignature) { setPriorityModalOpen(false); return; } setPriorityIndex(0); setPriorityModalOpen(true); }, [dismissedPrioritySignature, prioritySignature]);
  const rate = rates?.[rateIndex]; const RateTrend = rate?.change > 0 ? TrendingUp : TrendingDown;
  const featured = localizedNews(news?.[0], language); const feed = news?.slice(1) || [];
  const newsRefreshing = filters.category !== displayedFilters.category || filters.search !== displayedFilters.search;
  const categoryRotationPaused = keyboardOpen || Boolean(filters.search.trim());
  return <><section className="news-masthead"><div><span>{copy.portal}</span><h1>{copy.title}</h1><p>{formatFullDate(new Date(), language)}</p></div><aside className="exchange-card exchange-card--inline" aria-label={rate ? `${rate.code}/KZT` : copy.officialRate}><div className="exchange-card__heading"><span><BadgeDollarSign size={21} /></span><div><small>{copy.officialRate}</small><strong>{rate?.code || 'USD'} / KZT</strong></div><Landmark size={19} /></div>{rateLoading ? <div className="exchange-card__loading"><RefreshCw className="spin" size={20} />{copy.updating}</div> : rate ? <div className="exchange-card__inline-value" key={rate.code}><strong>{rate.rate.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸</strong><span className={rate.change > 0 ? 'is-up' : 'is-down'}><RateTrend size={15} />{rate.change > 0 ? '+' : ''}{rate.change.toLocaleString(locale, { minimumFractionDigits: 2 })}</span><small>{formatDayMonth(`${rate.date}T00:00:00`, language)}</small></div> : <div className="exchange-card__unavailable">{copy.rateUnavailable}</div>}</aside></section>
    <section className="news-discovery"><label className="news-search"><Search size={20} /><input type="search" inputMode="none" maxLength={80} autoComplete="off" value={filters.search} onFocus={() => setKeyboardOpen(true)} onClick={() => setKeyboardOpen(true)} onChange={(event) => updateSearch(event.target.value)} placeholder={copy.search} aria-label={copy.search} />{filters.search && <button type="button" onClick={() => updateSearch('')} aria-label={copy.clearSearch}><X size={18} /></button>}</label><div className={`news-category-tabs${categoryRotationPaused ? '' : ' news-category-tabs--auto'}`} aria-label={copy.news}>{newsCategories.map((item) => <button type="button" className={filters.category === item.value ? 'active' : ''} onClick={() => selectCategory(item.value)} key={item.value || 'all'}>{language === 'kz' ? item.labelKz : item.label}</button>)}</div></section>
    {keyboardOpen && <VirtualKeyboard value={filters.search} onChange={updateSearch} onClose={closeKeyboard} />}
    {!featured && <SearchSuggestions suggestions={suggestions} onSelect={updateSearch} />}
    {!news && !error ? <LoadingState text={copy.loading} /> : error ? <ErrorState title={copy.loadError} text={error} onRetry={load} /> : !featured ? <EmptyState text={copy.empty} /> : <div className={`news-category-page news-category-page--${categoryTransition}${newsRefreshing ? ' is-refreshing' : ''}`} key={`${displayedFilters.category || 'all'}-${featured.id}`} aria-busy={newsRefreshing}><section className="featured-news"><Link to={`/news/${featured.slug}`} className="featured-news__image">{featured.image ? <img src={assetUrl(featured.image)} alt="" /> : <span className="featured-news__placeholder"><ImageIcon size={58} /></span>}</Link><div className="featured-news__content"><div className="featured-news__meta"><span className={newsCategoryClass(featured.category)}>{newsCategoryLabel(featured.category, language)}</span><time dateTime={featured.publishedAt || featured.createdAt}><CalendarDays size={16} />{newsDate(featured, language)}</time></div><h2><Link to={`/news/${featured.slug}`}>{featured.title}</Link></h2><p>{featured.description}</p><Link to={`/news/${featured.slug}`} className="featured-news__link">{copy.readFeatured} <ArrowRight size={20} /></Link></div></section><section className="news-feed"><div className="news-feed__heading"><div><span>{displayedFilters.search || displayedFilters.category ? copy.results : copy.fresh}</span><h2>{displayedFilters.search ? `${copy.searchResult}: «${displayedFilters.search}»` : displayedFilters.category ? newsCategoryLabel(displayedFilters.category, language) : copy.latest}</h2></div><strong>{news.length.toLocaleString(locale)}</strong></div>{feed.length ? <div className="news-grid">{feed.map((item) => <NewsCard news={item} key={item.id} />)}</div> : <p className="news-feed__single">{copy.onlyOne}</p>}</section></div>}
    {priorityModalOpen && <PriorityNewsModal news={priorityNews[priorityIndex]} language={language} current={priorityIndex + 1} total={priorityNews.length} onNext={priorityIndex + 1 < priorityNews.length ? () => setPriorityIndex((currentIndex) => currentIndex + 1) : undefined} onClose={() => { dismissPriority(prioritySignature); setPriorityModalOpen(false); }} />}
  </>;
}
