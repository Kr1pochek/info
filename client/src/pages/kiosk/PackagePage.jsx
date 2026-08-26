import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import AppIcon from '../../components/common/AppIcon.jsx';
import ServiceCard from '../../components/kiosk/ServiceCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { localized } from '../../utils/localization.js';

export default function PackagePage() {
  const { packageSlug } = useParams();
  const { language, t } = useLanguage();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const response = await api.get(`/service-packages/${packageSlug}`); setItem(response.data.data); } catch (err) { setError(apiMessage(err)); } }, [packageSlug]);
  useEffect(() => { load(); }, [load]);
  if (!item && !error) return <LoadingState text={t.loading} />;
  if (error || !item) return <ErrorState title={t.unavailableTitle} text={error || t.unavailableText} onRetry={load} retryText={t.retry} />;
  return <section className="page-section"><header className="package-hero"><div><AppIcon name={item.icon} size={56} /></div><section><span>{t.servicePackages}</span><h1>{localized(item, 'title', language)}</h1><p>{localized(item, 'description', language)}</p></section></header>
    <div className="package-facts"><article><small>{t.packageAudience}</small><strong>{localized(item, 'targetAudience', language)}</strong></article><article><small>{t.serviceZone}</small><strong>{localized(item, 'serviceZone', language)}</strong></article></div>
    <div className="section-heading section-heading--compact"><div><span>{t.packageServices}</span><h2>{t.servicesFound}: {item.services.length}</h2></div></div>
    {item.services.length ? <div className="service-grid">{item.services.map((service) => <ServiceCard service={service} key={service.id} />)}</div> : <EmptyState text={t.noServices} />}
  </section>;
}
