import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import KioskHeader from '../components/kiosk/KioskHeader.jsx';
import InactivityGuard from '../components/kiosk/InactivityGuard.jsx';
import { ErrorState, LoadingState } from '../components/common/States.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useFontSize } from '../context/FontSizeContext.jsx';
import { localized } from '../utils/localization.js';
import { shouldUseKioskInactivityTimer } from '../utils/kioskActivity.js';

export default function KioskLayout() {
  const { settings, loading, error, reload } = useSettings(); const { language, t } = useLanguage(); const { fontSize, visionMode } = useFontSize();
  const location = useLocation();
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousViewport = viewport?.getAttribute('content');
    viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');

    const preventMultiTouch = (event) => { if (event.touches?.length > 1) event.preventDefault(); };
    const preventGesture = (event) => event.preventDefault();
    const preventZoomWheel = (event) => { if (event.ctrlKey) event.preventDefault(); };
    const preventZoomKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].includes(event.key)) event.preventDefault();
    };

    document.addEventListener('touchstart', preventMultiTouch, { passive: false });
    document.addEventListener('touchmove', preventMultiTouch, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    window.addEventListener('wheel', preventZoomWheel, { passive: false });
    window.addEventListener('keydown', preventZoomKeys);

    return () => {
      if (viewport && previousViewport) viewport.setAttribute('content', previousViewport);
      document.removeEventListener('touchstart', preventMultiTouch);
      document.removeEventListener('touchmove', preventMultiTouch);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      window.removeEventListener('wheel', preventZoomWheel);
      window.removeEventListener('keydown', preventZoomKeys);
    };
  }, []);
  if (loading) return <main className="full-state"><LoadingState text={t.loading} /></main>;
  if (error || !settings) return <main className="full-state"><ErrorState title={t.unavailableTitle} text={t.unavailableText} onRetry={reload} retryText={t.retry} /></main>;
  if (settings.maintenanceMode) return <main className="full-state"><ErrorState title={t.maintenance} text={localized(settings, 'maintenanceMessage', language)} /></main>;
  const kiosk = <div className={`kiosk-shell font-${fontSize}${visionMode ? ' vision-mode' : ''}`}><KioskHeader /><main className="kiosk-main"><Outlet /></main></div>;
  return shouldUseKioskInactivityTimer(location.pathname) ? <InactivityGuard>{kiosk}</InactivityGuard> : kiosk;
}
