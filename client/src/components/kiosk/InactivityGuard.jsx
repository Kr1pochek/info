import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { track } from '../../api/analytics.js';
import { isDeliberateKioskActivity, kioskActivityEvents } from '../../utils/kioskActivity.js';

export default function InactivityGuard({ children }) {
  const { settings } = useSettings(); const { t, resetLanguage } = useLanguage(); const { resetFontSize } = useFontSize(); const navigate = useNavigate();
  const sessionStarted = useRef(false); const lastActivity = useRef(null); const [remaining, setRemaining] = useState(null);
  const continueSession = useCallback(() => { sessionStarted.current = true; lastActivity.current = Date.now(); setRemaining(null); }, []);
  const resetSession = useCallback((eventType = 'SESSION_TIMEOUT') => {
    sessionStarted.current = false; lastActivity.current = null; setRemaining(null); resetLanguage(); resetFontSize(); track(eventType); navigate('/kiosk', { replace: true }); window.scrollTo({ top: 0, behavior: 'auto' });
  }, [navigate, resetFontSize, resetLanguage]);
  useEffect(() => {
    if (!settings) return undefined;
    const activity = (event) => {
      if (!isDeliberateKioskActivity(event)) return;
      if (remaining == null) { sessionStarted.current = true; lastActivity.current = Date.now(); }
    };
    kioskActivityEvents.forEach((event) => window.addEventListener(event, activity, { passive: true }));
    const timer = setInterval(() => {
      if (!sessionStarted.current || lastActivity.current == null) return;
      const left = settings.inactivitySeconds - Math.floor((Date.now() - lastActivity.current) / 1000);
      if (left <= 0) resetSession('SESSION_TIMEOUT'); else if (left <= settings.warningSeconds) setRemaining(left); else setRemaining(null);
    }, 500);
    return () => { clearInterval(timer); kioskActivityEvents.forEach((event) => window.removeEventListener(event, activity)); };
  }, [settings, remaining, resetSession]);
  return <>{children}{remaining != null && <div className="modal-backdrop" role="presentation"><section className="session-modal" role="alertdialog" aria-modal="true" aria-labelledby="session-title">
    <div className="session-modal__icon"><Clock3 size={40} /></div><h2 id="session-title">{t.sessionTitle}</h2><p>{t.sessionText}</p><strong className="session-countdown">{remaining} {t.seconds}</strong>
    <div className="session-modal__actions"><button className="button button--primary" autoFocus onClick={continueSession}>{t.continue}</button><button className="button button--secondary" onClick={() => resetSession('SESSION_RESET')}>{t.home}</button></div>
  </section></div>}</>;
}
