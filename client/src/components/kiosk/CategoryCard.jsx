import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../common/AppIcon.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localized } from '../../utils/localization.js';
import { track } from '../../api/analytics.js';

export default function CategoryCard({ category }) {
  const navigate = useNavigate(); const { language } = useLanguage();
  const open = () => {
    track('CATEGORY_OPEN', { categoryId: category.id });
    navigate(`/category/${category.slug}`);
  };
  return <button className="category-card" onClick={open}>
    <span className="category-card__icon"><AppIcon name={category.icon} size={38} /></span>
    <span className="category-card__content"><strong>{localized(category, 'title', language)}</strong><small>{category._count?.services || 0}</small></span>
    <ArrowUpRight className="category-card__arrow" size={26} />
  </button>;
}
