import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Building2, CalendarClock, ChevronRight, CircleHelp, ClipboardList, Headphones, MapPin, Phone, RotateCcw, Scale, UserRoundCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import { endSession } from '../../api/analytics.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { localized } from '../../utils/localization.js';
import { useServiceSearch } from '../../hooks/useServiceSearch.js';
import SearchBar from '../../components/kiosk/SearchBar.jsx';
import CategoryCard from '../../components/kiosk/CategoryCard.jsx';
import ServiceCard from '../../components/kiosk/ServiceCard.jsx';
import SearchSuggestions from '../../components/common/SearchSuggestions.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';

function ContentScrollButton({ language }) {
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const update = () => setAtEnd(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  const move = () => {
    if (atEnd) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const next = [...document.querySelectorAll('[data-home-scroll-section]')].find((section) => section.getBoundingClientRect().top > 130);
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };
  const label = atEnd
    ? language === 'kz' ? 'Беттің басына оралу' : 'Вернуться в начало страницы'
    : language === 'kz' ? 'Келесі бөлімге өту' : 'Перейти к следующему разделу';
  return <button type="button" className={`content-scroll-button${atEnd ? ' is-up' : ''}`} onClick={move} aria-label={label} title={label}>{atEnd ? <ArrowUp /> : <ArrowDown />}</button>;
}

export default function HomePage() {
  const { language, t, resetLanguage } = useLanguage(); const { resetFontSize } = useFontSize(); const { settings } = useSettings();
  const [categories, setCategories] = useState([]); const [popular, setPopular] = useState([]); const [servicesTotal, setServicesTotal] = useState(0); const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [helpOpen, setHelpOpen] = useState(false); const [helpSettings, setHelpSettings] = useState(null);
  const search = useServiceSearch(query, language);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [categoriesResponse, popularResponse, servicesResponse] = await Promise.all([api.get('/categories'), api.get('/services/popular'), api.get('/services', { params: { page: 1, limit: 1 } })]); setCategories(categoriesResponse.data.data); setPopular(popularResponse.data.data); setServicesTotal(servicesResponse.data.meta?.total || 0); }
    catch (err) { setError(apiMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const reset = () => { setQuery(''); resetLanguage(); resetFontSize(); endSession('SESSION_RESET'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openHelp = async () => {
    try { const response = await api.get('/settings/public'); setHelpSettings(response.data.data); }
    catch { setHelpSettings(settings); }
    setHelpOpen(true);
  };
  if (loading) return <LoadingState text={t.loading} />;
  if (error) return <ErrorState title={t.unavailableTitle} text={t.unavailableText} onRetry={load} retryText={t.retry} />;
  const searching = query.trim().length >= 2;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadlines = (settings.reportingDeadlines || []).filter((item) => item.isActive).map((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return { ...item, date, days: Math.ceil((date - today) / 86400000) };
  }).filter((item) => item.days >= 0).sort((a, b) => a.date - b.date).slice(0, 6);
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const specialists = (settings.onlineSpecialists || []).filter((item) => item.isActive && item.workDate === localDate);
  return <>
    <section className="hero-section">
      <h1>{t.question}</h1><p>{t.subtitle}</p><SearchBar value={query} onChange={setQuery} />
    </section>
    {specialists.length > 0 && <aside className="kiosk-specialists-float" aria-label={language === 'kz' ? 'Бүгін онлайн мамандар' : 'Специалисты онлайн сегодня'}>
      <header><UserRoundCheck size={20} /><span>{language === 'kz' ? 'Бүгін онлайн' : 'Сегодня онлайн'}</span></header>
      {specialists.slice(0, 2).map((specialist) => <article key={specialist.id}>
        {specialist.photo ? <img src={assetUrl(specialist.photo)} alt="" /> : <span className="kiosk-specialists-float__placeholder"><UserRoundCheck size={28} /></span>}
        <div><strong>{specialist[language === 'kz' ? 'nameKz' : 'nameRu']}</strong><span>{specialist[language === 'kz' ? 'categoryKz' : 'categoryRu']}</span><small>{specialist[language === 'kz' ? 'servicesKz' : 'servicesRu']}</small></div>
      </article>)}
    </aside>}
    {searching ? <section className="content-section"><div className="section-heading"><div><span>{t.searchResults}</span><h2>{t.servicesFound}: {search.results.length}</h2></div></div>
      {search.loading ? <LoadingState text={t.loading} /> : search.error ? <ErrorState title={t.unavailableTitle} text={search.error} /> : search.results.length ? <div className="service-grid">{search.results.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <><SearchSuggestions suggestions={search.suggestions} onSelect={setQuery} /><EmptyState text={t.noResults} /></>}
    </section> : <>
      <ContentScrollButton language={language} />
      <section className="content-section content-section--home" data-home-scroll-section><div className="section-heading"><div><span>01</span><h2>{t.popular}</h2></div><small>{popular.length}</small></div>{popular.length ? <div className="service-grid">{popular.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <EmptyState text={t.noServices} />}</section>
      <section className="content-section content-section--packages service-entry-section" data-home-scroll-section><div className="section-heading"><div><span>02</span><h2>{language === 'kz' ? 'Қызметтерді таңдаңыз' : 'Выберите нужные услуги'}</h2></div></div><div className="service-entry-grid">
        <Link className="service-entry-card service-entry-card--ugd" to="/packages"><span><Building2 size={42} /></span><div><small>{language === 'kz' ? 'Өмірлік жағдайлар бойынша' : 'По жизненным ситуациям'}</small><h3>{t.servicePackages}</h3><p>{language === 'kz' ? 'Қажетті қызметтер бір түсінікті бөлімде жинақталған.' : 'Необходимые услуги собраны в одном понятном разделе.'}</p></div><ChevronRight /></Link>
        <Link className="service-entry-card" to="/services"><span><ClipboardList size={42} /></span><div><small>{language === 'kz' ? `${servicesTotal} мемлекеттік қызмет` : `${servicesTotal} государственных услуг`}</small><h3>{t.governmentServicesList}</h3><p>{language === 'kz' ? 'МКД көрсететін барлық мемлекеттік қызметтердің толық тізімі.' : 'Полный список государственных услуг, оказываемых органами государственных доходов.'}</p></div><ChevronRight /></Link>
      </div></section>
      <section className="content-section content-section--tinted" data-home-scroll-section><div className="section-heading"><div><span>03</span><h2>{t.categories}</h2></div><small>{categories.length}</small></div><div className="category-grid">{categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>
      <section className="content-section information-section" data-home-scroll-section><div className="section-heading"><div><span>04</span><h2>{t.usefulInformation}</h2></div></div><div className="information-grid">
        <Link className="information-card" to="/information/taxpayer-rights"><span><Scale size={34} /></span><h3>{t.taxpayerRights}</h3><ChevronRight /></Link>
        <Link className="information-card information-card--faq" to="/faq"><span><CircleHelp size={36} /></span><div><small>{language === 'kz' ? '9 сұрақ пен жауап' : '9 вопросов и ответов'}</small><h3>{language === 'kz' ? 'Жиі қойылатын сұрақтар' : 'Частые вопросы'}</h3></div><ChevronRight /></Link>
      </div></section>
      {deadlines.length > 0 && <section className="content-section content-section--tinted deadline-section" data-home-scroll-section><div className="section-heading"><div><span>05</span><h2>{t.deadlines}</h2></div><CalendarClock size={36} /></div><div className="deadline-grid">{deadlines.map((item) => <article className="deadline-card" key={item.id}><time dateTime={item.date.toISOString()}>{item.date.toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</time><h3>{item[language === 'kz' ? 'titleKz' : 'titleRu']}</h3><strong>{item.days === 0 ? t.deadlineToday : `${item.days} ${t.daysLeft}`}</strong></article>)}</div></section>}
    </>}
    <section className="contact-strip">
      <div><Phone size={30} /><span>{t.contactCenter}<strong>{settings.contactPhone}</strong></span></div>
      <div><MapPin size={30} /><span>{t.office}<strong>{localized(settings, 'address', language)}</strong></span></div>
      <button className="button button--light" onClick={openHelp}><Headphones size={26} />{t.help}</button>
      <button className="button button--outline-light" onClick={reset}><RotateCcw size={25} />{t.reset}</button>
    </section>
    {helpOpen && <div className="modal-backdrop"><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Закрыть"><X /></button><div className="help-modal__icon"><Headphones size={44} /></div><h2 id="help-title">{t.help}</h2><p>{t.contactCenter}</p><strong>{(helpSettings || settings).contactPhone}</strong><p>{localized(helpSettings || settings, 'workingHours', language)}</p><button className="button button--primary" onClick={() => setHelpOpen(false)}>{t.continue}</button></section></div>}
  </>;
}
