import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import NewsCard, { newsDate } from '../../components/news/NewsCard.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localizedNews, newsCategoryClass, newsCategoryLabel, newsCopy } from '../../utils/news.js';

export default function NewsDetailPage() {
  const { language } = useLanguage(); const copy = newsCopy[language];
  const { newsSlug } = useParams(); const [news, setNews] = useState(null); const [related, setRelated] = useState([]); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get(`/news/${newsSlug}`); const item = response.data.data; setNews(item);
      const relatedResponse = await api.get('/news', { params: { category: item.category, limit: 4 } });
      setRelated(relatedResponse.data.data.filter((candidate) => candidate.slug !== item.slug).slice(0, 3));
    } catch (err) { setError(apiMessage(err)); }
  }, [newsSlug]);
  useEffect(() => { load(); }, [load]);
  if (!news && !error) return <LoadingState text={copy.loadingArticle} />;
  if (error || !news) return <ErrorState title={copy.unavailable} text={error} onRetry={load} />;
  const item = localizedNews(news, language);
  return <>
    <article className="news-detail">
      <nav className="news-breadcrumbs" aria-label={copy.news}><Link to="/news">{copy.news}</Link><ChevronRight size={15} /><span>{newsCategoryLabel(item.category, language)}</span></nav>
      <Link to="/news" className="news-detail__back"><ArrowLeft size={18} />{copy.returnToFeed}</Link>
      <header><div className="news-detail__meta"><span className={newsCategoryClass(item.category)}>{newsCategoryLabel(item.category, language)}</span><time dateTime={item.publishedAt || item.createdAt}><CalendarDays size={17} />{newsDate(item, language)}</time></div><h1>{item.title}</h1><p>{item.description}</p></header>
      {item.image && <img className="news-detail__image" src={assetUrl(item.image)} alt="" />}
      <div className="news-detail__content">{item.content.split(/\n{2,}/).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>)}</div>
    </article>
    {related.length > 0 && <section className="related-news"><header><span>{copy.continueReading}</span><h2>{copy.related}</h2></header><div className="news-grid">{related.map((relatedItem) => <NewsCard news={relatedItem} key={relatedItem.id} />)}</div></section>}
  </>;
}
