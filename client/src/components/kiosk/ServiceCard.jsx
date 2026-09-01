import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../common/AppIcon.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localized } from '../../utils/localization.js';
import { track } from '../../api/analytics.js';

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const open = () => {
    track('SERVICE_OPEN', { serviceId: service.id, categoryId: service.categoryId || service.category?.id });
    navigate(`/service/${service.slug}`);
  };
  return <article className="service-card" onClick={open} tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(); }}>
    <div className="service-card__icon"><AppIcon name={service.icon} size={34} /></div>
    <div className="service-card__body">
      <span className="service-card__category">{localized(service.category, 'title', language)}</span>
      <h3>{localized(service, 'title', language)}</h3>
      <p>{localized(service, 'shortDescription', language)}</p>
    </div>
    <button className="service-card__button" onClick={(e) => { e.stopPropagation(); open(); }}>{t.details}<ArrowRight size={24} /></button>
  </article>;
}
