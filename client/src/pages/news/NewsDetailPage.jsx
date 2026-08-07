import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import NewsCard, { newsDate } from '../../components/news/NewsCard.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { newsCategoryClass, newsCategoryLabel } from '../../utils/news.js';

export default function NewsDetailPage() {
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
  if (!news && !error) return <LoadingState text="Загружаем публикацию…" />;
  if (error || !news) return <ErrorState title="Новость недоступна" text={error} onRetry={load} />;
  return <>
    <article className="news-detail">
      <nav className="news-breadcrumbs" aria-label="Навигационная цепочка"><Link to="/news">Новости</Link><ChevronRight size={15} /><span>{newsCategoryLabel(news.category)}</span></nav>
      <Link to="/news" className="news-detail__back"><ArrowLeft size={18} />Вернуться к ленте</Link>
      <header><div className="news-detail__meta"><span className={newsCategoryClass(news.category)}>{newsCategoryLabel(news.category)}</span><time dateTime={news.publishedAt || news.createdAt}><CalendarDays size={17} />{newsDate(news)}</time></div><h1>{news.title}</h1><p>{news.description}</p></header>
      {news.image && <img className="news-detail__image" src={assetUrl(news.image)} alt="" />}
      <div className="news-detail__content">{news.content.split(/\n{2,}/).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>)}</div>
    </article>
    {related.length > 0 && <section className="related-news"><header><span>Продолжить чтение</span><h2>Другие материалы по теме</h2></header><div className="news-grid">{related.map((item) => <NewsCard news={item} key={item.id} />)}</div></section>}
  </>;
}
