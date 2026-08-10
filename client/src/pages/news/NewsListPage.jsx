import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cake, CalendarDays, CircleDollarSign, Image as ImageIcon, Megaphone, Newspaper, PartyPopper, RefreshCw, WifiOff } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localizedNews, newsCategoryLabel } from '../../utils/news.js';
import InteractiveNewsFeed from './InteractiveNewsFeed.jsx';

const birthdayCopy = {
  ru: { eyebrow: 'Сегодня день рождения', prefix: 'Поздравляем', wishes: 'Желаем крепкого здоровья, благополучия, вдохновения и новых профессиональных успехов!' },
  kz: { eyebrow: 'Бүгін туған күн', prefix: 'Құттықтаймыз', wishes: 'Зор денсаулық, амандық, шабыт және жаңа кәсіби жетістіктер тілейміз!' },
};

function BroadcastScreen({ onOpenNews }) {
  const { language, setLanguage } = useLanguage();
  const [broadcast, setBroadcast] = useState(null); const [rate, setRate] = useState(null); const [error, setError] = useState(''); const [offline, setOffline] = useState(false); const [index, setIndex] = useState(0);
  const load = useCallback(async () => { try { const response = await api.get('/broadcast'); setBroadcast(response.data.data); setOffline(Boolean(response.__fromCache)); setError(''); setIndex((current) => Math.min(current, Math.max(0, response.data.data.slides.length - 1))); } catch (err) { setError(apiMessage(err)); setOffline(true); } }, []);
  useEffect(() => { load(); const timer = setInterval(load, 60 * 1000); const reconnect = () => load(); window.addEventListener('online', reconnect); return () => { clearInterval(timer); window.removeEventListener('online', reconnect); }; }, [load]);
  useEffect(() => { api.get('/exchange-rates/usd-kzt').then((response) => setRate(response.data.data)).catch(() => setRate(null)); }, []);
  useEffect(() => { setLanguage('kz', true); }, [setLanguage]);
  const slides = broadcast?.slides || []; const current = slides[index];
  const currentId = current?.id;
  const advance = useCallback(() => setIndex((currentIndex) => slides.length ? (currentIndex + 1) % slides.length : 0), [slides.length]);
  useEffect(() => { if (currentId) setLanguage('kz', true); }, [currentId, setLanguage]);
  useEffect(() => { if (!current || current.kind === 'VIDEO') return undefined; const seconds = language === 'kz' ? broadcast.settings.broadcastLanguageSeconds : Math.max(5, broadcast.settings.broadcastSlideSeconds - broadcast.settings.broadcastLanguageSeconds); const timer = setTimeout(() => { if (language === 'kz') setLanguage('ru', true); else { setLanguage('kz', true); advance(); } }, seconds * 1000); return () => clearTimeout(timer); }, [advance, broadcast, current, language, setLanguage]);
  const item = useMemo(() => current?.kind === 'NEWS' ? localizedNews(current, language) : current ? { ...current, title: current[language === 'kz' ? 'titleKz' : 'titleRu'], description: current[language === 'kz' ? 'descriptionKz' : 'descriptionRu'] } : null, [current, language]);
  if (!broadcast && !error) return <div className="broadcast-screen"><LoadingState text="Эфир жүктелуде…" /></div>;
  if (error || !item) return <div className="broadcast-screen"><ErrorState title="Эфир недоступен" text={error || 'Нет активных материалов'} onRetry={load} /></div>;
  const ticker = broadcast.settings[language === 'kz' ? 'tickerTextKz' : 'tickerTextRu'];
  const locale = language === 'kz' ? 'kk-KZ' : 'ru-RU';
  const phaseSeconds = language === 'kz' ? broadcast.settings.broadcastLanguageSeconds : Math.max(5, broadcast.settings.broadcastSlideSeconds - broadcast.settings.broadcastLanguageSeconds);
  const finishVideo = () => { if (language === 'kz') setLanguage('ru', true); else { setLanguage('kz', true); advance(); } };
  return <main className={`broadcast-screen broadcast-screen--${item.kind.toLowerCase()}`}>
    <div className="broadcast-progress" key={`${item.id}-${language}`} style={{ '--duration': `${item.kind === 'VIDEO' ? 120 : phaseSeconds}s` }} />
    <div className="broadcast-corner"><span>{language === 'kz' ? 'ҚАЗ' : 'РУС'}</span><strong>{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</strong></div>
    {offline && <div className="broadcast-offline"><WifiOff size={16} />{language === 'kz' ? 'Сақталған эфир' : 'Сохранённый эфир'}</div>}
    {rate && <div className="broadcast-rate"><CircleDollarSign /><span>USD / KZT</span><strong>{rate.rate.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸</strong></div>}
    <button type="button" className={`broadcast-open-button ${rate ? 'broadcast-open-button--with-rate' : ''}`} onClick={onOpenNews}><Newspaper size={18} />{language === 'kz' ? 'Жаңалықтарды ашу' : 'Открыть новости'}</button>
    {item.kind === 'VIDEO' || item.kind === 'IMAGE' ? <section className="broadcast-video-slide">{item.kind === 'IMAGE' ? <img src={assetUrl(item.mediaUrl)} alt="" onError={finishVideo} /> : <video key={`${item.mediaUrl}-${language}`} src={assetUrl(item.mediaUrl)} autoPlay muted playsInline onEnded={finishVideo} onError={finishVideo} />}<div className="broadcast-video-caption"><span>{item.kind === 'IMAGE' ? <ImageIcon size={18} /> : <RefreshCw size={18} />}{language === 'kz' ? item.kind === 'IMAGE' ? 'Фотоматериал' : 'Бейнематериал' : item.kind === 'IMAGE' ? 'Фотоматериал' : 'Видеоматериал'}</span><h1>{item.title}</h1><p>{item.description}</p></div></section>
      : item.kind === 'BIRTHDAY' ? <section className="birthday-slide"><div className="birthday-slide__decor"><PartyPopper /><Cake /></div><div className="birthday-slide__content"><span>{birthdayCopy[language].eyebrow}</span><p>{birthdayCopy[language].prefix}</p><h1>{item.title}</h1><div>{item.description}</div><strong>{birthdayCopy[language].wishes}</strong></div></section>
        : <section className="broadcast-news-slide"><div className="broadcast-news-slide__copy"><div className="broadcast-news-slide__meta"><span><Newspaper size={18} />{newsCategoryLabel(item.category, language)}</span><time><CalendarDays size={17} />{new Date(item.publishedAt || item.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</time></div><h1>{item.title}</h1><p className="broadcast-news-slide__lead">{item.description}</p><div className="broadcast-news-slide__body">{item.content.split(/\n{2,}/).slice(0, 4).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div></div><div className="broadcast-news-slide__visual"><img src={assetUrl(item.image)} alt="" /></div></section>}
    <div className="broadcast-ticker"><span className="broadcast-ticker__label"><Megaphone size={19} />{language === 'kz' ? 'АҚПАРАТ' : 'ВАЖНО'}</span><div><p>{ticker}<i>•</i>{ticker}<i>•</i>{ticker}</p></div></div>
  </main>;
}

export default function NewsListPage() {
  const { interactive, activateInteractive } = useOutletContext();
  return interactive ? <InteractiveNewsFeed /> : <BroadcastScreen onOpenNews={activateInteractive} />;
}
