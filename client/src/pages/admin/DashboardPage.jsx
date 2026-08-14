import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, BookOpenCheck, Boxes, Eye, EyeOff, Newspaper, PackageOpen, Search, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const statConfig = [
  ['services', 'Всего услуг', BookOpenCheck, 'blue'], ['categories', 'Категории', Boxes, 'cyan'], ['published', 'Опубликовано', Eye, 'green'],
  ['hidden', 'Скрыто', EyeOff, 'orange'], ['searches', 'Поисковых запросов', Search, 'violet'], ['opens', 'Открытий услуг', BarChart3, 'navy'],
];
const quickLinks = [
  ['/admin/services', 'Услуги', BookOpenCheck], ['/admin/categories', 'Категории', Boxes], ['/admin/packages', 'Пакеты', PackageOpen],
  ['/admin/news', 'Новости', Newspaper], ['/admin/broadcast', 'Эфир', Tv], ['/admin/system-status', 'Состояние системы', Activity],
];

export default function DashboardPage() {
  const { language, locale, tr } = useAdminI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const response = await api.get('/admin/dashboard'); setData(response.data.data); } catch (err) { setError(apiMessage(err)); } }, []);
  useEffect(() => { load(); }, [load]);
  if (!data && !error) return <LoadingState text={tr('Загрузка показателей…', 'Көрсеткіштер жүктелуде…')} />;
  if (error) return <ErrorState title={tr('Не удалось загрузить обзор', 'Шолуды жүктеу мүмкін болмады')} text={error} onRetry={load} />;
  const max = Math.max(...data.daily.map((item) => item.count), 1);
  return <>
    <AdminPageHeader eyebrow="Сводка" eyebrowKz="Жиынтық" title="Обзор системы" titleKz="Жүйеге шолу" description="Ключевые показатели и быстрый доступ к управлению инфокиоском" descriptionKz="Негізгі көрсеткіштер және инфокиоскіні басқаруға жылдам қол жеткізу" />
    <nav className="admin-quick-links">{quickLinks.map(([to, label, Icon]) => <Link to={to} key={to}><Icon size={20} /><span>{tr(label)}</span></Link>)}</nav>
    <div className="stat-grid">{statConfig.map(([key, label, Icon, color]) => <article className={`stat-card stat-card--${color}`} key={key}><div><span>{tr(label, { services: 'Барлық қызметтер', categories: 'Санаттар', published: 'Жарияланған', hidden: 'Жасырын', searches: 'Іздеу сұраулары', opens: 'Қызметті ашу' }[key])}</span><strong>{data.counts[key].toLocaleString(locale)}</strong></div><Icon size={27} /></article>)}</div>
    <div className="dashboard-grid">
      <section className="admin-card chart-card"><header><div><span>{tr('Активность', 'Белсенділік')}</span><h2>{tr('События за 7 дней', '7 күндегі оқиғалар')}</h2></div></header><div className="bar-chart">{data.daily.length ? data.daily.map((item) => <div className="bar-chart__item" key={item.day}><span>{item.count}</span><i style={{ height: `${Math.max(8, item.count / max * 100)}%` }} /><small>{new Date(item.day).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</small></div>) : <p>{tr('Событий пока нет', 'Әзірге оқиғалар жоқ')}</p>}</div></section>
      <section className="admin-card"><header><div><span>{tr('Интерес посетителей', 'Келушілер қызығушылығы')}</span><h2>{tr('Популярные услуги', 'Танымал қызметтер')}</h2></div></header><ol className="rank-list">{data.popularServices.length ? data.popularServices.map((item, index) => <li key={item.id}><span>{index + 1}</span><strong>{item[language === 'kz' ? 'titleKz' : 'titleRu']}</strong><em>{item.count}</em></li>) : <li className="empty-row">{tr('Данных пока нет', 'Әзірге деректер жоқ')}</li>}</ol></section>
      <section className="admin-card admin-card--wide"><header><div><span>{tr('Безопасность', 'Қауіпсіздік')}</span><h2>{tr('Последние действия', 'Соңғы әрекеттер')}</h2></div></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{tr('Сотрудник')}</th><th>{tr('Действие')}</th><th>{tr('Объект')}</th><th>{tr('Время', 'Уақыт')}</th></tr></thead><tbody>{data.recentAudit.map((item) => <tr key={item.id}><td>{item.adminUser.fullName}</td><td><span className="status-pill status-pill--neutral">{tr(item.action)}</span></td><td>{tr(item.entityType) || '—'} {item.entityId || ''}</td><td>{new Date(item.createdAt).toLocaleString(locale)}</td></tr>)}</tbody></table></div></section>
    </div>
  </>;
}
