import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cake, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, CloudSun, Image as ImageIcon, Newspaper, PartyPopper, RefreshCw, WifiOff } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import PriorityNewsModal from '../../components/news/PriorityNewsModal.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localizedNews, newsCategoryLabel } from '../../utils/news.js';
import { formatCalendarDate, formatFullDate } from '../../utils/date.js';
import InteractiveNewsFeed from './InteractiveNewsFeed.jsx';
import DgdLogo from '../../components/common/DgdLogo.jsx';

const birthdayCopy = {
  ru: { eyebrow: 'Сегодня день рождения', prefix: 'Поздравляем', wishes: 'Желаем крепкого здоровья, благополучия, вдохновения и новых профессиональных успехов!' },
  kz: { eyebrow: 'Бүгін туған күн', prefix: 'Құттықтаймыз', wishes: 'Зор денсаулық, амандық, шабыт және жаңа кәсіби жетістіктер тілейміз!' },
};
function BroadcastScreen({ onOpenNews, dismissedPrioritySignature, dismissPriority, resetPriorityDismissal }) {
  const { language, setLanguage } = useLanguage();
  const [broadcast, setBroadcast] = useState(null); const [informer, setInformer] = useState(null); const [error, setError] = useState(''); const [offline, setOffline] = useState(false); const [index, setIndex] = useState(0); const [now, setNow] = useState(new Date());
  const [priorityModalOpen, setPriorityModalOpen] = useState(false); const [priorityIndex, setPriorityIndex] = useState(0);
  const load = useCallback(async () => { try { const response = await api.get('/broadcast'); const allSlides = response.data.data.slides; const regularSlides = allSlides.filter((slide) => !(slide.kind === 'NEWS' && slide.isPriority)); const slideCount = regularSlides.length || allSlides.length; setBroadcast(response.data.data); setOffline(Boolean(response.__fromCache)); setError(''); setIndex((current) => Math.min(current, Math.max(0, slideCount - 1))); } catch (err) { setError(apiMessage(err)); setOffline(true); } }, []);
  useEffect(() => { load(); const timer = setInterval(load, 60 * 1000); const reconnect = () => load(); window.addEventListener('online', reconnect); return () => { clearInterval(timer); window.removeEventListener('online', reconnect); }; }, [load]);
  useEffect(() => { const loadInformer = () => api.get('/news/informer').then((response) => setInformer(response.data.data)).catch(() => setInformer(null)); loadInformer(); const timer = setInterval(loadInformer, 60 * 60 * 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { setLanguage('kz', true); }, [setLanguage]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const priorityNews = useMemo(() => (broadcast?.slides || []).filter((slide) => slide.kind === 'NEWS' && slide.isPriority), [broadcast]);
  const regularSlides = useMemo(() => (broadcast?.slides || []).filter((slide) => !(slide.kind === 'NEWS' && slide.isPriority)), [broadcast]);
  const slides = regularSlides.length ? regularSlides : broadcast?.slides || []; const current = slides[index];
  const prioritySignature = priorityNews.map((entry) => `${entry.id}:${entry.updatedAt}:${entry.expiresAt}`).join('|');
  useEffect(() => { if (!prioritySignature) { setPriorityModalOpen(false); return; } if (prioritySignature === dismissedPrioritySignature) { setPriorityModalOpen(false); return; } setPriorityIndex(0); setPriorityModalOpen(true); }, [dismissedPrioritySignature, prioritySignature]);
  useEffect(() => {
    if (!prioritySignature || dismissedPrioritySignature !== prioritySignature) return undefined;
    const sessionSeconds = Math.max(1, broadcast?.settings?.broadcastIdleSeconds || 60);
    const timer = setTimeout(resetPriorityDismissal, sessionSeconds * 1000);
    return () => clearTimeout(timer);
  }, [broadcast?.settings?.broadcastIdleSeconds, dismissedPrioritySignature, prioritySignature, resetPriorityDismissal]);
  const currentId = current?.id;
  const advance = useCallback(() => setIndex((currentIndex) => slides.length ? (currentIndex + 1) % slides.length : 0), [slides.length]);
  const moveSlide = useCallback((direction) => {
    if (slides.length < 2) return;
    setLanguage('kz', true);
    setIndex((currentIndex) => (currentIndex + direction + slides.length) % slides.length);
  }, [setLanguage, slides.length]);
  useEffect(() => { if (currentId) setLanguage('kz', true); }, [currentId, setLanguage]);
  useEffect(() => { if (!current || current.kind === 'VIDEO') return undefined; const seconds = language === 'kz' ? broadcast.settings.broadcastLanguageSeconds : Math.max(5, broadcast.settings.broadcastSlideSeconds - broadcast.settings.broadcastLanguageSeconds); const timer = setTimeout(() => { if (language === 'kz') setLanguage('ru', true); else { setLanguage('kz', true); advance(); } }, seconds * 1000); return () => clearTimeout(timer); }, [advance, broadcast, current, language, setLanguage]);
  const item = useMemo(() => current?.kind === 'NEWS' ? localizedNews(current, language) : current ? { ...current, title: current[language === 'kz' ? 'titleKz' : 'titleRu'], description: current[language === 'kz' ? 'descriptionKz' : 'descriptionRu'] } : null, [current, language]);
  const locale = language === 'kz' ? 'kk-KZ' : 'ru-RU';
  const ticker = broadcast?.settings?.[language === 'kz' ? 'tickerTextKz' : 'tickerTextRu'];
  const tickerEntries = useMemo(() => {
    const entries = (informer?.rates || []).map((currency) => ({
      id: currency.code,
      kind: 'rate',
      code: currency.code,
      text: `1 = ${currency.rate.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸`,
    }));
    if (informer?.weather) {
      const weather = informer.weather;
      const temperature = `${weather.temperature > 0 ? '+' : ''}${Math.round(weather.temperature)} °C`;
      const feelsLike = `${weather.feelsLike > 0 ? '+' : ''}${Math.round(weather.feelsLike)} °C`;
      entries.push({
        id: 'weather', kind: 'weather',
        text: `${language === 'kz' ? weather.cityKz : weather.cityRu}: ${temperature}, ${weather.description?.[language] || ''}; ${language === 'kz' ? 'сезіледі' : 'ощущается'} ${feelsLike}`,
      });
      if (informer.source?.weather === 'Open-Meteo') entries.push({ id: 'weather-source', kind: 'source', text: `${language === 'kz' ? 'Ауа райы' : 'Погода'}: Open-Meteo` });
    }
    if (ticker) entries.push({ id: 'message', kind: 'message', text: ticker });
    return entries;
  }, [informer, language, locale, ticker]);
  if (!broadcast && !error) return <div className="broadcast-screen"><LoadingState text="Эфир жүктелуде…" /></div>;
  if (error || !item) return <div className="broadcast-screen"><ErrorState title="Эфир недоступен" text={error || 'Нет активных материалов'} onRetry={load} /></div>;
  const phaseSeconds = language === 'kz' ? broadcast.settings.broadcastLanguageSeconds : Math.max(5, broadcast.settings.broadcastSlideSeconds - broadcast.settings.broadcastLanguageSeconds);
  const finishVideo = () => { if (language === 'kz') setLanguage('ru', true); else { setLanguage('kz', true); advance(); } };
  return <main className={`broadcast-screen broadcast-screen--${item.kind.toLowerCase()}`}>
    <div className="broadcast-progress" key={`${item.id}-${language}`} style={{ '--duration': `${item.kind === 'VIDEO' ? 120 : phaseSeconds}s` }} />
    <DgdLogo className="broadcast-logo" decorative />
    <div className="broadcast-corner"><span>{language === 'kz' ? 'ҚАЗ' : 'РУС'}</span><strong>{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</strong></div>
    <time className="broadcast-datetime" dateTime={now.toISOString()}><CalendarDays size={20} /><span>{formatFullDate(now, language)}</span><Clock3 size={20} /><strong>{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</strong></time>
    {offline && <div className="broadcast-offline"><WifiOff size={16} />{language === 'kz' ? 'Сақталған эфир' : 'Сохранённый эфир'}</div>}
    <button type="button" className="broadcast-open-button" onClick={onOpenNews}><Newspaper size={18} />{language === 'kz' ? 'Жаңалықтарды ашу' : 'Открыть новости'}</button>
    {slides.length > 1 && <nav className="broadcast-slide-controls" aria-label={language === 'kz' ? 'Слайдтарды қолмен ауыстыру' : 'Ручное переключение слайдов'}><button type="button" onClick={() => moveSlide(-1)} aria-label={language === 'kz' ? 'Алдыңғы слайд' : 'Предыдущий слайд'}><ChevronLeft /></button><button type="button" onClick={() => moveSlide(1)} aria-label={language === 'kz' ? 'Келесі слайд' : 'Следующий слайд'}><ChevronRight /></button></nav>}
    {item.kind === 'VIDEO' || item.kind === 'IMAGE' ? <section className="broadcast-video-slide">{item.kind === 'IMAGE' ? <img src={assetUrl(item.mediaUrl)} alt="" onError={finishVideo} /> : <video key={`${item.mediaUrl}-${language}`} src={assetUrl(item.mediaUrl)} autoPlay muted playsInline onEnded={finishVideo} onError={finishVideo} />}<div className="broadcast-video-caption"><span>{item.kind === 'IMAGE' ? <ImageIcon size={18} /> : <RefreshCw size={18} />}{language === 'kz' ? item.kind === 'IMAGE' ? 'Фотоматериал' : 'Бейнематериал' : item.kind === 'IMAGE' ? 'Фотоматериал' : 'Видеоматериал'}</span><h1>{item.title}</h1><p>{item.description}</p></div></section>
      : item.kind === 'BIRTHDAY' ? <section className={`birthday-slide ${item.mediaUrl ? 'birthday-slide--with-image' : ''}`}>{item.mediaUrl && <img className="birthday-slide__background" src={assetUrl(item.mediaUrl)} alt="" />}<div className="birthday-slide__decor"><PartyPopper /><Cake /></div><div className="birthday-slide__content"><span>{birthdayCopy[language].eyebrow}</span><p>{birthdayCopy[language].prefix}</p><h1>{item.title}</h1><div>{item.description}</div><strong>{birthdayCopy[language].wishes}</strong></div></section>
        : <section className="broadcast-news-slide"><div className="broadcast-news-slide__copy"><div className="broadcast-news-slide__meta"><span><Newspaper size={18} />{newsCategoryLabel(item.category, language)}</span><time><CalendarDays size={17} />{formatCalendarDate(item.publishedAt || item.createdAt, language)}</time></div><h1>{item.title}</h1><p className="broadcast-news-slide__lead">{item.description}</p><div className="broadcast-news-slide__body">{item.content.split(/\n{2,}/).slice(0, 4).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div></div><div className="broadcast-news-slide__visual">{item.image ? <img src={assetUrl(item.image)} alt="" /> : <span className="broadcast-news-slide__placeholder"><ImageIcon size={90} /></span>}</div></section>}
    <div className="broadcast-ticker"><span className="broadcast-ticker__label"><CircleDollarSign size={20} />{language === 'kz' ? 'БАҒАМ ЖӘНЕ АУА РАЙЫ' : 'КУРСЫ И ПОГОДА'}</span><div><p>{[0, 1, 2].map((copyIndex) => <span className="broadcast-ticker__sequence" key={copyIndex}>{tickerEntries.map((entry) => <span className={`broadcast-ticker__entry broadcast-ticker__entry--${entry.kind}`} key={entry.id}>{entry.kind === 'rate' && <b>{entry.code}</b>}{entry.kind === 'weather' && <CloudSun size={21} />}{entry.text}<i>•</i></span>)}</span>)}</p></div></div>
    {priorityModalOpen && <PriorityNewsModal news={priorityNews[priorityIndex]} language={language} broadcast current={priorityIndex + 1} total={priorityNews.length} onNext={priorityIndex + 1 < priorityNews.length ? () => setPriorityIndex((currentIndex) => currentIndex + 1) : undefined} onClose={() => { dismissPriority(prioritySignature); setPriorityModalOpen(false); }} />}
  </main>;
}

export default function NewsListPage() {
  const { interactive, activateInteractive, dismissedPrioritySignature, dismissPriority, resetPriorityDismissal } = useOutletContext();
  return interactive
    ? <InteractiveNewsFeed dismissedPrioritySignature={dismissedPrioritySignature} dismissPriority={dismissPriority} />
    : <BroadcastScreen onOpenNews={activateInteractive} dismissedPrioritySignature={dismissedPrioritySignature} dismissPriority={dismissPriority} resetPriorityDismissal={resetPriorityDismissal} />;
}
