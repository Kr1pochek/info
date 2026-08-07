import { ArrowRight, CalendarDays, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../api/client.js';
import { newsCategoryClass, newsCategoryLabel } from '../../utils/news.js';

export function newsDate(news) {
  return new Date(news.publishedAt || news.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NewsCard({ news }) {
  return <article className="news-card">
    <Link to={`/news/${news.slug}`} className="news-card__image" tabIndex="-1">
      {news.image ? <img src={assetUrl(news.image)} alt="" loading="lazy" /> : <span><Image size={34} /></span>}
    </Link>
    <div className="news-card__body"><div className="news-card__meta"><span className={newsCategoryClass(news.category)}>{newsCategoryLabel(news.category)}</span><time dateTime={news.publishedAt || news.createdAt}><CalendarDays size={15} />{newsDate(news)}</time></div><h2><Link to={`/news/${news.slug}`}>{news.title}</Link></h2><p>{news.description}</p><Link to={`/news/${news.slug}`} className="news-card__link">Читать полностью <ArrowRight size={18} /></Link></div>
  </article>;
}
