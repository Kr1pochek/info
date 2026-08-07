import { ArrowLeft, Grid2X2, Newspaper } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function NewsLayout() {
  const location = useLocation();
  return <div className="news-shell">
    <header className="news-header">
      <Link to="/news" className="news-brand"><span><Newspaper size={25} /></span><div><strong>Новости ДГД</strong><small>Корпоративная лента</small></div></Link>
      <nav aria-label="Навигация новостей">
        {location.pathname !== '/news' && <Link to="/news" className="news-nav-link"><ArrowLeft size={19} />К ленте</Link>}
        <Link to="/" className="news-nav-link"><Grid2X2 size={19} />Все сервисы</Link>
      </nav>
    </header>
    <main className="news-main"><Outlet /></main>
    <footer className="news-footer"><span>Департамент государственных доходов по городу Алматы</span><Link to="/admin/login">Администрирование</Link></footer>
  </div>;
}
