import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeDollarSign, CalendarDays, Landmark, RefreshCw, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import VirtualKeyboard from '../../components/kiosk/VirtualKeyboard.jsx';
import NewsCard, { newsDate } from '../../components/news/NewsCard.jsx';
import SearchSuggestions from '../../components/common/SearchSuggestions.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localizedNews, newsCategories, newsCategoryClass, newsCategoryLabel, newsCopy } from '../../utils/news.js';
import { findSearchSuggestions } from '../../utils/searchSuggestions.js';

export default function InteractiveNewsFeed() {
  const { language } = useLanguage(); const copy = newsCopy[language]; const locale = language === 'kz' ? 'kk-KZ' : 'ru-RU';
  const [news, setNews] = useState(null); const [rate, setRate] = useState(null); const [rateLoading, setRateLoading] = useState(true); const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const loadRequestRef = useRef(0);
  const updateSearch = useCallback((search) => setFilters((current) => ({ ...current, search })), []);
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
      setNews(nextNews); setSuggestions(nextSuggestions);
    } catch (err) { if (requestId === loadRequestRef.current) { setSuggestions([]); setError(apiMessage(err)); } }
  }, [filters, language]);
  const loadRate = useCallback(async () => { setRateLoading(true); try { const response = await api.get('/exchange-rates/usd-kzt'); setRate(response.data.data); } catch { setRate(null); } finally { setRateLoading(false); } }, []);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { loadRate(); const timer = setInterval(loadRate, 60 * 60 * 1000); return () => clearInterval(timer); }, [loadRate]);
  const RateTrend = rate?.change > 0 ? TrendingUp : TrendingDown;
  const featured = localizedNews(news?.[0], language); const feed = news?.slice(1) || [];
  return <><section className="news-masthead"><div><span>{copy.portal}</span><h1>{copy.title}</h1><p>{new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div><aside className="exchange-card exchange-card--inline" aria-label="USD/KZT"><div className="exchange-card__heading"><span><BadgeDollarSign size={21} /></span><div><small>{copy.officialRate}</small><strong>USD / KZT</strong></div><Landmark size={19} /></div>{rateLoading ? <div className="exchange-card__loading"><RefreshCw className="spin" size={20} />{copy.updating}</div> : rate ? <div className="exchange-card__inline-value"><strong>{rate.rate.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸</strong><span className={rate.change > 0 ? 'is-up' : 'is-down'}><RateTrend size={15} />{rate.change > 0 ? '+' : ''}{rate.change.toLocaleString(locale, { minimumFractionDigits: 2 })}</span><small>{new Date(`${rate.date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</small></div> : <div className="exchange-card__unavailable">{copy.rateUnavailable}</div>}</aside></section>
    <section className="news-discovery"><label className="news-search"><Search size={20} /><input type="search" inputMode="none" maxLength={80} autoComplete="off" value={filters.search} onFocus={() => setKeyboardOpen(true)} onClick={() => setKeyboardOpen(true)} onChange={(event) => updateSearch(event.target.value)} placeholder={copy.search} aria-label={copy.search} />{filters.search && <button type="button" onClick={() => updateSearch('')} aria-label={copy.clearSearch}><X size={18} /></button>}</label><div className="news-category-tabs" aria-label={copy.news}>{newsCategories.map((item) => <button type="button" className={filters.category === item.value ? 'active' : ''} onClick={() => setFilters((current) => ({ ...current, category: item.value }))} key={item.value || 'all'}>{language === 'kz' ? item.labelKz : item.label}</button>)}</div></section>
    {keyboardOpen && <VirtualKeyboard value={filters.search} onChange={updateSearch} onClose={closeKeyboard} />}
    {!featured && <SearchSuggestions suggestions={suggestions} onSelect={updateSearch} />}
    {!news && !error ? <LoadingState text={copy.loading} /> : error ? <ErrorState title={copy.loadError} text={error} onRetry={load} /> : !featured ? <EmptyState text={copy.empty} /> : <><section className="featured-news"><Link to={`/news/${featured.slug}`} className="featured-news__image"><img src={assetUrl(featured.image)} alt="" /></Link><div className="featured-news__content"><div className="featured-news__meta"><span className={newsCategoryClass(featured.category)}>{newsCategoryLabel(featured.category, language)}</span><time dateTime={featured.publishedAt || featured.createdAt}><CalendarDays size={16} />{newsDate(featured, language)}</time></div><h2><Link to={`/news/${featured.slug}`}>{featured.title}</Link></h2><p>{featured.description}</p><Link to={`/news/${featured.slug}`} className="featured-news__link">{copy.readFeatured} <ArrowRight size={20} /></Link></div></section><section className="news-feed"><div className="news-feed__heading"><div><span>{filters.search || filters.category ? copy.results : copy.fresh}</span><h2>{filters.search ? `${copy.searchResult}: «${filters.search}»` : filters.category ? newsCategoryLabel(filters.category, language) : copy.latest}</h2></div><strong>{news.length.toLocaleString(locale)}</strong></div>{feed.length ? <div className="news-grid">{feed.map((item) => <NewsCard news={item} key={item.id} />)}</div> : <p className="news-feed__single">{copy.onlyOne}</p>}</section></>}
  </>;
}
