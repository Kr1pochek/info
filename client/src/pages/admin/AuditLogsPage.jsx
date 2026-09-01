import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleHelp, Eye, ShieldCheck } from 'lucide-react';
import api, { apiMessage } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';
import { auditActionLabel, auditActionOptions, auditEntityLabel, auditSourceLabel } from '../../utils/audit.js';

export default function AuditLogsPage() {
  const { language, locale, tr } = useAdminI18n();
  const [rows, setRows] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [filters, setFilters] = useState({ page: 1, action: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/admin/audit-logs', { params: { ...filters, limit: 30 } });
      setRows(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(apiMessage(err));
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return <>
    <AdminPageHeader
      eyebrow="Безопасность"
      eyebrowKz="Қауіпсіздік"
      title="Журнал аудита"
      titleKz="Аудит журналы"
      description="Понятная история действий администраторов: кто, когда и что изменил"
      descriptionKz="Әкімшілер әрекеттерінің түсінікті тарихы: кім, қашан және нені өзгертті"
      actions={<label className="action-filter">
        <ShieldCheck />
        <select value={filters.action} onChange={(event) => setFilters({ action: event.target.value, page: 1 })}>
          <option value="">{tr('Все действия')}</option>
          {auditActionOptions.map((action) => <option value={action} key={action}>{auditActionLabel(action, language)}</option>)}
        </select>
      </label>}
    />

    <section className="audit-help" aria-label={tr('Как читать журнал аудита', 'Аудит журналын қалай оқу керек')}>
      <article><CircleHelp /><div><strong>{tr('Что это?', 'Бұл не?')}</strong><p>{tr('Система автоматически записывает важные действия в панели управления.', 'Жүйе басқару панеліндегі маңызды әрекеттерді автоматты түрде жазады.')}</p></div></article>
      <article><Eye /><div><strong>{tr('Зачем это нужно?', 'Бұл не үшін қажет?')}</strong><p>{tr('Журнал помогает понять, кто добавил, изменил или удалил информацию.', 'Журнал ақпаратты кім қосқанын, өзгерткенін немесе жойғанын түсінуге көмектеседі.')}</p></div></article>
      <article><ShieldCheck /><div><strong>{tr('Можно ли изменить записи?', 'Жазбаларды өзгертуге бола ма?')}</strong><p>{tr('Нет. Записи создаются автоматически и служат историей административных действий.', 'Жоқ. Жазбалар автоматты түрде жасалады және әкімшілік әрекеттер тарихы ретінде сақталады.')}</p></div></article>
    </section>

    {error ? <ErrorState title={tr('Не удалось загрузить журнал', 'Журналды жүктеу мүмкін болмады')} text={error} onRetry={load} /> : !rows ? <LoadingState /> : <div className="admin-card admin-table-wrap">
      <table className="admin-table audit-table">
        <thead><tr>
          <th>{tr('Когда', 'Қашан')}</th>
          <th>{tr('Кто выполнил', 'Кім орындады')}</th>
          <th>{tr('Что сделал', 'Не істеді')}</th>
          <th>{tr('Что изменил', 'Нені өзгертті')}</th>
          <th>{tr('Откуда выполнено', 'Қайдан орындалды')}</th>
        </tr></thead>
        <tbody>{rows.length ? rows.map((item) => <tr key={item.id}>
          <td>{new Date(item.createdAt).toLocaleString(locale)}</td>
          <td><strong>{item.adminUser.fullName}</strong><small className="table-subline">{tr('Логин', 'Логин')}: {item.adminUser.login}</small></td>
          <td><span className="status-pill status-pill--neutral audit-action">{auditActionLabel(item.action, language)}</span></td>
          <td><strong>{auditEntityLabel(item.entityType, language)}</strong>{item.objectName && <small className="table-subline">«{item.objectName}»</small>}{item.entityId && <small className="table-subline">{tr('Номер записи', 'Жазба нөмірі')}: {item.entityId}</small>}</td>
          <td><strong>{auditSourceLabel(item.ipAddress, language)}</strong><small className="table-subline">IP: {item.ipAddress || '—'}</small></td>
        </tr>) : <tr><td colSpan="5" className="empty-row">{tr('Записей пока нет', 'Әзірге жазбалар жоқ')}</td></tr>}</tbody>
      </table>
    </div>}

    {meta.pages > 1 && <div className="pagination">
      <button disabled={meta.page <= 1} onClick={() => setFilters({ ...filters, page: meta.page - 1 })}><ChevronLeft />{tr('Назад')}</button>
      <span>{tr('Страница', 'Бет')} {meta.page} {tr('из', 'ішінен')} {meta.pages}</span>
      <button disabled={meta.page >= meta.pages} onClick={() => setFilters({ ...filters, page: meta.page + 1 })}>{tr('Далее')}<ChevronRight /></button>
    </div>}
  </>;
}
