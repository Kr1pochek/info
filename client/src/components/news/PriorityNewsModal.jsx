import { useEffect } from 'react';
import { ArrowRight, CalendarX2, ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../api/client.js';
import { localizedNews } from '../../utils/news.js';

export default function PriorityNewsModal({ news, language, onClose, onNext, current = 1, total = 1, broadcast = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [onClose]);

  if (!news) return null;
  const item = localizedNews(news, language);
  const locale = language === 'kz' ? 'kk-KZ' : 'ru-RU';
  const expires = item.expiresAt ? new Date(item.expiresAt).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return <div className={`priority-modal ${broadcast ? 'priority-modal--broadcast' : ''}`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="priority-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="priority-news-title" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="priority-modal__close" onClick={onClose} aria-label={language === 'kz' ? 'Жабу' : 'Закрыть'}><X /></button>
      <div className="priority-modal__image">{item.image ? <img src={assetUrl(item.image)} alt="" /> : <ShieldAlert size={82} />}</div>
      <div className="priority-modal__content">
        <div className="priority-modal__eyebrow"><ShieldAlert size={22} /><span>{language === 'kz' ? 'МАҢЫЗДЫ ХАБАРЛАМА' : 'ВАЖНОЕ СООБЩЕНИЕ'}</span>{total > 1 && <small>{current} / {total}</small>}</div>
        <h2 id="priority-news-title">{item.title}</h2>
        <p>{item.description}</p>
        {expires && <time dateTime={item.expiresAt}><CalendarX2 size={17} />{language === 'kz' ? 'Көрсету мерзімі:' : 'Показывается до:'} <strong>{expires}</strong></time>}
        <div className="priority-modal__actions">
          {!broadcast && <Link to={`/news/${item.slug}`}>{language === 'kz' ? 'Толығырақ оқу' : 'Открыть полностью'}<ArrowRight size={18} /></Link>}
          {onNext && <button type="button" onClick={onNext}>{language === 'kz' ? 'Келесі маңызды жаңалық' : 'Следующая важная новость'}<ArrowRight size={18} /></button>}
          <button type="button" className="priority-modal__continue" onClick={onClose}>{broadcast ? language === 'kz' ? 'Эфирді жалғастыру' : 'Продолжить эфир' : language === 'kz' ? 'Жабу' : 'Закрыть'}</button>
        </div>
      </div>
    </section>
  </div>;
}
