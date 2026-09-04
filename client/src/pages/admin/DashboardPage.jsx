import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight, BarChart3, BookOpenCheck, Boxes, CalendarDays, Eye, EyeOff, Flame, MonitorSmartphone,
  Newspaper, PackageOpen, QrCode, Search, Settings, ShieldCheck, Tv, UserRoundCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const statConfig = [
  ['services', 'Всего услуг', BookOpenCheck, 'blue'], ['categories', 'Категории', Boxes, 'cyan'], ['published', 'Опубликовано', Eye, 'green'],
  ['hidden', 'Скрыто', EyeOff, 'orange'], ['searches', 'Поисковых запросов', Search, 'violet'], ['opens', 'Открытий услуг', BarChart3, 'navy'],
];

const kioskActions = [
  ['/admin/services', 'Услуги', 'Добавлять и редактировать карточки', 'Қызметтер', 'Карточкаларды қосу және өңдеу', BookOpenCheck],
  ['/admin/categories', 'Категории', 'Настроить разделы каталога', 'Санаттар', 'Каталог бөлімдерін баптау', Boxes],
  ['/admin/packages', 'Пакеты', 'Сгруппировать связанные услуги', 'Пакеттер', 'Байланысты қызметтерді топтау', PackageOpen],
  ['/admin/settings', 'Настройки', 'Контакты и справочные разделы', 'Баптаулар', 'Байланыстар мен анықтамалық бөлімдер', Settings],
];

const safetyActions = [
  ['/admin/ethics', 'Уполномоченный по этике', 'Изменить имя, контакты и фотографию', 'Әдеп жөніндегі уәкіл', 'Аты-жөнін, байланыстарын және фотосуретін өзгерту', UserRoundCheck],
  ['/admin/fire-safety', 'Пожарная инструкция', 'Настроить памятку, предупреждение и видео', 'Өрт қауіпсіздігі нұсқаулығы', 'Жаднаманы, ескертуді және бейнені баптау', Flame],
];

const receptionActions = [
  ['/admin/reception/schedule', 'График приёма', 'Изменить дни, время, адреса и должности', 'Қабылдау кестесі', 'Күндерін, уақытын, мекенжайларын және лауазымдарын өзгерту', CalendarDays],
  ['/admin/reception/qr', 'QR-коды', 'Районные управления и таможенные посты', 'QR-кодтар', 'Аудандық басқармалар және кеден бекеттері', QrCode],
];

const newsActions = [
  ['/admin/news', 'Новости', 'Создавать и публиковать материалы', 'Жаңалықтар', 'Материалдарды жасау және жариялау', Newspaper],
  ['/admin/broadcast', 'Эфир', 'Управлять слайдами и бегущей строкой', 'Эфир', 'Слайдтар мен жүгіртпе жолды басқару', Tv],
];

function WorkspaceCard({ type, eyebrow, eyebrowKz, title, titleKz, description, descriptionKz, icon: Icon, metrics, actions, preview, previewLabel, previewLabelKz }) {
  const { locale, tr } = useAdminI18n();
  return <article className={`admin-workspace-card admin-workspace-card--${type}`}>
    <header><span className="admin-workspace-card__icon"><Icon size={30} /></span><div><small>{tr(eyebrow, eyebrowKz)}</small><h2>{tr(title, titleKz)}</h2><p>{tr(description, descriptionKz)}</p></div></header>
    {metrics?.length > 0 && <div className="admin-workspace-card__metrics">{metrics.map(([value, label, labelKz]) => <div key={label}><strong>{Number(value || 0).toLocaleString(locale)}</strong><span>{tr(label, labelKz)}</span></div>)}</div>}
    <nav>{actions.map(([to, label, descriptionRu, labelKz, descriptionKz, ActionIcon]) => <Link to={to} key={to}><span className="admin-workspace-action__icon"><ActionIcon size={21} /></span><span><strong>{tr(label, labelKz)}</strong><small>{tr(descriptionRu, descriptionKz)}</small></span><ArrowRight size={18} /></Link>)}</nav>
    <a className="admin-workspace-card__preview" href={preview} target="_blank" rel="noreferrer"><Eye size={18} />{tr(previewLabel, previewLabelKz)}</a>
  </article>;
}

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
    <AdminPageHeader eyebrow="Начало работы" eyebrowKz="Жұмыстың басталуы" title="Что вы хотите изменить?" titleKz="Нені өзгерткіңіз келеді?" description="Нужные настройки вынесены в отдельные понятные разделы" descriptionKz="Қажетті баптаулар бөлек түсінікті бөлімдерге шығарылды" />
    <section className="admin-workspace-cards" aria-label={tr('Разделы управления', 'Басқару бөлімдері')}>
      <WorkspaceCard type="safety" eyebrow="Сначала здесь" eyebrowKz="Алдымен осында" title="Этика и пожарная безопасность" titleKz="Әдеп және өрт қауіпсіздігі" description="Две отдельные кнопки для самых важных инструкций." descriptionKz="Ең маңызды нұсқаулықтарға арналған екі бөлек батырма." icon={ShieldCheck} metrics={[]} actions={safetyActions} preview="/information/ethics-fire-safety" previewLabel="Посмотреть страницу инфокиоска" previewLabelKz="Инфокиоск бетін көру" />
      <WorkspaceCard type="reception" eyebrow="Раздел 2" eyebrowKz="2-бөлім" title="Приём граждан" titleKz="Азаматтарды қабылдау" description="График руководства, QR-коды районных управлений и таможенных постов." descriptionKz="Басшылық кестесі, аудандық басқармалар мен кеден бекеттерінің QR-кодтары." icon={CalendarDays} metrics={[]} actions={receptionActions} preview="/information/reception-schedule" previewLabel="Посмотреть страницу инфокиоска" previewLabelKz="Инфокиоск бетін көру" />
      <WorkspaceCard type="kiosk" eyebrow="Раздел 3" eyebrowKz="3-бөлім" title="Инфокиоск" titleKz="Инфокиоск" description="Услуги и справочная информация, которую посетитель ищет самостоятельно." descriptionKz="Келуші өз бетінше іздейтін қызметтер мен анықтамалық ақпарат." icon={MonitorSmartphone} metrics={[[data.counts.services, 'услуг', 'қызмет'], [data.counts.categories, 'категорий', 'санат'], [data.counts.published, 'опубликовано', 'жарияланған']]} actions={kioskActions} preview="/kiosk" previewLabel="Посмотреть инфокиоск" previewLabelKz="Инфокиоскіні көру" />
      <WorkspaceCard type="news" eyebrow="Раздел 4" eyebrowKz="4-бөлім" title="Новостная лента" titleKz="Жаңалықтар таспасы" description="Публикации для посетителей и полноэкранный информационный эфир." descriptionKz="Келушілерге арналған жарияланымдар және толық экранды ақпараттық эфир." icon={Newspaper} metrics={[[data.counts.news, 'новостей', 'жаңалық'], [data.counts.publishedNews, 'опубликовано', 'жарияланған'], [data.counts.broadcastMaterials, 'материалов в эфире', 'эфирдегі материал']]} actions={newsActions} preview="/news" previewLabel="Посмотреть новостную ленту" previewLabelKz="Жаңалықтар таспасын көру" />
    </section>

    <div className="admin-section-title"><span>{tr('Общая сводка', 'Жалпы жиынтық')}</span><h2>{tr('Как используется инфокиоск', 'Инфокиоск қалай пайдаланылады')}</h2></div>
    <div className="stat-grid">{statConfig.map(([key, label, Icon, color]) => <article className={`stat-card stat-card--${color}`} key={key}><div><span>{tr(label, { services: 'Барлық қызметтер', categories: 'Санаттар', published: 'Жарияланған', hidden: 'Жасырын', searches: 'Іздеу сұраулары', opens: 'Қызметті ашу' }[key])}</span><strong>{data.counts[key].toLocaleString(locale)}</strong></div><Icon size={27} /></article>)}</div>
    <div className="dashboard-grid">
      <section className="admin-card chart-card"><header><div><span>{tr('Активность', 'Белсенділік')}</span><h2>{tr('События за 7 дней', '7 күндегі оқиғалар')}</h2></div></header><div className="bar-chart">{data.daily.length ? data.daily.map((item) => <div className="bar-chart__item" key={item.day}><span>{item.count}</span><i style={{ height: `${Math.max(8, item.count / max * 100)}%` }} /><small>{new Date(item.day).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</small></div>) : <p>{tr('Событий пока нет', 'Әзірге оқиғалар жоқ')}</p>}</div></section>
      <section className="admin-card"><header><div><span>{tr('Интерес посетителей', 'Келушілер қызығушылығы')}</span><h2>{tr('Популярные услуги', 'Танымал қызметтер')}</h2></div></header><ol className="rank-list">{data.popularServices.length ? data.popularServices.map((item, index) => <li key={item.id}><span>{index + 1}</span><strong>{item[language === 'kz' ? 'titleKz' : 'titleRu']}</strong><em>{item.count}</em></li>) : <li className="empty-row">{tr('Данных пока нет', 'Әзірге деректер жоқ')}</li>}</ol></section>
    </div>
  </>;
}
