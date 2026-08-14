import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Database, HardDrive, MemoryStick, RefreshCw, Server, TriangleAlert, Unplug } from 'lucide-react';
import api, { apiMessage } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const icons = { backend: Server, database: Database, storage: HardDrive };
const labels = { ONLINE: 'Работает', ERROR: 'Ошибка', NOT_CONFIGURED: 'Ожидает интеграции' };

export default function SystemStatusPage() {
  const { locale, tr } = useAdminI18n();
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
  if (!data && !error) return <LoadingState text={tr('Проверяем систему…', 'Жүйе тексерілуде…')} />;
  if (!data && error) return <ErrorState title={tr('Мониторинг недоступен', 'Мониторинг қолжетімсіз')} text={error} onRetry={load} />;
  return <>
    <AdminPageHeader eyebrow="Мониторинг" eyebrowKz="Мониторинг" title="Состояние системы" titleKz="Жүйе күйі" description="Реальный статус приложения, базы, файлов и будущих интеграций" descriptionKz="Қолданбаның, дерекқордың, файлдардың және болашақ интеграциялардың нақты күйі" actions={<button className="admin-button admin-button--secondary" onClick={() => load()} disabled={refreshing}><RefreshCw className={refreshing ? 'is-spinning' : ''} size={18} />{tr('Обновить')}</button>} />
    {error && <div className="form-error">{tr(error)}</div>}
    <div className="system-summary"><article><Activity /><span>{tr('Общий статус', 'Жалпы күй')}</span><strong>{data.overall === 'ONLINE' ? tr('Система работает', 'Жүйе жұмыс істейді') : tr('Требует внимания', 'Назар аударуды қажет етеді')}</strong></article><article><CheckCircle2 /><span>{tr('Доступно', 'Қолжетімді')}</span><strong>{data.summary.healthy} {tr('из', 'ішінен')} {data.summary.total}</strong></article><article><Unplug /><span>{tr('Ожидает настройки', 'Баптауды күтуде')}</span><strong>{data.summary.pending}</strong></article></div>
    <div className="system-status-grid">{data.components.map((item) => { const Icon = icons[item.key] || (item.status === 'ERROR' ? TriangleAlert : Unplug); return <article className={`system-status-card system-status-card--${item.status.toLowerCase()}`} key={item.key}><div><Icon size={25} /></div><section><span>{tr(labels[item.status])}</span><h2>{tr(item.label, { backend: 'Backend сервері', database: 'PostgreSQL дерекқоры', storage: 'Файл қоймасы', nomad: 'NOMAD / электрондық кезек', printer: 'Принтер және сканер', tv1: '№1 зал экраны', tv2: '№2 зал экраны' }[item.key])}</h2><p>{item.detail}</p></section></article>; })}</div>
    <div className="system-process"><span><Clock3 />{tr('Проверено', 'Тексерілді')}: {new Date(data.checkedAt).toLocaleString(locale)}</span><span><Activity />{tr('Аптайм', 'Жұмыс уақыты')}: {Math.floor(data.process.uptimeSeconds / 60)} {tr('мин.', 'мин.')}</span><span><MemoryStick />{tr('Память', 'Жад')}: {data.process.memoryMb} МБ</span></div>
  </>;
}
