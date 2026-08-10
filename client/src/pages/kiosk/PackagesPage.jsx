import { useCallback, useEffect, useState } from 'react';
import api, { apiMessage } from '../../api/client.js';
import PackageCard from '../../components/kiosk/PackageCard.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function PackagesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const response = await api.get('/service-packages'); setItems(response.data.data); } catch (err) { setError(apiMessage(err)); } }, []);
  useEffect(() => { load(); }, [load]);
  if (!items && !error) return <LoadingState text={t.loading} />;
  if (error) return <ErrorState title={t.unavailableTitle} text={error} onRetry={load} retryText={t.retry} />;
  return <section className="page-section"><header className="page-title"><span>ДГД</span><h1>{t.servicePackages}</h1><p>{t.subtitle}</p></header><div className="package-grid">{items.map((item) => <PackageCard item={item} key={item.id} />)}</div></section>;
}
