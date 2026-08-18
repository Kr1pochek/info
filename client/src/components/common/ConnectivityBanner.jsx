import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ConnectivityBanner() {
  const { language } = useLanguage();
  const [state, setState] = useState(() => ({ online: navigator.onLine, cached: false }));

  useEffect(() => {
    const online = () => setState({ online: true, cached: false });
    const offline = () => setState((current) => ({ online: false, cached: current.cached }));
    const connectivity = (event) => setState({ online: event.detail.online, cached: Boolean(event.detail.cached) });
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('dgd-connectivity', connectivity);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('dgd-connectivity', connectivity);
    };
  }, []);

  if (state.online) return null;
  const text = language === 'kz'
    ? (state.cached ? 'Байланыс жоқ — сақталған деректер көрсетілуде' : 'Сервермен байланыс жоқ')
    : (state.cached ? 'Нет связи — показаны сохранённые данные' : 'Нет связи с сервером');
  return <div className="connectivity-banner" role="status"><WifiOff size={18} /><span>{text}</span></div>;
}
