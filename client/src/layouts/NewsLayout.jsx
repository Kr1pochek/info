import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Grid2X2, Languages, Newspaper } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { newsCopy } from '../utils/news.js';

export default function NewsLayout() {
  const location = useLocation(); const navigate = useNavigate(); const timerRef = useRef(null);
  const { language, setLanguage } = useLanguage(); const { settings } = useSettings();
  const [interactive, setInteractive] = useState(() => location.pathname !== '/news');
  const copy = newsCopy[language]; const idleSeconds = settings?.broadcastIdleSeconds || 60;
  const returnToBroadcast = useCallback(() => { clearTimeout(timerRef.current); setInteractive(false); setLanguage('kz', true); navigate('/news', { replace: true }); }, [navigate, setLanguage]);
  const resetIdleTimer = useCallback(() => { clearTimeout(timerRef.current); timerRef.current = setTimeout(returnToBroadcast, idleSeconds * 1000); }, [idleSeconds, returnToBroadcast]);
  const activateInteractive = useCallback(() => { setInteractive(true); resetIdleTimer(); }, [resetIdleTimer]);
  useEffect(() => { if (interactive) resetIdleTimer(); return () => clearTimeout(timerRef.current); }, [interactive, resetIdleTimer]);
  useEffect(() => { if (location.pathname !== '/news' && !interactive) activateInteractive(); }, [activateInteractive, interactive, location.pathname]);
  const activityProps = { onPointerDownCapture: resetIdleTimer, onKeyDownCapture: resetIdleTimer, onWheelCapture: resetIdleTimer };
  if (!interactive) return <div className="news-broadcast-entry"><Outlet context={{ interactive, activateInteractive }} /></div>;
  return <div className="news-shell" {...activityProps}>
    <header className="news-header"><Link to="/news" className="news-brand"><span><Newspaper size={25} /></span><div><strong>{copy.brand}</strong><small>{copy.brandSubtitle}</small></div></Link><nav aria-label="Навигация новостей">{location.pathname !== '/news' && <Link to="/news" className="news-nav-link news-nav-back"><ArrowLeft size={19} />{copy.backToFeed}</Link>}<button type="button" className="news-nav-link news-language-switch" onClick={() => setLanguage(language === 'kz' ? 'ru' : 'kz')}><Languages size={19} />{language === 'kz' ? 'Рус' : 'Қаз'}</button><Link to="/" className="news-nav-link"><Grid2X2 size={19} />{copy.allServices}</Link></nav></header>
    <main className="news-main"><Outlet context={{ interactive, activateInteractive }} /></main>
    <footer className="news-footer"><span>{copy.organization}</span><Link to="/admin/login">{copy.administration}</Link></footer>
  </div>;
}
