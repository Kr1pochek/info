import { ArrowLeft, Grid2X2, Languages, Newspaper } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { newsCopy } from '../utils/news.js';

export default function NewsLayout() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const copy = newsCopy[language];
  return <div className="news-shell">
    <header className="news-header">
      <Link to="/news" className="news-brand"><span><Newspaper size={25} /></span><div><strong>{copy.brand}</strong><small>{copy.brandSubtitle}</small></div></Link>
      <nav aria-label="Навигация новостей">
        {location.pathname !== '/news' && <Link to="/news" className="news-nav-link news-nav-back"><ArrowLeft size={19} />{copy.backToFeed}</Link>}
        <button type="button" className="news-nav-link news-language-switch" onClick={() => setLanguage(language === 'kz' ? 'ru' : 'kz')}><Languages size={19} />{language === 'kz' ? 'Рус' : 'Қаз'}</button>
        <Link to="/" className="news-nav-link"><Grid2X2 size={19} />{copy.allServices}</Link>
      </nav>
    </header>
    <main className="news-main"><Outlet /></main>
    <footer className="news-footer"><span>{copy.organization}</span><Link to="/admin/login">{copy.administration}</Link></footer>
  </div>;
}
