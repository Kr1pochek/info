import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, BookOpenCheck, Boxes, Eye, EyeOff, Newspaper, PackageOpen, Search, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';

const statConfig = [
  ['services', 'Всего услуг', BookOpenCheck, 'blue'], ['categories', 'Категории', Boxes, 'cyan'], ['published', 'Опубликовано', Eye, 'green'],
  ['hidden', 'Скрыто', EyeOff, 'orange'], ['searches', 'Поисковых запросов', Search, 'violet'], ['opens', 'Открытий услуг', BarChart3, 'navy'],
];
const quickLinks = [
  ['/admin/services', 'Услуги', BookOpenCheck], ['/admin/categories', 'Категории', Boxes], ['/admin/packages', 'Пакеты', PackageOpen],
  ['/admin/news', 'Новости', Newspaper], ['/admin/broadcast', 'Эфир', Tv], ['/admin/system-status', 'Состояние системы', Activity],
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const response = await api.get('/admin/dashboard'); setData(response.data.data); } catch (err) { setError(apiMessage(err)); } }, []);
  useEffect(() => { load(); }, [load]);
  if (!data && !error) return <LoadingState text="Загрузка показателей…" />;
  if (error) return <ErrorState title="Не удалось загрузить обзор" text={error} onRetry={load} />;
  const max = Math.max(...data.daily.map((item) => item.count), 1);
  return <>
    <AdminPageHeader eyebrow="Сводка" title="Обзор системы" description="Ключевые показатели и быстрый доступ к управлению инфокиоском" />
    <nav className="admin-quick-links">{quickLinks.map(([to, label, Icon]) => <Link to={to} key={to}><Icon size={20} /><span>{label}</span></Link>)}</nav>
    <div className="stat-grid">{statConfig.map(([key, label, Icon, color]) => <article className={`stat-card stat-card--${color}`} key={key}><div><span>{label}</span><strong>{data.counts[key].toLocaleString('ru-RU')}</strong></div><Icon size={27} /></article>)}</div>
    <div className="dashboard-grid">
      <section className="admin-card chart-card"><header><div><span>Активность</span><h2>События за 7 дней</h2></div></header><div className="bar-chart">{data.daily.length ? data.daily.map((item) => <div className="bar-chart__item" key={item.day}><span>{item.count}</span><i style={{ height: `${Math.max(8, item.count / max * 100)}%` }} /><small>{new Date(item.day).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</small></div>) : <p>Событий пока нет</p>}</div></section>
      <section className="admin-card"><header><div><span>Интерес посетителей</span><h2>Популярные услуги</h2></div></header><ol className="rank-list">{data.popularServices.length ? data.popularServices.map((item, index) => <li key={item.id}><span>{index + 1}</span><strong>{item.titleRu}</strong><em>{item.count}</em></li>) : <li className="empty-row">Данных пока нет</li>}</ol></section>
      <section className="admin-card admin-card--wide"><header><div><span>Безопасность</span><h2>Последние действия</h2></div></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Сотрудник</th><th>Действие</th><th>Объект</th><th>Время</th></tr></thead><tbody>{data.recentAudit.map((item) => <tr key={item.id}><td>{item.adminUser.fullName}</td><td><span className="status-pill status-pill--neutral">{item.action}</span></td><td>{item.entityType || '—'} {item.entityId || ''}</td><td>{new Date(item.createdAt).toLocaleString('ru-RU')}</td></tr>)}</tbody></table></div></section>
    </div>
  </>;
}
