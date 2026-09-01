import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeCheck, Banknote, Clock3, FileCheck2, ListChecks, MapPin, Phone, ShieldAlert, UserRound } from 'lucide-react';
import api, { apiMessage } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localized } from '../../utils/localization.js';
import AppIcon from '../../components/common/AppIcon.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';

function ListSection({ title, items, icon: Icon, ordered = false }) {
  if (!Array.isArray(items) || !items.length) return null;
  const Tag = ordered ? 'ol' : 'ul';
  return <section className="detail-section"><h2><Icon size={28} />{title}</h2><Tag className={ordered ? 'steps-list' : 'check-list'}>{items.map((item, index) => <li key={`${item}-${index}`}>{ordered && <span>{index + 1}</span>}{item}</li>)}</Tag></section>;
}
export default function ServicePage() {
  const { serviceSlug } = useParams(); const { language, t } = useLanguage(); const [service, setService] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await api.get(`/services/${serviceSlug}`); setService(response.data.data); } catch (err) { setError(apiMessage(err)); } finally { setLoading(false); } }, [serviceSlug]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <LoadingState text={t.loading} />; if (error || !service) return <ErrorState title={t.unavailableTitle} text={error || t.unavailableText} onRetry={load} retryText={t.retry} />;
  const value = (base) => localized(service, base, language); const list = (base) => service[`${base}${language === 'kz' ? 'Kz' : 'Ru'}`];
  return <article className="service-detail"><header className="service-detail__hero"><div className="service-detail__icon"><AppIcon name={service.icon} size={64} /></div><div><span>{localized(service.category, 'title', language)}</span><h1>{value('title')}</h1><p>{value('shortDescription')}</p></div></header>
    <div className="service-detail__grid"><div className="service-detail__main"><section className="detail-section"><h2><FileCheck2 size={28} />{t.about}</h2><p>{value('fullDescription')}</p></section><section className="detail-section"><h2><UserRound size={28} />{t.audience}</h2><p>{value('targetAudience')}</p></section>
      <ListSection title={t.documents} items={list('requiredDocuments')} icon={FileCheck2} /><ListSection title={t.requiredData} items={list('requiredData')} icon={ListChecks} />
      <section className="detail-section"><h2><BadgeCheck size={28} />{t.conditions}</h2><p>{value('conditions')}</p></section><ListSection title={t.steps} items={list('steps')} icon={ListChecks} ordered /><ListSection title={t.rejection} items={list('rejectionReasons')} icon={ShieldAlert} />
    </div><aside className="service-facts"><div><Clock3 /><span>{t.time}<strong>{value('processingTime')}</strong></span></div><div><Banknote /><span>{t.cost}<strong>{value('cost')}</strong></span></div><div><BadgeCheck /><span>{t.result}<strong>{value('result')}</strong></span></div><div><Phone /><span>{t.contacts}<strong>{value('contacts')}</strong></span></div><div><MapPin /><span>{t.office}<strong>{value('officeAddress')}</strong></span></div><div><Clock3 /><span>{t.schedule}<strong>{value('workingHours')}</strong></span></div></aside></div>
  </article>;
}
