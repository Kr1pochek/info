import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../common/AppIcon.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localized } from '../../utils/localization.js';

export default function PackageCard({ item }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  return <button className="package-card" onClick={() => navigate(`/package/${item.slug}`)}>
    <span className="package-card__icon"><AppIcon name={item.icon} size={34} /></span>
    <span className="package-card__body"><small>{t.packageAudience}</small><strong>{localized(item, 'title', language)}</strong><p>{localized(item, 'targetAudience', language)}</p></span>
    <span className="package-card__count">{item._count?.services || 0}</span><ArrowUpRight size={25} />
  </button>;
}
