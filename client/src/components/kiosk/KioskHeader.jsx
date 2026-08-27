import { ArrowLeft, Eye, Home, Languages, QrCode, Type } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { track } from '../../api/analytics.js';
import DgdLogo from '../common/DgdLogo.jsx';

const qrCodes = [
  { id: 'kgd', image: '/qr/kgd-portal.png', url: 'kgd.gov.kz', labelRu: 'Портал государственных доходов', labelKz: 'Мемлекеттік кірістер порталы' },
  { id: 'egov', image: '/qr/egov-portal.png', url: 'egov.kz', labelRu: 'Электронное правительство', labelKz: 'Электрондық үкімет' },
];

export default function KioskHeader() {
  const navigate = useNavigate(); const location = useLocation();
  const { language, setLanguage, t } = useLanguage(); const { fontSize, cycleFontSize, visionMode, toggleVisionMode } = useFontSize();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const goHome = () => { track('HOME_RETURN'); navigate('/kiosk'); window.scrollTo({ top: 0 }); };
  return <header className="kiosk-header">
    <div className="brand" aria-label={language === 'kz' ? 'Мемлекеттік кірістер департаменті' : 'Департамент государственных доходов'}>
      <DgdLogo className="brand__logo" decorative /><span className="brand__name">{language === 'kz' ? 'Мемлекеттік кірістер департаменті' : 'Департамент государственных доходов'}</span>
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
      <button className="header-button" onClick={() => setLanguage(language === 'ru' ? 'kz' : 'ru')}><Languages size={24} /><span>{t.alternateLanguage}</span></button>
      <button className="header-button" onClick={cycleFontSize} title={t[fontSize]}><Type size={25} /><span>A{fontSize === 'large' ? '+' : fontSize === 'xlarge' ? '++' : ''}</span></button>
      <button className={`header-button accessibility-button${visionMode ? ' active' : ''}`} onClick={toggleVisionMode} aria-pressed={visionMode}><Eye size={25} /><span>{t.lowVision}</span></button>
      <time className="kiosk-clock" dateTime={now.toISOString()}><span>{now.toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span><strong>{now.toLocaleTimeString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}</strong></time>
    </nav>
  </header>;
}
