import { ArrowRight, CalendarDays, Image, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localizedNews, newsCategoryClass, newsCategoryLabel, newsCopy } from '../../utils/news.js';

export function newsDate(news, language = 'ru') {
  return new Date(news.publishedAt || news.createdAt).toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NewsCard({ news }) {
  const { language } = useLanguage();
  const item = localizedNews(news, language); const copy = newsCopy[language];
  return <article className="news-card">
    <Link to={`/news/${item.slug}`} className="news-card__image" tabIndex="-1">
      {item.image ? <img src={assetUrl(item.image)} alt="" loading="lazy" /> : <span><Image size={34} /></span>}
    </Link>
    <div className="news-card__body">{item.isPriority && <div className="news-card__priority"><ShieldAlert size={13} />{language === 'kz' ? 'Маңызды жаңалық' : 'Важная новость'}</div>}<div className="news-card__meta"><span className={newsCategoryClass(item.category)}>{newsCategoryLabel(item.category, language)}</span><time dateTime={item.publishedAt || item.createdAt}><CalendarDays size={15} />{newsDate(item, language)}</time></div><h2><Link to={`/news/${item.slug}`}>{item.title}</Link></h2><p>{item.description}</p><Link to={`/news/${item.slug}`} className="news-card__link">{copy.readFull} <ArrowRight size={18} /></Link></div>
  </article>;
}
