import { Outlet } from 'react-router-dom';
import KioskHeader from '../components/kiosk/KioskHeader.jsx';
import InactivityGuard from '../components/kiosk/InactivityGuard.jsx';
import { ErrorState, LoadingState } from '../components/common/States.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useFontSize } from '../context/FontSizeContext.jsx';
import { localized } from '../utils/localization.js';

export default function KioskLayout() {
  const { settings, loading, error, reload } = useSettings(); const { language, t } = useLanguage(); const { fontSize } = useFontSize();
  if (loading) return <main className="full-state"><LoadingState text={t.loading} /></main>;
  if (error || !settings) return <main className="full-state"><ErrorState title={t.unavailableTitle} text={t.unavailableText} onRetry={reload} retryText={t.retry} /></main>;
  if (settings.maintenanceMode) return <main className="full-state"><ErrorState title={t.maintenance} text={localized(settings, 'maintenanceMessage', language)} /></main>;
  return <InactivityGuard><div className={`kiosk-shell font-${fontSize}`}><KioskHeader /><main className="kiosk-main"><Outlet /></main></div></InactivityGuard>;
}
