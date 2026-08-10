import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Database, HardDrive, MemoryStick, RefreshCw, Server, TriangleAlert, Unplug } from 'lucide-react';
import api, { apiMessage } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';

const icons = { backend: Server, database: Database, storage: HardDrive };
const labels = { ONLINE: 'Работает', ERROR: 'Ошибка', NOT_CONFIGURED: 'Ожидает интеграции' };

export default function SystemStatusPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try { const response = await api.get('/admin/system-status'); setData(response.data.data); setError(''); }
    catch (err) { setError(apiMessage(err)); }
    finally { setRefreshing(false); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(() => load(true), 15000); return () => clearInterval(timer); }, [load]);
  if (!data && !error) return <LoadingState text="Проверяем систему…" />;
  if (!data && error) return <ErrorState title="Мониторинг недоступен" text={error} onRetry={load} />;
  return <>
    <AdminPageHeader eyebrow="Мониторинг" title="Состояние системы" description="Реальный статус приложения, базы, файлов и будущих интеграций" actions={<button className="admin-button admin-button--secondary" onClick={() => load()} disabled={refreshing}><RefreshCw className={refreshing ? 'is-spinning' : ''} size={18} />Обновить</button>} />
    {error && <div className="form-error">{error}</div>}
    <div className="system-summary"><article><Activity /><span>Общий статус</span><strong>{data.overall === 'ONLINE' ? 'Система работает' : 'Требует внимания'}</strong></article><article><CheckCircle2 /><span>Доступно</span><strong>{data.summary.healthy} из {data.summary.total}</strong></article><article><Unplug /><span>Ожидает настройки</span><strong>{data.summary.pending}</strong></article></div>
    <div className="system-status-grid">{data.components.map((item) => { const Icon = icons[item.key] || (item.status === 'ERROR' ? TriangleAlert : Unplug); return <article className={`system-status-card system-status-card--${item.status.toLowerCase()}`} key={item.key}><div><Icon size={25} /></div><section><span>{labels[item.status]}</span><h2>{item.label}</h2><p>{item.detail}</p></section></article>; })}</div>
    <div className="system-process"><span><Clock3 />Проверено: {new Date(data.checkedAt).toLocaleString('ru-RU')}</span><span><Activity />Аптайм: {Math.floor(data.process.uptimeSeconds / 60)} мин.</span><span><MemoryStick />Память: {data.process.memoryMb} МБ</span></div>
  </>;
}
