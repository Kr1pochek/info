import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock3, Edit3, Eye, EyeOff, ImagePlus, MonitorPlay, Newspaper, Pin, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { ConfirmDialog, Modal } from '../../components/admin/Modal.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { newsCategories, newsCategoryClass, newsCategoryLabel } from '../../utils/news.js';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const blank = { titleRu: '', titleKz: '', descriptionRu: '', descriptionKz: '', contentRu: '', contentKz: '', image: '', category: 'GENERAL', isPriority: false, showInBroadcast: false, published: true, publishAt: '', expireAt: '', sortOrder: 0 };
const toLocalDateTime = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const toForm = (item) => ({ id: item.id, titleRu: item.titleRu, titleKz: item.titleKz, descriptionRu: item.descriptionRu, descriptionKz: item.descriptionKz, contentRu: item.contentRu, contentKz: item.contentKz, image: item.image || '', category: item.category, isPriority: Boolean(item.isPriority), showInBroadcast: item.isPriority ? false : Boolean(item.showInBroadcast), published: item.published, publishAt: toLocalDateTime(item.publishedAt), expireAt: toLocalDateTime(item.expiresAt), sortOrder: item.isPriority ? 0 : item.sortOrder ?? 0 });

function NewsForm({ form, setForm, onSubmit, onCancel, onUpload, uploading, busy, error }) {
  const { language, tr } = useAdminI18n();
  const scheduledPublication = form.published && form.publishAt && new Date(form.publishAt) > new Date();
  const submitLabel = form.id
    ? tr('Сохранить изменения', 'Өзгерістерді сақтау')
    : form.published
      ? scheduledPublication ? tr('Запланировать', 'Жоспарлау') : tr('Опубликовать', 'Жариялау')
      : tr('Сохранить черновик', 'Нобайды сақтау');
  return <form className="admin-form" onSubmit={onSubmit}>
    <div className="news-editor">
      <div className="form-grid">
        <label className="form-grid__wide"><span>{tr('Заголовок на русском', 'Орысша тақырып')}</span><input required maxLength={240} value={form.titleRu} onChange={(event) => setForm({ ...form, titleRu: event.target.value })} /></label>
        <label className="form-grid__wide"><span>{tr('Заголовок на казахском', 'Қазақша тақырып')}</span><input required maxLength={240} value={form.titleKz} onChange={(event) => setForm({ ...form, titleKz: event.target.value })} /></label>
        {!form.isPriority && <fieldset className="news-placement-selector form-grid__wide"><legend>{tr('Где показывать новость?', 'Жаңалықты қайда көрсету керек?')}</legend><div><label className={!form.showInBroadcast ? 'active' : ''}><input type="radio" name="news-placement" checked={!form.showInBroadcast} onChange={() => setForm({ ...form, showInBroadcast: false })} /><span><strong><Newspaper size={22} />{tr('Только в ленте новостей', 'Тек жаңалықтар таспасында')}</strong><small>{tr('Новость увидят посетители, когда откроют раздел новостей.', 'Келушілер жаңалықтар бөлімін ашқанда көреді.')}</small></span></label><label className={form.showInBroadcast ? 'active' : ''}><input type="radio" name="news-placement" checked={form.showInBroadcast} onChange={() => setForm({ ...form, showInBroadcast: true })} /><span><strong><MonitorPlay size={22} />{tr('В ленте и в эфире', 'Таспада және эфирде')}</strong><small>{tr('Новость дополнительно будет автоматически показана отдельным слайдом.', 'Жаңалық қосымша жеке слайд ретінде автоматты түрде көрсетіледі.')}</small></span></label></div></fieldset>}
        {form.isPriority && <label className="priority-news-toggle form-grid__wide active"><input type="checkbox" checked readOnly /><span><strong><ShieldAlert size={22} />{tr('Показывать всплывающим окном', 'Қалқымалы терезеде көрсету')}</strong><small>{tr('Откроется поверх ленты новостей и материалов эфира только в заданный период.', 'Көрсетілген кезеңде жаңалықтар таспасы мен эфир материалдарының үстінен ашылады.')}</small></span></label>}
        <label className="form-grid__wide"><span>{tr('Категория', 'Санат')}</span><select value={form.category} disabled={form.isPriority} onChange={(event) => setForm({ ...form, category: event.target.value })}>{newsCategories.slice(1).map((item) => <option value={item.value} key={item.value}>{language === 'kz' ? item.labelKz : item.label}</option>)}</select>{form.isPriority && <small>{tr('Для приоритетной новости автоматически выбрана категория «Важное».', 'Басым жаңалық үшін «Маңызды» санаты автоматты түрде таңдалды.')}</small>}</label>
        {!form.isPriority && form.showInBroadcast && <label><span>{tr('Порядок слайда в эфире', 'Эфирдегі слайд реті')}</span><input type="number" min="0" max="10000" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /><small>{tr('Чем меньше число, тем раньше появится слайд.', 'Сан неғұрлым аз болса, слайд соғұрлым ертерек шығады.')}</small></label>}
        <label className="form-grid__wide"><span>{tr('Краткое описание на русском', 'Орысша қысқаша сипаттама')}</span><textarea required maxLength={800} value={form.descriptionRu} onChange={(event) => setForm({ ...form, descriptionRu: event.target.value })} /></label>
        <label className="form-grid__wide"><span>{tr('Краткое описание на казахском', 'Қазақша қысқаша сипаттама')}</span><textarea required maxLength={800} value={form.descriptionKz} onChange={(event) => setForm({ ...form, descriptionKz: event.target.value })} /></label>
        <label className="form-grid__wide"><span>{tr('Полный текст на русском', 'Орысша толық мәтін')}</span><textarea className="news-content-input" required maxLength={30000} value={form.contentRu} onChange={(event) => setForm({ ...form, contentRu: event.target.value })} placeholder={tr('Разделяйте абзацы пустой строкой', 'Абзацтарды бос жолмен бөліңіз')} /></label>
        <label className="form-grid__wide"><span>{tr('Полный текст на казахском', 'Қазақша толық мәтін')}</span><textarea className="news-content-input" required maxLength={30000} value={form.contentKz} onChange={(event) => setForm({ ...form, contentKz: event.target.value })} placeholder={tr('Разделяйте абзацы пустой строкой', 'Абзацтарды бос жолмен бөліңіз')} /></label>
        <label className="form-grid__wide"><span>{tr('Обложка — необязательно', 'Мұқаба — міндетті емес')}</span><span className="image-upload-control"><ImagePlus size={20} />{uploading ? tr('Загрузка…') : form.image ? tr('Заменить изображение', 'Суретті ауыстыру') : tr('Загрузить изображение', 'Сурет жүктеу')}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onUpload} disabled={uploading} /></span><small>{tr('Можно опубликовать без изображения. Форматы: JPG, PNG, WebP или GIF, до 5 МБ.', 'Суретсіз жариялауға болады. Пішімдер: JPG, PNG, WebP немесе GIF, 5 МБ дейін.')}</small>{form.image && <button type="button" className="news-image-remove" onClick={() => setForm({ ...form, image: '' })}><Trash2 size={15} />{tr('Убрать изображение', 'Суретті алып тастау')}</button>}</label>
        <label className="toggle-label form-grid__wide"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked, publishAt: event.target.checked ? form.publishAt || (form.isPriority ? toLocalDateTime(new Date()) : '') : '' })} /><span>{tr('Опубликовать новость', 'Жаңалықты жариялау')}</span></label>
        {form.published && <><label><span>{form.isPriority ? tr('Начало показа всплывающего окна', 'Қалқымалы терезені көрсетудің басталуы') : tr('Дата и время публикации', 'Жариялау күні мен уақыты')}</span><input type="datetime-local" required={form.isPriority} value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} /><small>{form.isPriority ? tr('С этого момента сообщение начнёт открываться поверх текущих материалов.', 'Осы сәттен бастап хабарлама ағымдағы материалдардың үстінен ашылады.') : tr('Пустое поле — публикация сразу.', 'Бос өріс — бірден жариялау.')}</small></label><label><span>{form.isPriority ? tr('Окончание показа всплывающего окна', 'Қалқымалы терезені көрсетудің аяқталуы') : tr('Показывать до', 'Көрсету мерзімі')}</span><input type="datetime-local" required={form.isPriority} min={form.publishAt || undefined} value={form.expireAt} onChange={(event) => setForm({ ...form, expireAt: event.target.value })} /><small>{form.isPriority ? tr('Обязательно. После этого времени окно и новость исчезнут автоматически.', 'Міндетті. Осы уақыттан кейін терезе мен жаңалық автоматты түрде жоғалады.') : tr('Необязательно. После этой даты материал исчезнет автоматически.', 'Міндетті емес. Осы күннен кейін материал автоматты түрде жоғалады.')}</small></label></>}
      </div>
      <aside className="news-editor__preview">
        <span>{tr('Предпросмотр карточки', 'Карточканы алдын ала қарау')}</span>{!form.isPriority && <div className={`news-placement-preview${form.showInBroadcast ? ' is-broadcast' : ''}`}>{form.showInBroadcast ? <MonitorPlay size={16} /> : <Newspaper size={16} />}{form.showInBroadcast ? tr('Лента + эфир', 'Таспа + эфир') : tr('Только лента', 'Тек таспа')}</div>}{form.isPriority && <div className="news-priority-preview"><ShieldAlert size={16} />{tr('Поверх ленты и эфира', 'Таспа мен эфирдің үстінде')}</div>}<strong className={newsCategoryClass(form.category)}>{newsCategoryLabel(form.category, language)}</strong>
        <div className="news-editor__image">{form.image ? <img src={assetUrl(form.image)} alt="" /> : <ImagePlus size={38} />}</div>
        <small><CalendarDays size={15} />{tr('Дата публикации', 'Жариялау күні')}</small>
        <h3>{form[language === 'kz' ? 'titleKz' : 'titleRu'] || tr('Заголовок новости', 'Жаңалық тақырыбы')}</h3>
        <p>{form[language === 'kz' ? 'descriptionKz' : 'descriptionRu'] || tr('Краткое описание показывается в общей ленте новостей.', 'Қысқаша сипаттама жалпы жаңалықтарда көрсетіледі.')}</p>
      </aside>
    </div>
    {error && <div className="form-error">{tr(error)}</div>}
    <div className="form-actions"><button type="button" className="admin-button admin-button--secondary" onClick={onCancel}>{tr('Отмена')}</button><button className="admin-button admin-button--primary" disabled={busy || uploading}>{busy ? tr('Сохранение…') : submitLabel}</button></div>
  </form>;
}

export default function NewsPage() {
  const { language, locale, tr } = useAdminI18n();
  const [rows, setRows] = useState(null); const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', publication: '', category: '', priority: '', page: 1 }); const [scheduled, setScheduled] = useState([]); const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [response, scheduleResponse] = await Promise.all([
        api.get('/admin/news', { params: { search: filters.search, publication: filters.publication || undefined, category: filters.category || undefined, priority: filters.priority || undefined, page: filters.page, limit: 15, sort: 'updatedAt', direction: 'desc' } }),
        api.get('/admin/news', { params: { publication: 'scheduled', limit: 6, sort: 'publishedAt', direction: 'asc' } }),
      ]);
      setRows(response.data.data); setMeta(response.data.meta); setScheduled(scheduleResponse.data.data);
    } catch (err) { setError(apiMessage(err)); }
  }, [filters]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  const upload = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setError('');
    try { const data = new FormData(); data.append('image', file); const response = await api.post('/admin/news/images', data); setEditing((current) => ({ ...current, image: response.data.data.path })); }
    catch (err) { setError(apiMessage(err)); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const { id, publishAt, expireAt, ...payload } = editing;
    if (payload.isPriority) { payload.showInBroadcast = false; payload.sortOrder = 0; }
    payload.publishedAt = payload.published && publishAt ? new Date(publishAt).toISOString() : null;
    payload.expiresAt = payload.published && expireAt ? new Date(expireAt).toISOString() : null;
    try {
      if (id) await api.patch(`/admin/news/${id}`, payload); else await api.post('/admin/news', payload);
      const scheduledPublication = payload.published && payload.publishedAt && new Date(payload.publishedAt) > new Date();
      setEditing(null);
      setToast({ type: 'success', message: id ? 'Новость обновлена' : payload.published ? scheduledPublication ? 'Новость запланирована' : 'Новость опубликована' : 'Черновик сохранён' });
      await load();
    }
    catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  };
  const changePublication = async (item) => {
    if (!item.published && item.isPriority && (!item.expiresAt || new Date(item.expiresAt) <= new Date())) { setEditing(toForm(item)); setToast({ type: 'error', message: 'Сначала задайте новый период показа важной новости' }); return; }
    try { await api.patch(`/admin/news/${item.id}/publication`, { published: !item.published }); setToast({ type: 'success', message: item.published ? 'Новость снята с публикации' : 'Новость опубликована' }); await load(); }
    catch (err) { setToast({ type: 'error', message: apiMessage(err) }); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/news/${deleting.id}`); setDeleting(null); setToast({ type: 'success', message: 'Новость удалена' }); await load(); }
    catch (err) { setToast({ type: 'error', message: apiMessage(err) }); setDeleting(null); }
    finally { setBusy(false); }
  };

  return <>
    <AdminPageHeader eyebrow="Контент" eyebrowKz="Контент" title="Новости" titleKz="Жаңалықтар" description="Создание, редактирование и публикация материалов корпоративной ленты" descriptionKz="Корпоративтік таспа материалдарын жасау, өңдеу және жариялау" actions={<><button className="admin-button admin-button--priority" onClick={() => setEditing({ ...blank, isPriority: true, category: 'IMPORTANT', published: true, publishAt: toLocalDateTime(new Date()) })}><ShieldAlert size={19} />{tr('Важная новость', 'Маңызды жаңалық')}</button><button className="admin-button admin-button--primary" onClick={() => setEditing({ ...blank })}><Plus size={19} />{tr('Новая новость', 'Жаңа жаңалық')}</button></>} />
    {scheduled.length > 0 && <section className="admin-schedule"><header><div><Clock3 size={20} /><span>{tr('Ближайшие публикации', 'Жақын жарияланымдар')}</span></div><strong>{scheduled.length}</strong></header><div>{scheduled.map((item) => <button onClick={() => setEditing(toForm(item))} key={item.id}><time>{new Date(item.publishedAt).toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time><span>{item.isPriority && <Pin size={13} />}{item[language === 'kz' ? 'titleKz' : 'titleRu']}</span><ChevronRight size={17} /></button>)}</div></section>}
    <div className="admin-toolbar admin-toolbar--filters"><label className="admin-search"><Search /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} placeholder={tr('Поиск на русском или казахском', 'Орысша немесе қазақша іздеу')} /></label><select value={filters.publication} onChange={(event) => setFilters({ ...filters, publication: event.target.value, page: 1 })}><option value="">{tr('Все статусы', 'Барлық күйлер')}</option><option value="live">{tr('Опубликованные', 'Жарияланған')}</option><option value="scheduled">{tr('Запланированные', 'Жоспарланған')}</option><option value="expired">{tr('Срок истёк', 'Мерзімі өтті')}</option><option value="draft">{tr('Черновики', 'Нобайлар')}</option></select><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })}>{newsCategories.map((item) => <option value={item.value} key={item.value || 'all'}>{language === 'kz' ? item.labelKz : item.label}</option>)}</select><select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value, page: 1 })}><option value="">{tr('Все новости', 'Барлық жаңалықтар')}</option><option value="true">{tr('Только приоритетные', 'Тек басым')}</option><option value="false">{tr('Без приоритета', 'Басымдықсыз')}</option></select><span>{meta.total} {tr('записей', 'жазба')}</span></div>
    {error && !editing && <ErrorState title={tr('Не удалось загрузить новости', 'Жаңалықтарды жүктеу мүмкін болмады')} text={error} onRetry={load} />}
    {!rows && !error ? <LoadingState /> : rows && <div className="admin-card admin-table-wrap"><table className="admin-table"><thead><tr><th>{tr('Новость', 'Жаңалық')}</th><th>{tr('Категория', 'Санат')}</th><th>{tr('Показ', 'Көрсету')}</th><th>{tr('Порядок')}</th><th>{tr('Статус')}</th><th>{tr('Публикация', 'Жарияланым')}</th><th>{tr('Показывать до', 'Көрсету мерзімі')}</th><th>{tr('Обновлена', 'Жаңартылған')}</th><th></th></tr></thead><tbody>{rows.map((item) => { const now = new Date(); const expired = item.published && item.expiresAt && new Date(item.expiresAt) <= now; const isScheduled = item.published && !expired && item.publishedAt && new Date(item.publishedAt) > now; const live = item.published && !expired && !isScheduled; return <tr className={item.isPriority ? 'news-row--priority' : ''} key={item.id}><td><div className="table-title news-table-title"><span>{item.image ? <img src={assetUrl(item.image)} alt="" /> : <ImagePlus />}</span><div><strong>{item.isPriority && <Pin size={14} />}{item[language === 'kz' ? 'titleKz' : 'titleRu']}</strong><small>{item[language === 'kz' ? 'titleRu' : 'titleKz']} · {item.author?.fullName || '—'}</small></div></div></td><td><span className={newsCategoryClass(item.category)}>{newsCategoryLabel(item.category, language)}</span></td><td><span className={`news-placement-pill${item.showInBroadcast ? ' is-broadcast' : ''}`}>{item.showInBroadcast ? <MonitorPlay size={14} /> : <Newspaper size={14} />}{item.showInBroadcast ? tr('Лента + эфир', 'Таспа + эфир') : tr('Только лента', 'Тек таспа')}</span></td><td><strong>{item.showInBroadcast ? item.sortOrder : '—'}</strong></td><td>{item.isPriority && <span className="status-pill status-pill--priority">{tr('Всплывающее окно', 'Қалқымалы терезе')}</span>}<span className={`status-pill ${isScheduled ? 'status-pill--accent' : live ? 'status-pill--success' : 'status-pill--muted'}`}>{expired ? tr('Срок истёк', 'Мерзімі өтті') : isScheduled ? tr('Запланирована', 'Жоспарланған') : live ? tr('Опубликована') : tr('Черновик', 'Нобай')}</span></td><td>{item.publishedAt ? <span className="scheduled-date">{isScheduled && <Clock3 size={14} />}{new Date(item.publishedAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> : '—'}</td><td>{item.expiresAt ? <span className="scheduled-date"><CalendarX2 size={14} />{new Date(item.expiresAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> : tr('Без срока', 'Мерзімсіз')}</td><td>{new Date(item.updatedAt).toLocaleDateString(locale)}</td><td><div className="row-actions">{live && <a href={`/news/${item.slug}`} aria-label={tr('Открыть новость', 'Жаңалықты ашу')}><Eye /></a>}<button onClick={() => changePublication(item)} aria-label={item.published ? tr('Снять с публикации', 'Жарияланымнан алу') : tr('Опубликовать', 'Жариялау')}>{item.published ? <EyeOff /> : <Eye />}</button><button onClick={() => setEditing(toForm(item))} aria-label={tr('Редактировать', 'Өңдеу')}><Edit3 /></button><button onClick={() => setDeleting(item)} aria-label={tr('Удалить')}><Trash2 /></button></div></td></tr>; })}</tbody></table></div>}
    {meta.pages > 1 && <div className="pagination"><button disabled={meta.page <= 1} onClick={() => setFilters({ ...filters, page: meta.page - 1 })}><ChevronLeft />{tr('Назад')}</button><span>{tr('Страница', 'Бет')} {meta.page} {tr('из', 'ішінен')} {meta.pages}</span><button disabled={meta.page >= meta.pages} onClick={() => setFilters({ ...filters, page: meta.page + 1 })}>{tr('Далее')}<ChevronRight /></button></div>}
    {editing && <Modal title={editing.id ? 'Редактирование новости' : 'Новая новость'} titleKz={editing.id ? 'Жаңалықты өңдеу' : 'Жаңа жаңалық'} onClose={() => setEditing(null)} wide><NewsForm form={editing} setForm={setEditing} onSubmit={save} onCancel={() => setEditing(null)} onUpload={upload} uploading={uploading} busy={busy} error={error} /></Modal>}
    {deleting && <ConfirmDialog title="Удалить новость?" titleKz="Жаңалықты жою керек пе?" text={`Новость «${deleting.titleRu}» будет удалена без возможности восстановления.`} textKz={`«${deleting.titleKz}» жаңалығы қалпына келтіру мүмкіндігінсіз жойылады.`} onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />}
    <Toast {...toast} onClose={() => setToast(null)} />
  </>;
}
