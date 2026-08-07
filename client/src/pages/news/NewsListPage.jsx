import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeDollarSign, CalendarDays, Landmark, RefreshCw, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import NewsCard, { newsDate } from '../../components/news/NewsCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { newsCategories, newsCategoryClass, newsCategoryLabel } from '../../utils/news.js';

export default function NewsListPage() {
  const [news, setNews] = useState(null); const [rate, setRate] = useState(null); const [rateLoading, setRateLoading] = useState(true); const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', search: '' });
  const load = useCallback(async () => { setError(''); try { const response = await api.get('/news', { params: { limit: 50, category: filters.category || undefined, search: filters.search.trim() || undefined } }); setNews(response.data.data); } catch (err) { setError(apiMessage(err)); } }, [filters]);
  const loadRate = useCallback(async () => { setRateLoading(true); try { const response = await api.get('/exchange-rates/usd-kzt'); setRate(response.data.data); } catch { setRate(null); } finally { setRateLoading(false); } }, []);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { loadRate(); const timer = setInterval(loadRate, 60 * 60 * 1000); return () => clearInterval(timer); }, [loadRate]);
  const RateTrend = rate?.change > 0 ? TrendingUp : TrendingDown;
  const featured = news?.[0]; const feed = news?.slice(1) || [];

  return <>
    <section className="news-masthead">
      <div><span>Корпоративный медиапортал</span><h1>Новости ДГД</h1><p>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <aside className="exchange-card exchange-card--inline" aria-label="Официальный курс доллара к тенге">
        <div className="exchange-card__heading"><span><BadgeDollarSign size={21} /></span><div><small>Официальный курс</small><strong>USD / KZT</strong></div><Landmark size={19} /></div>
        {rateLoading ? <div className="exchange-card__loading"><RefreshCw className="spin" size={20} />Обновляем…</div> : rate ? <div className="exchange-card__inline-value"><strong>{rate.rate.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸</strong><span className={rate.change > 0 ? 'is-up' : 'is-down'}><RateTrend size={15} />{rate.change > 0 ? '+' : ''}{rate.change.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span><small>{new Date(`${rate.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</small></div> : <div className="exchange-card__unavailable">Курс недоступен</div>}
      </aside>
    </section>

    <section className="news-discovery">
      <label className="news-search"><Search size={20} /><input type="search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Поиск по новостям" aria-label="Поиск по новостям" />{filters.search && <button onClick={() => setFilters({ ...filters, search: '' })} aria-label="Очистить поиск"><X size={18} /></button>}</label>
      <div className="news-category-tabs" aria-label="Категории новостей">{newsCategories.map((item) => <button className={filters.category === item.value ? 'active' : ''} onClick={() => setFilters({ ...filters, category: item.value })} key={item.value || 'all'}>{item.label}</button>)}</div>
    </section>

    {!news && !error ? <LoadingState text="Загружаем новости…" /> : error ? <ErrorState title="Не удалось загрузить новости" text={error} onRetry={load} /> : !featured ? <EmptyState text="По вашему запросу публикаций не найдено" /> : <>
      <section className="featured-news">
        <Link to={`/news/${featured.slug}`} className="featured-news__image"><img src={assetUrl(featured.image)} alt="" /></Link>
        <div className="featured-news__content"><div className="featured-news__meta"><span className={newsCategoryClass(featured.category)}>{newsCategoryLabel(featured.category)}</span><time dateTime={featured.publishedAt || featured.createdAt}><CalendarDays size={16} />{newsDate(featured)}</time></div><h2><Link to={`/news/${featured.slug}`}>{featured.title}</Link></h2><p>{featured.description}</p><Link to={`/news/${featured.slug}`} className="featured-news__link">Читать главную новость <ArrowRight size={20} /></Link></div>
      </section>
      <section className="news-feed"><div className="news-feed__heading"><div><span>{filters.search || filters.category ? 'Результаты' : 'Свежие публикации'}</span><h2>{filters.search ? `Поиск: «${filters.search}»` : filters.category ? newsCategoryLabel(filters.category) : 'Последние новости'}</h2></div><strong>{news.length.toLocaleString('ru-RU')}</strong></div>{feed.length ? <div className="news-grid">{feed.map((item) => <NewsCard news={item} key={item.id} />)}</div> : <p className="news-feed__single">Это единственная публикация в выбранном разделе.</p>}</section>
    </>}
  </>;
}
