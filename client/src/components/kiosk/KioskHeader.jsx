import { ArrowLeft, Eye, Home, Languages, QrCode, Type } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { track } from '../../api/analytics.js';
import { localized } from '../../utils/localization.js';
import DgdLogo from '../common/DgdLogo.jsx';

const qrCodes = [
  { id: 'kgd', image: '/qr/kgd-portal.png', url: 'portal.kgd.gov.kz', labelRu: 'Портал государственных доходов', labelKz: 'Мемлекеттік кірістер порталы' },
  { id: 'egov', image: '/qr/egov-portal.png', url: 'egov.kz', labelRu: 'Электронное правительство', labelKz: 'Электрондық үкімет' },
];

export default function KioskHeader() {
  const navigate = useNavigate(); const location = useLocation();
  const { language, setLanguage, t } = useLanguage(); const { fontSize, cycleFontSize, visionMode, toggleVisionMode } = useFontSize();
  const { settings } = useSettings();
  const organizationName = localized(settings, 'organizationName', language);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const goHome = () => { track('HOME_RETURN'); navigate('/kiosk'); window.scrollTo({ top: 0 }); };
  const changeLanguage = () => {
    const next = language === 'ru' ? 'kz' : 'ru';
    setLanguage(next);
    track('LANGUAGE_CHANGE', { metadata: { language: next } });
  };
  const changeFontSize = () => {
    const next = cycleFontSize();
    track('FONT_SIZE_CHANGE', { metadata: { size: next } });
  };
  const changeVisionMode = () => {
    const enabled = toggleVisionMode();
    track('FONT_SIZE_CHANGE', { metadata: { size: enabled ? 'vision-mode' : 'normal' } });
  };
  return <header className="kiosk-header">
    <div className="brand" aria-label={organizationName}>
      <DgdLogo className="brand__logo" decorative /><span className="brand__name">{organizationName}</span>
    </div>
    <section className="kiosk-header__qr-list" aria-label={t.officialResources}>
      <span className="kiosk-header__qr-label"><QrCode size={19} />{t.scanQrCode}</span>
      {qrCodes.map((code) => <article className="kiosk-header__qr" key={code.id}>
        <img src={code.image} alt={`${code[language === 'kz' ? 'labelKz' : 'labelRu']} — QR ${code.url}`} />
        <div><strong>{code[language === 'kz' ? 'labelKz' : 'labelRu']}</strong><span>{code.url}</span></div>
      </article>)}
    </section>
    <nav className="kiosk-header__actions" aria-label="Навигация">
      {location.pathname !== '/kiosk' && <button className="header-button" onClick={() => navigate(-1)}><ArrowLeft size={24} /><span>{t.back}</span></button>}
      <button className="header-button" onClick={goHome}><Home size={24} /><span>{t.home}</span></button>
      <button className="header-button" onClick={changeLanguage}><Languages size={24} /><span>{t.alternateLanguage}</span></button>
      <button className="header-button" onClick={changeFontSize} title={t[fontSize]}><Type size={25} /><span>A{fontSize === 'large' ? '+' : fontSize === 'xlarge' ? '++' : ''}</span></button>
      <button className={`header-button accessibility-button${visionMode ? ' active' : ''}`} onClick={changeVisionMode} aria-pressed={visionMode}><Eye size={25} /><span>{t.lowVision}</span></button>
      <time className="kiosk-clock" dateTime={now.toISOString()}><span>{now.toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span><strong>{now.toLocaleTimeString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}</strong></time>
    </nav>
  </header>;
}
