import { Home, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
export default function NotFoundPage() { const navigate = useNavigate(); const { t } = useLanguage(); return <section className="not-found"><SearchX size={72} /><span>404</span><h1>{t.notFound}</h1><p>{t.notFoundText}</p><button className="button button--primary" onClick={() => navigate('/')}><Home size={24} />{t.home}</button></section>; }
