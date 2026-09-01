import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock3, Languages } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useFontSize } from '../context/FontSizeContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { newsCopy } from '../utils/news.js';
import DgdLogo from '../components/common/DgdLogo.jsx';

export default function NewsLayout() {
  const location = useLocation(); const navigate = useNavigate(); const lastActivityRef = useRef(null);
  const { language, setLanguage } = useLanguage(); const { settings } = useSettings();
  const { fontSize, visionMode } = useFontSize();
  const [interactive, setInteractive] = useState(() => location.pathname !== '/news');
  const [remaining, setRemaining] = useState(null);
  const [dismissedPrioritySignature, setDismissedPrioritySignature] = useState('');
  const copy = newsCopy[language]; const idleSeconds = settings?.broadcastIdleSeconds || 60;
  const warningSeconds = Math.min(settings?.warningSeconds || 15, Math.max(1, idleSeconds - 1));
  const resetPriorityDismissal = useCallback(() => setDismissedPrioritySignature(''), []);
  const dismissPriority = useCallback((signature) => setDismissedPrioritySignature(signature), []);
  const returnToBroadcast = useCallback(() => { lastActivityRef.current = null; setRemaining(null); resetPriorityDismissal(); setInteractive(false); setLanguage('kz', true); navigate('/news', { replace: true }); }, [navigate, resetPriorityDismissal, setLanguage]);
  const resetIdleTimer = useCallback(() => { lastActivityRef.current = Date.now(); setRemaining(null); }, []);
  const activateInteractive = useCallback(() => { resetIdleTimer(); setInteractive(true); }, [resetIdleTimer]);
  useEffect(() => {
    if (!interactive) { lastActivityRef.current = null; setRemaining(null); return undefined; }
    if (lastActivityRef.current == null) lastActivityRef.current = Date.now();
    const timer = setInterval(() => {
      const left = idleSeconds - Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (left <= 0) returnToBroadcast();
      else if (left <= warningSeconds) setRemaining(left);
      else setRemaining(null);
    }, 500);
    return () => clearInterval(timer);
  }, [idleSeconds, interactive, returnToBroadcast, warningSeconds]);
  useEffect(() => { if (location.pathname !== '/news' && !interactive) activateInteractive(); }, [activateInteractive, interactive, location.pathname]);
  const activityProps = { onPointerDownCapture: resetIdleTimer, onKeyDownCapture: resetIdleTimer, onWheelCapture: resetIdleTimer };
  const accessibilityClass = `font-${fontSize}${visionMode ? ' vision-mode' : ''}`;
  const outletContext = { interactive, activateInteractive, dismissedPrioritySignature, dismissPriority, resetPriorityDismissal };
  if (!interactive) return <div className={`news-broadcast-entry ${accessibilityClass}`}><Outlet context={outletContext} /></div>;
  return <div className={`news-shell ${accessibilityClass}`} {...activityProps}>
    <header className="news-header"><Link to="/news" className="news-brand"><DgdLogo className="news-brand__logo" decorative /><div><strong>{copy.brand}</strong><small>{copy.brandSubtitle}</small></div></Link><nav aria-label={language === 'kz' ? 'Жаңалықтар навигациясы' : 'Навигация новостей'}>{location.pathname !== '/news' && <Link to="/news" className="news-nav-link news-nav-back"><ArrowLeft size={19} />{copy.backToFeed}</Link>}<button type="button" className="news-nav-link news-language-switch" onClick={() => setLanguage(language === 'kz' ? 'ru' : 'kz')}><Languages size={19} />{language === 'kz' ? 'Рус' : 'Қаз'}</button></nav></header>
    <main className="news-main"><Outlet context={outletContext} /></main>
    <footer className="news-footer"><span>{copy.organization}</span><span>{copy.administration}</span></footer>
    {remaining != null && <div className="modal-backdrop news-session-backdrop" role="presentation"><section className="session-modal news-session-modal" role="alertdialog" aria-modal="true" aria-labelledby="news-session-title">
      <div className="session-modal__icon"><Clock3 size={40} /></div><h2 id="news-session-title">{language === 'kz' ? 'Жаңалықтарды оқуды жалғастырғыңыз келе ме?' : 'Хотите продолжить читать новости?'}</h2><p>{language === 'kz' ? 'Егер ештеңе баспасаңыз, экран автоматты түрде ақпараттық эфирге оралады.' : 'Если ничего не нажать, экран автоматически вернётся к информационному эфиру.'}</p><strong className="session-countdown">{remaining} {language === 'kz' ? 'секунд' : 'секунд'}</strong>
      <div className="session-modal__actions"><button className="button button--primary" autoFocus onClick={resetIdleTimer}>{language === 'kz' ? 'Жаңалықтарды оқуды жалғастыру' : 'Продолжить просмотр новостей'}</button><button className="button button--secondary" onClick={returnToBroadcast}>{language === 'kz' ? 'Эфирге оралу' : 'Вернуться к эфиру'}</button></div>
    </section></div>}
  </div>;
}
