import { useCallback, useEffect, useState } from 'react';
import {
  Cake,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Film,
  Image as ImageIcon,
  Languages,
  ListVideo,
  MonitorPlay,
  Plus,
  Radio,
  Save,
  Settings2,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { ConfirmDialog, Modal } from '../../components/admin/Modal.jsx';
import { ErrorState, LoadingState } from '../../components/common/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const blank = {
  type: 'BIRTHDAY',
  titleRu: '',
  titleKz: '',
  descriptionRu: '',
  descriptionKz: '',
  mediaUrl: '',
  eventDate: '',
  isActive: true,
  sortOrder: 0,
};

const toForm = (item) => ({
  ...item,
  mediaUrl: item.mediaUrl || '',
  eventDate: item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 10) : '',
});

const eventDateLabel = (eventDate) => (
  eventDate
    ? new Date(eventDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : 'Дата не указана'
);

function ItemForm({ form, setForm, onSubmit, onCancel, onUpload, uploading, busy, error }) {
  const birthday = form.type === 'BIRTHDAY';
  const setType = (type) => setForm({ ...form, type, mediaUrl: '', eventDate: '' });

  return (
    <form className="admin-form broadcast-item-form" onSubmit={onSubmit}>
      <div className="broadcast-type-switch" aria-label="Тип слайда">
        <button type="button" className={birthday ? 'active' : ''} onClick={() => setType('BIRTHDAY')} aria-pressed={birthday}>
          <Cake size={20} />
          <span><strong>День рождения</strong><small>Показывается один раз в году</small></span>
        </button>
        <button type="button" className={!birthday ? 'active' : ''} onClick={() => setType('VIDEO')} aria-pressed={!birthday}>
          <Video size={20} />
          <span><strong>Фото или видеоматериал</strong><small>Постоянный материал в ротации</small></span>
        </button>
      </div>

      <div className="form-grid">
        <label>
          <span>Порядок показа</span>
          <input type="number" min="0" max="10000" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          <small>Чем меньше число, тем раньше материал появится в эфире.</small>
        </label>
        {birthday && <label><span>Дата рождения</span><input required type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} /><small>Год на публичном экране не показывается.</small></label>}
        <label><span>{birthday ? 'Имя сотрудника (русский)' : 'Название видео (русский)'}</span><input required maxLength="240" value={form.titleRu} onChange={(event) => setForm({ ...form, titleRu: event.target.value })} /></label>
        <label><span>{birthday ? 'Қызметкердің аты-жөні (қазақша)' : 'Видео атауы (қазақша)'}</span><input required maxLength="240" value={form.titleKz} onChange={(event) => setForm({ ...form, titleKz: event.target.value })} /></label>
        <label><span>{birthday ? 'Должность и поздравление (русский)' : 'Описание (русский)'}</span><textarea required maxLength="1200" value={form.descriptionRu} onChange={(event) => setForm({ ...form, descriptionRu: event.target.value })} /></label>
        <label><span>{birthday ? 'Лауазымы және құттықтау (қазақша)' : 'Сипаттама (қазақша)'}</span><textarea required maxLength="1200" value={form.descriptionKz} onChange={(event) => setForm({ ...form, descriptionKz: event.target.value })} /></label>
        {!birthday && (
          <label className="form-grid__wide">
            <span>Видеофайл</span>
            <span className="image-upload-control"><Upload size={20} />{uploading ? 'Загрузка…' : form.mediaUrl ? 'Заменить видео' : 'Загрузить видео'}<input type="file" accept="video/mp4,video/webm" onChange={onUpload} disabled={uploading} /></span>
            <small>MP4 или WebM, до 150 МБ. Видео воспроизводится автоматически без звука.</small>
            {form.mediaUrl && <video className="broadcast-video-preview" src={assetUrl(form.mediaUrl)} controls muted />}
          </label>
        )}
        <label className="toggle-label broadcast-active-toggle form-grid__wide"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Показывать материал в эфире</span></label>
      </div>

      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="button" className="admin-button admin-button--secondary" onClick={onCancel}>Отмена</button>
        <button className="admin-button admin-button--primary" disabled={busy || uploading || (!birthday && !form.mediaUrl)}>{busy ? 'Сохранение…' : 'Сохранить слайд'}</button>
      </div>
    </form>
  );
}

export default function BroadcastPage() {
  const { user } = useAuth();
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(user.role);
  const [settings, setSettings] = useState(null);
  const [items, setItems] = useState(null);
  const [slides, setSlides] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [settingsResponse, itemsResponse, broadcastResponse] = await Promise.all([
        api.get('/admin/broadcast/settings'),
        api.get('/admin/broadcast/items'),
        api.get('/broadcast'),
      ]);
      setSettings(settingsResponse.data.data);
      setItems(itemsResponse.data.data);
      setSlides(broadcastResponse.data.data.slides);
    } catch (err) {
      setError(apiMessage(err));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api.patch('/admin/broadcast/settings', settings);
      setSettings(response.data.data);
      setToast({ message: 'Настройки эфира сохранены' });
    } catch (err) {
      setToast({ type: 'error', message: apiMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('video', file);
      const response = await api.post('/admin/broadcast/videos', data);
      setEditing((current) => ({ ...current, mediaUrl: response.data.data.path }));
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const id = editing.id;
    const payload = {
      type: editing.type,
      titleRu: editing.titleRu,
      titleKz: editing.titleKz,
      descriptionRu: editing.descriptionRu,
      descriptionKz: editing.descriptionKz,
      mediaUrl: editing.type === 'VIDEO' ? editing.mediaUrl : null,
      eventDate: editing.type === 'BIRTHDAY' ? editing.eventDate : null,
      isActive: editing.isActive,
      sortOrder: editing.sortOrder,
    };
    try {
      if (id) await api.patch(`/admin/broadcast/items/${id}`, payload);
      else await api.post('/admin/broadcast/items', payload);
      setEditing(null);
      setToast({ message: id ? 'Слайд обновлён' : 'Слайд создан' });
      await load();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/broadcast/items/${deleting.id}`);
      setDeleting(null);
      setToast({ message: 'Слайд удалён' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: apiMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  if (!settings || !items || !slides) {
    return error ? <ErrorState title="Не удалось загрузить эфир" text={error} onRetry={load} /> : <LoadingState />;
  }

  const activeCount = slides.length;
  const photoCount = slides.filter((item) => item.kind === 'NEWS').length;
  const videoCount = items.filter((item) => item.type === 'VIDEO').length;
  const birthdayCount = items.filter((item) => item.type === 'BIRTHDAY').length;

  return (
    <div className="broadcast-admin-page">
      <AdminPageHeader
        eyebrow="Контент"
        title="Эфир"
        description="Управляйте экраном ожидания, ротацией материалов и автоматикой"
        actions={<div className="broadcast-header-actions"><a className="admin-button admin-button--secondary" href="/news" target="_blank" rel="noreferrer"><Eye size={18} />Открыть эфир</a><button className="admin-button admin-button--primary" onClick={() => setEditing({ ...blank })}><Plus size={19} />Добавить слайд</button></div>}
      />

      <section className="broadcast-admin-hero">
        <div className="broadcast-admin-hero__copy">
          <div className="broadcast-live-badge"><span />Эфир активен</div>
          <h2>Новостные фотослайды под контролем</h2>
          <p>Опубликованные новости с фотографиями автоматически собираются в эфир, чередуются на казахском и русском языках, а важная информация остаётся в бегущей строке.</p>
          <div className="broadcast-hero-stats">
            <div><ListVideo size={19} /><span><strong>{activeCount}</strong> слайдов в ротации</span></div>
            <div><ImageIcon size={19} /><span><strong>{photoCount}</strong> новостных фотослайдов</span></div>
            <div><Languages size={19} /><span><strong>{settings.broadcastLanguageSeconds} сек.</strong> до смены языка</span></div>
          </div>
        </div>
        <div className="broadcast-admin-screen" aria-hidden="true">
          <div className="broadcast-admin-screen__bar"><span>ДГД · ЭФИР</span><i>ҚАЗ</i></div>
          <div className="broadcast-admin-screen__visual"><ImageIcon size={32} /><strong>Новостной фотослайд</strong><small>{activeCount ? `${activeCount} слайдов сейчас в эфире` : 'Опубликуйте новости для эфира'}</small></div>
          <div className="broadcast-admin-screen__ticker"><Radio size={13} /><span>{settings.tickerTextRu}</span></div>
        </div>
      </section>

      <form className="broadcast-control-panel" onSubmit={saveSettings}>
        <header className="broadcast-section-heading">
          <div className="broadcast-section-heading__icon"><Settings2 size={21} /></div>
          <div><span>Управление показом</span><h2>Настройки эфира</h2><p>Тексты и тайминги применяются ко всему экрану ожидания.</p></div>
        </header>

        <div className="broadcast-settings-grid">
          <section className="broadcast-settings-card broadcast-settings-card--ticker">
            <header><div><Radio size={18} /></div><span><strong>Бегущая строка</strong><small>Сообщение в нижней части экрана</small></span></header>
            <label><span><i>RU</i> Русский текст</span><textarea required maxLength="1000" value={settings.tickerTextRu} onChange={(event) => setSettings({ ...settings, tickerTextRu: event.target.value })} /></label>
            <label><span><i>KZ</i> Қазақша мәтін</span><textarea required maxLength="1000" value={settings.tickerTextKz} onChange={(event) => setSettings({ ...settings, tickerTextKz: event.target.value })} /></label>
          </section>

          <section className="broadcast-settings-card broadcast-settings-card--timing">
            <header><div><Clock3 size={18} /></div><span><strong>Тайминги и автоматика</strong><small>Все значения указываются в секундах</small></span></header>
            <label><span>Полный цикл слайда</span><div className="broadcast-number-field"><input type="number" min="12" max="240" value={settings.broadcastSlideSeconds} onChange={(event) => setSettings({ ...settings, broadcastSlideSeconds: Number(event.target.value) })} /><b>сек.</b></div><small>Казахская и русская версии вместе.</small></label>
            <label><span>Смена языка</span><div className="broadcast-number-field"><input type="number" min="5" max="120" value={settings.broadcastLanguageSeconds} onChange={(event) => setSettings({ ...settings, broadcastLanguageSeconds: Number(event.target.value) })} /><b>сек.</b></div><small>Когда включить русскую версию слайда.</small></label>
            <label><span>Возврат в эфир</span><div className="broadcast-number-field"><input type="number" min="15" max="1800" value={settings.broadcastIdleSeconds} onChange={(event) => setSettings({ ...settings, broadcastIdleSeconds: Number(event.target.value) })} /><b>сек.</b></div><small>После последнего касания в обычной ленте.</small></label>
          </section>
        </div>

        <footer className="broadcast-settings-footer"><div><CheckCircle2 size={18} /><span>Изменения появятся на экране сразу после сохранения</span></div><button className="admin-button admin-button--primary" disabled={busy}><Save size={18} />{busy ? 'Сохранение…' : 'Сохранить настройки'}</button></footer>
      </form>

      <section className="broadcast-materials">
        <header className="broadcast-materials__header">
          <div><span>Дополнения к фотослайдам</span><h2>Дополнительные материалы</h2><p>Видео и поздравления добавляются в ротацию вместе с новостными фотослайдами.</p></div>
          <div className="broadcast-materials__summary"><span><ImageIcon size={16} />{photoCount} фотослайдов</span><span><Video size={16} />{videoCount} видео</span><span><Cake size={16} />{birthdayCount} поздравлений</span></div>
        </header>

        {items.length ? (
          <div className="broadcast-material-grid">
            {items.map((item, index) => {
              const birthday = item.type === 'BIRTHDAY';
              return (
                <article className={`broadcast-material-card ${item.isActive ? '' : 'is-inactive'}`} key={item.id}>
                  <div className={`broadcast-material-card__visual broadcast-material-card__visual--${birthday ? 'birthday' : 'video'}`}>
                    <span className="broadcast-material-card__order">{String(index + 1).padStart(2, '0')}</span>
                    {birthday ? <Cake size={34} /> : <MonitorPlay size={38} />}
                    <small>{birthday ? eventDateLabel(item.eventDate) : 'Видеоматериал'}</small>
                  </div>
                  <div className="broadcast-material-card__body">
                    <div className="broadcast-material-card__meta"><span>{birthday ? <Cake size={14} /> : <Video size={14} />}{birthday ? 'Поздравление' : 'Видео'}</span><span className={`status-pill ${item.isActive ? 'status-pill--success' : 'status-pill--muted'}`}>{item.isActive ? 'В эфире' : 'Отключён'}</span></div>
                    <h3>{item.titleRu}</h3>
                    <p>{item.titleKz}</p>
                    <div className="broadcast-material-card__condition">{birthday ? <><CalendarDays size={15} /><span>Показ {eventDateLabel(item.eventDate)}</span></> : <><Film size={15} /><span>Показывается постоянно</span></>}</div>
                    <footer><span>Порядок: {item.sortOrder}</span><div className="row-actions"><button type="button" onClick={() => setEditing(toForm(item))} aria-label="Редактировать"><Edit3 /></button>{canDelete && <button type="button" onClick={() => setDeleting(item)} aria-label="Удалить"><Trash2 /></button>}</div></footer>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="broadcast-materials-empty"><MonitorPlay size={34} /><h3>В эфире пока нет дополнительных материалов</h3><p>Добавьте фото или видеоматериал — новости продолжат показываться автоматически.</p><button className="admin-button admin-button--primary" onClick={() => setEditing({ ...blank })}><Plus size={18} />Добавить слайд</button></div>
        )}
      </section>

      {editing && <Modal title={editing.id ? 'Редактирование слайда' : 'Новый слайд'} onClose={() => setEditing(null)} wide><ItemForm form={editing} setForm={setEditing} onSubmit={saveItem} onCancel={() => setEditing(null)} onUpload={upload} uploading={uploading} busy={busy} error={error} /></Modal>}
      {deleting && <ConfirmDialog title="Удалить слайд?" text={`«${deleting.titleRu}» будет удалён без возможности восстановления.`} onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />}
      <Toast {...toast} onClose={() => setToast(null)} />
    </div>
  );
}
