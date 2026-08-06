import { ArrowLeft, Home, Languages, Type } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { localized } from '../../utils/localization.js';
import { track } from '../../api/analytics.js';

export default function KioskHeader() {
  const navigate = useNavigate(); const location = useLocation();
  const { language, setLanguage, t } = useLanguage(); const { fontSize, cycleFontSize } = useFontSize(); const { settings } = useSettings();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const goHome = () => { track('HOME_RETURN'); navigate('/'); window.scrollTo({ top: 0 }); };
  return <header className="kiosk-header">
    <div className="brand" aria-label={localized(settings, 'organizationName', language)}>
      <span className="brand__mark">ДГД</span><span className="brand__name">{localized(settings, 'organizationName', language)}</span>
    </div>
    <nav className="kiosk-header__actions" aria-label="Навигация">
      {location.pathname !== '/' && <button className="header-button" onClick={() => navigate(-1)}><ArrowLeft size={24} /><span>{t.back}</span></button>}
      <button className="header-button" onClick={goHome}><Home size={24} /><span>{t.home}</span></button>
      <button className="header-button" onClick={() => setLanguage(language === 'ru' ? 'kz' : 'ru')}><Languages size={24} /><span>{t.alternateLanguage}</span></button>
      <button className="header-button" onClick={cycleFontSize} title={t[fontSize]}><Type size={25} /><span>A{fontSize === 'large' ? '+' : fontSize === 'xlarge' ? '++' : ''}</span></button>
      {settings?.showCurrentTime && <time className="kiosk-clock" dateTime={now.toISOString()}>{now.toLocaleTimeString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}</time>}
    </nav>
  </header>;
}
