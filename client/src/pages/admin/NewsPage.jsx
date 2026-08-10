import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock3, Edit3, Eye, EyeOff, ImagePlus, Plus, Search, Trash2 } from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { ConfirmDialog, Modal } from '../../components/admin/Modal.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { newsCategories, newsCategoryClass, newsCategoryLabel } from '../../utils/news.js';

const blank = { slug: '', titleRu: '', titleKz: '', descriptionRu: '', descriptionKz: '', contentRu: '', contentKz: '', image: '', category: 'GENERAL', published: false, publishAt: '', expireAt: '', sortOrder: 0 };
const toLocalDateTime = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const toForm = (item) => ({ id: item.id, slug: item.slug, titleRu: item.titleRu, titleKz: item.titleKz, descriptionRu: item.descriptionRu, descriptionKz: item.descriptionKz, contentRu: item.contentRu, contentKz: item.contentKz, image: item.image, category: item.category, published: item.published, publishAt: toLocalDateTime(item.publishedAt), expireAt: toLocalDateTime(item.expiresAt), sortOrder: item.sortOrder ?? 0 });

const transliteration = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function createSlug(value) {
  return value.toLowerCase().split('').map((character) => transliteration[character] ?? character).join('')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140);
}

function NewsForm({ form, setForm, onSubmit, onCancel, onUpload, uploading, busy, error }) {
  return <form className="admin-form" onSubmit={onSubmit}>
    <div className="news-editor">
      <div className="form-grid">
        <label className="form-grid__wide"><span>Заголовок на русском</span><input required maxLength={240} value={form.titleRu} onChange={(event) => { const titleRu = event.target.value; const slugFollowsTitle = !form.slug || form.slug === createSlug(form.titleRu); setForm({ ...form, titleRu, slug: slugFollowsTitle ? createSlug(titleRu) : form.slug }); }} /></label>
        <label className="form-grid__wide"><span>Қазақша тақырып</span><input required maxLength={240} value={form.titleKz} onChange={(event) => setForm({ ...form, titleKz: event.target.value })} /></label>
        <label className="form-grid__wide"><span>Адрес новости</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase() })} placeholder="new-service-launch" /><small>Создаётся автоматически из заголовка, но его можно изменить вручную.</small></label>
        <label className="form-grid__wide"><span>Категория</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{newsCategories.slice(1).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label><span>Порядок в эфире</span><input type="number" min="0" max="10000" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /><small>Чем меньше число, тем раньше появится слайд.</small></label>
        <label className="form-grid__wide"><span>Краткое описание на русском</span><textarea required maxLength={800} value={form.descriptionRu} onChange={(event) => setForm({ ...form, descriptionRu: event.target.value })} /></label>
        <label className="form-grid__wide"><span>Қазақша қысқаша сипаттама</span><textarea required maxLength={800} value={form.descriptionKz} onChange={(event) => setForm({ ...form, descriptionKz: event.target.value })} /></label>
        <label className="form-grid__wide"><span>Полный текст на русском</span><textarea className="news-content-input" required maxLength={30000} value={form.contentRu} onChange={(event) => setForm({ ...form, contentRu: event.target.value })} placeholder="Разделяйте абзацы пустой строкой" /></label>
        <label className="form-grid__wide"><span>Қазақша толық мәтін</span><textarea className="news-content-input" required maxLength={30000} value={form.contentKz} onChange={(event) => setForm({ ...form, contentKz: event.target.value })} placeholder="Абзацтарды бос жолмен бөліңіз" /></label>
        <label className="form-grid__wide"><span>Обложка</span><span className="image-upload-control"><ImagePlus size={20} />{uploading ? 'Загрузка…' : form.image ? 'Заменить изображение' : 'Загрузить изображение'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onUpload} disabled={uploading} /></span><small>JPG, PNG, WebP или GIF, до 5 МБ</small></label>
        <label className="toggle-label form-grid__wide"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked, publishAt: event.target.checked ? form.publishAt : '' })} /><span>Опубликовать или запланировать выпуск</span></label>
        {form.published && <><label><span>Дата и время публикации</span><input type="datetime-local" value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} /><small>Пустое поле — публикация сразу.</small></label><label><span>Показывать до</span><input type="datetime-local" min={form.publishAt || undefined} value={form.expireAt} onChange={(event) => setForm({ ...form, expireAt: event.target.value })} /><small>Необязательно. После этой даты материал исчезнет автоматически.</small></label></>}
      </div>
      <aside className="news-editor__preview">
        <span>Предпросмотр карточки</span><strong className={newsCategoryClass(form.category)}>{newsCategoryLabel(form.category)}</strong>
        <div className="news-editor__image">{form.image ? <img src={assetUrl(form.image)} alt="" /> : <ImagePlus size={38} />}</div>
        <small><CalendarDays size={15} /> Дата публикации</small>
        <h3>{form.titleKz || form.titleRu || 'Жаңалық тақырыбы'}</h3>
        <p>{form.descriptionKz || form.descriptionRu || 'Қысқаша сипаттама жалпы жаңалықтарда көрсетіледі.'}</p>
      </aside>
    </div>
    {error && <div className="form-error">{error}</div>}
    <div className="form-actions"><button type="button" className="admin-button admin-button--secondary" onClick={onCancel}>Отмена</button><button className="admin-button admin-button--primary" disabled={busy || uploading || !form.image}>{busy ? 'Сохранение…' : 'Сохранить'}</button></div>
  </form>;
}

export default function NewsPage() {
  const [rows, setRows] = useState(null); const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', publication: '', category: '', page: 1 }); const [scheduled, setScheduled] = useState([]); const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [response, scheduleResponse] = await Promise.all([
        api.get('/admin/news', { params: { search: filters.search, publication: filters.publication || undefined, category: filters.category || undefined, page: filters.page, limit: 15, sort: 'updatedAt', direction: 'desc' } }),
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
    payload.publishedAt = payload.published && publishAt ? new Date(publishAt).toISOString() : null;
    payload.expiresAt = payload.published && expireAt ? new Date(expireAt).toISOString() : null;
    try { if (id) await api.patch(`/admin/news/${id}`, payload); else await api.post('/admin/news', payload); setEditing(null); setToast({ type: 'success', message: id ? 'Новость обновлена' : 'Новость создана' }); await load(); }
    catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  };
  const changePublication = async (item) => {
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
    <AdminPageHeader eyebrow="Контент" title="Новости" description="Создание, редактирование и публикация материалов корпоративной ленты" actions={<button className="admin-button admin-button--primary" onClick={() => setEditing({ ...blank })}><Plus size={19} />Новая новость</button>} />
    {scheduled.length > 0 && <section className="admin-schedule"><header><div><Clock3 size={20} /><span>Ближайшие публикации</span></div><strong>{scheduled.length}</strong></header><div>{scheduled.map((item) => <button onClick={() => setEditing(toForm(item))} key={item.id}><time>{new Date(item.publishedAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time><span>{item.titleRu}</span><ChevronRight size={17} /></button>)}</div></section>}
    <div className="admin-toolbar admin-toolbar--filters"><label className="admin-search"><Search /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} placeholder="Поиск на русском или казахском" /></label><select value={filters.publication} onChange={(event) => setFilters({ ...filters, publication: event.target.value, page: 1 })}><option value="">Все статусы</option><option value="live">Опубликованные</option><option value="scheduled">Запланированные</option><option value="expired">Срок истёк</option><option value="draft">Черновики</option></select><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })}>{newsCategories.map((item) => <option value={item.value} key={item.value || 'all'}>{item.label}</option>)}</select><span>{meta.total} записей</span></div>
    {error && !editing && <ErrorState title="Не удалось загрузить новости" text={error} onRetry={load} />}
    {!rows && !error ? <LoadingState /> : rows && <div className="admin-card admin-table-wrap"><table className="admin-table"><thead><tr><th>Новость</th><th>Категория</th><th>Порядок</th><th>Статус</th><th>Публикация</th><th>Показывать до</th><th>Обновлена</th><th></th></tr></thead><tbody>{rows.map((item) => { const now = new Date(); const expired = item.published && item.expiresAt && new Date(item.expiresAt) <= now; const isScheduled = item.published && !expired && item.publishedAt && new Date(item.publishedAt) > now; const live = item.published && !expired && !isScheduled; return <tr key={item.id}><td><div className="table-title news-table-title"><span>{item.image ? <img src={assetUrl(item.image)} alt="" /> : <ImagePlus />}</span><div><strong>{item.titleRu}</strong><small>{item.titleKz} · {item.author?.fullName || '—'} · {item.slug}</small></div></div></td><td><span className={newsCategoryClass(item.category)}>{newsCategoryLabel(item.category)}</span></td><td><strong>{item.sortOrder}</strong></td><td><span className={`status-pill ${isScheduled ? 'status-pill--accent' : live ? 'status-pill--success' : 'status-pill--muted'}`}>{expired ? 'Срок истёк' : isScheduled ? 'Запланирована' : live ? 'Опубликована' : 'Черновик'}</span></td><td>{item.publishedAt ? <span className="scheduled-date">{isScheduled && <Clock3 size={14} />}{new Date(item.publishedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> : '—'}</td><td>{item.expiresAt ? <span className="scheduled-date"><CalendarX2 size={14} />{new Date(item.expiresAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> : 'Без срока'}</td><td>{new Date(item.updatedAt).toLocaleDateString('ru-RU')}</td><td><div className="row-actions">{live && <a href={`/news/${item.slug}`} aria-label="Открыть новость"><Eye /></a>}<button onClick={() => changePublication(item)} aria-label={item.published ? 'Снять с публикации' : 'Опубликовать'}>{item.published ? <EyeOff /> : <Eye />}</button><button onClick={() => setEditing(toForm(item))} aria-label="Редактировать"><Edit3 /></button><button onClick={() => setDeleting(item)} aria-label="Удалить"><Trash2 /></button></div></td></tr>; })}</tbody></table></div>}
    {meta.pages > 1 && <div className="pagination"><button disabled={meta.page <= 1} onClick={() => setFilters({ ...filters, page: meta.page - 1 })}><ChevronLeft />Назад</button><span>Страница {meta.page} из {meta.pages}</span><button disabled={meta.page >= meta.pages} onClick={() => setFilters({ ...filters, page: meta.page + 1 })}>Далее<ChevronRight /></button></div>}
    {editing && <Modal title={editing.id ? 'Редактирование новости' : 'Новая новость'} onClose={() => setEditing(null)} wide><NewsForm form={editing} setForm={setEditing} onSubmit={save} onCancel={() => setEditing(null)} onUpload={upload} uploading={uploading} busy={busy} error={error} /></Modal>}
    {deleting && <ConfirmDialog title="Удалить новость?" text={`Новость «${deleting.titleRu}» будет удалена без возможности восстановления.`} onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />}
    <Toast {...toast} onClose={() => setToast(null)} />
  </>;
}
