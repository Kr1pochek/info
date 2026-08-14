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
import { useAdminI18n } from '../../utils/adminLocalization.js';

const blank = {
  type: 'VIDEO',
  titleRu: '',
  titleKz: '',
  descriptionRu: '',
  descriptionKz: '',
  mediaUrl: '',
  mediaKind: 'IMAGE',
  eventDate: '',
  isActive: true,
  sortOrder: 0,
};

const toForm = (item) => ({
  ...item,
  mediaUrl: item.mediaUrl || '',
  mediaKind: item.mediaKind || (/\.(?:jpe?g|png|webp|gif)$/i.test(item.mediaUrl || '') ? 'IMAGE' : 'VIDEO'),
  eventDate: item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 10) : '',
});

const eventDateLabel = (eventDate, locale, missingLabel) => (
  eventDate
    ? new Date(eventDate).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
    : missingLabel
);

function ItemForm({ form, setForm, onSubmit, onCancel, onUpload, uploading, busy, error }) {
  const { tr } = useAdminI18n();
  const birthday = form.type === 'BIRTHDAY';
  const image = !birthday && form.mediaKind === 'IMAGE';
  const setType = (type) => setForm({ ...form, type, mediaUrl: '', mediaKind: type === 'VIDEO' ? 'IMAGE' : null, eventDate: '' });

  return (
    <form className="admin-form broadcast-item-form" onSubmit={onSubmit}>
      <div className="broadcast-type-switch" aria-label={tr('Тип слайда', 'Слайд түрі')}>
        <button type="button" className={birthday ? 'active' : ''} onClick={() => setType('BIRTHDAY')} aria-pressed={birthday}>
          <Cake size={20} />
          <span><strong>{tr('День рождения', 'Туған күн')}</strong><small>{tr('Показывается один раз в году', 'Жылына бір рет көрсетіледі')}</small></span>
        </button>
        <button type="button" className={!birthday ? 'active' : ''} onClick={() => setType('VIDEO')} aria-pressed={!birthday}>
          <Video size={20} />
          <span><strong>{tr('Фото или видеоматериал', 'Фото немесе бейнематериал')}</strong><small>{tr('Постоянный материал в ротации', 'Ротациядағы тұрақты материал')}</small></span>
        </button>
      </div>

      <div className="form-grid">
        <label>
          <span>{tr('Порядок показа', 'Көрсету реті')}</span>
          <input type="number" min="0" max="10000" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          <small>{tr('Чем меньше число, тем раньше материал появится в эфире.', 'Сан неғұрлым аз болса, материал эфирде соғұрлым ертерек шығады.')}</small>
        </label>
        {birthday && <label><span>{tr('Дата рождения', 'Туған күні')}</span><input required type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} /><small>{tr('Год на публичном экране не показывается.', 'Жыл жалпы экранда көрсетілмейді.')}</small></label>}
        <label><span>{birthday ? tr('Имя сотрудника (русский)', 'Қызметкердің аты-жөні (орысша)') : tr('Название материала (русский)', 'Материал атауы (орысша)')}</span><input required maxLength="240" value={form.titleRu} onChange={(event) => setForm({ ...form, titleRu: event.target.value })} /></label>
        <label><span>{birthday ? tr('Имя сотрудника (казахский)', 'Қызметкердің аты-жөні (қазақша)') : tr('Название материала (казахский)', 'Материал атауы (қазақша)')}</span><input required maxLength="240" value={form.titleKz} onChange={(event) => setForm({ ...form, titleKz: event.target.value })} /></label>
        <label><span>{birthday ? tr('Должность и поздравление (русский)', 'Лауазымы және құттықтау (орысша)') : tr('Описание (русский)', 'Сипаттамасы (орысша)')}</span><textarea required maxLength="1200" value={form.descriptionRu} onChange={(event) => setForm({ ...form, descriptionRu: event.target.value })} /></label>
        <label><span>{birthday ? tr('Должность и поздравление (казахский)', 'Лауазымы және құттықтау (қазақша)') : tr('Описание (казахский)', 'Сипаттамасы (қазақша)')}</span><textarea required maxLength="1200" value={form.descriptionKz} onChange={(event) => setForm({ ...form, descriptionKz: event.target.value })} /></label>
        {!birthday && (
          <label className="form-grid__wide">
            <span>{tr('Фото или видео', 'Фото немесе бейне')}</span>
            <span className="image-upload-control"><Upload size={20} />{uploading ? tr('Загрузка…') : form.mediaUrl ? tr('Заменить файл', 'Файлды ауыстыру') : tr('Загрузить файл', 'Файлды жүктеу')}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={onUpload} disabled={uploading} /></span>
            <small>{tr('JPG, PNG, WebP, GIF, MP4 или WebM. Видео воспроизводится автоматически без звука.', 'JPG, PNG, WebP, GIF, MP4 немесе WebM. Бейне дыбыссыз автоматты түрде ойнатылады.')}</small>
            {form.mediaUrl && (image ? <img className="broadcast-media-preview" src={assetUrl(form.mediaUrl)} alt={tr('Предпросмотр материала', 'Материалды алдын ала қарау')} /> : <video className="broadcast-media-preview" src={assetUrl(form.mediaUrl)} controls muted />)}
          </label>
        )}
        <label className="toggle-label broadcast-active-toggle form-grid__wide"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>{tr('Показывать материал в эфире', 'Материалды эфирде көрсету')}</span></label>
      </div>

      {error && <div className="form-error">{tr(error)}</div>}
      <div className="form-actions">
        <button type="button" className="admin-button admin-button--secondary" onClick={onCancel}>{tr('Отмена')}</button>
        <button className="admin-button admin-button--primary" disabled={busy || uploading || (!birthday && !form.mediaUrl)}>{busy ? tr('Сохранение…') : tr('Сохранить слайд', 'Слайдты сақтау')}</button>
      </div>
    </form>
  );
}

export default function BroadcastPage() {
  const { language, locale, tr } = useAdminI18n();
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
      data.append('media', file);
      const response = await api.post('/admin/broadcast/media', data);
      setEditing((current) => ({ ...current, mediaUrl: response.data.data.path, mediaKind: response.data.data.mediaKind }));
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
      mediaKind: editing.type === 'VIDEO' ? editing.mediaKind : null,
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
    return error ? <ErrorState title={tr('Не удалось загрузить эфир', 'Эфирді жүктеу мүмкін болмады')} text={error} onRetry={load} /> : <LoadingState />;
  }

  const activeCount = slides.length;
  const photoCount = slides.filter((item) => item.kind === 'NEWS' || item.kind === 'IMAGE').length;
  const videoCount = items.filter((item) => item.type === 'VIDEO' && item.mediaKind !== 'IMAGE').length;
  const birthdayCount = items.filter((item) => item.type === 'BIRTHDAY').length;

  return (
    <div className="broadcast-admin-page">
      <AdminPageHeader
        eyebrow="Контент"
        eyebrowKz="Контент"
        title="Эфир"
        titleKz="Эфир"
        description="Управляйте экраном ожидания, ротацией материалов и автоматикой"
        descriptionKz="Күту экранын, материалдар ротациясын және автоматиканы басқарыңыз"
        actions={<div className="broadcast-header-actions"><a className="admin-button admin-button--secondary" href="/news" target="_blank" rel="noreferrer"><Eye size={18} />{tr('Открыть эфир', 'Эфирді ашу')}</a><button className="admin-button admin-button--primary" onClick={() => setEditing({ ...blank })}><Plus size={19} />{tr('Добавить слайд', 'Слайд қосу')}</button></div>}
      />

      <section className="broadcast-admin-hero">
        <div className="broadcast-admin-hero__copy">
          <div className="broadcast-live-badge"><span />{tr('Эфир активен', 'Эфир белсенді')}</div>
          <h2>{tr('Новостные фотослайды под контролем', 'Жаңалық фотослайдтары бақылауда')}</h2>
          <p>{tr('Опубликованные новости с фотографиями автоматически собираются в эфир, чередуются на казахском и русском языках, а важная информация остаётся в бегущей строке.', 'Фотосуреті бар жарияланған жаңалықтар эфирге автоматты жиналып, қазақ және орыс тілдерінде кезектеседі, ал маңызды ақпарат жүгіртпе жолда қалады.')}</p>
          <div className="broadcast-hero-stats">
            <div><ListVideo size={19} /><span><strong>{activeCount}</strong> {tr('слайдов в ротации', 'слайд ротацияда')}</span></div>
            <div><ImageIcon size={19} /><span><strong>{photoCount}</strong> {tr('фотослайдов', 'фотослайд')}</span></div>
            <div><Languages size={19} /><span><strong>{settings.broadcastLanguageSeconds} {tr('сек.', 'сек.')}</strong> {tr('до смены языка', 'тіл ауысқанға дейін')}</span></div>
          </div>
        </div>
        <div className="broadcast-admin-screen" aria-hidden="true">
          <div className="broadcast-admin-screen__bar"><span>{tr('ДГД · ЭФИР', 'МКД · ЭФИР')}</span><i>{language === 'kz' ? 'ҚАЗ' : 'РУС'}</i></div>
          <div className="broadcast-admin-screen__visual"><ImageIcon size={32} /><strong>{tr('Новостной фотослайд', 'Жаңалық фотослайды')}</strong><small>{activeCount ? tr(`${activeCount} слайдов сейчас в эфире`, `Қазір эфирде ${activeCount} слайд`) : tr('Опубликуйте новости для эфира', 'Эфирге жаңалықтарды жариялаңыз')}</small></div>
          <div className="broadcast-admin-screen__ticker"><Radio size={13} /><span>{settings[language === 'kz' ? 'tickerTextKz' : 'tickerTextRu']}</span></div>
        </div>
      </section>

      <form className="broadcast-control-panel" onSubmit={saveSettings}>
        <header className="broadcast-section-heading">
          <div className="broadcast-section-heading__icon"><Settings2 size={21} /></div>
          <div><span>{tr('Управление показом', 'Көрсетуді басқару')}</span><h2>{tr('Настройки эфира', 'Эфир баптаулары')}</h2><p>{tr('Тексты и тайминги применяются ко всему экрану ожидания.', 'Мәтіндер мен уақыт параметрлері бүкіл күту экранына қолданылады.')}</p></div>
        </header>

        <div className="broadcast-settings-grid">
          <section className="broadcast-settings-card broadcast-settings-card--ticker">
            <header><div><Radio size={18} /></div><span><strong>{tr('Бегущая строка', 'Жүгіртпе жол')}</strong><small>{tr('Сообщение в нижней части экрана', 'Экранның төменгі бөлігіндегі хабарлама')}</small></span></header>
            <label><span><i>RU</i> {tr('Русский текст', 'Орысша мәтін')}</span><textarea required maxLength="1000" value={settings.tickerTextRu} onChange={(event) => setSettings({ ...settings, tickerTextRu: event.target.value })} /></label>
            <label><span><i>KZ</i> {tr('Казахский текст', 'Қазақша мәтін')}</span><textarea required maxLength="1000" value={settings.tickerTextKz} onChange={(event) => setSettings({ ...settings, tickerTextKz: event.target.value })} /></label>
          </section>

          <section className="broadcast-settings-card broadcast-settings-card--timing">
            <header><div><Clock3 size={18} /></div><span><strong>{tr('Тайминги и автоматика', 'Уақыт және автоматика')}</strong><small>{tr('Все значения указываются в секундах', 'Барлық мән секундпен көрсетіледі')}</small></span></header>
            <label><span>{tr('Полный цикл слайда', 'Слайдтың толық циклі')}</span><div className="broadcast-number-field"><input type="number" min="12" max="240" value={settings.broadcastSlideSeconds} onChange={(event) => setSettings({ ...settings, broadcastSlideSeconds: Number(event.target.value) })} /><b>{tr('сек.', 'сек.')}</b></div><small>{tr('Казахская и русская версии вместе.', 'Қазақша және орысша нұсқалар бірге.')}</small></label>
            <label><span>{tr('Смена языка', 'Тілді ауыстыру')}</span><div className="broadcast-number-field"><input type="number" min="5" max="120" value={settings.broadcastLanguageSeconds} onChange={(event) => setSettings({ ...settings, broadcastLanguageSeconds: Number(event.target.value) })} /><b>{tr('сек.', 'сек.')}</b></div><small>{tr('Когда включить русскую версию слайда.', 'Слайдтың орысша нұсқасын қашан қосу керек.')}</small></label>
            <label><span>{tr('Возврат в эфир', 'Эфирге оралу')}</span><div className="broadcast-number-field"><input type="number" min="15" max="1800" value={settings.broadcastIdleSeconds} onChange={(event) => setSettings({ ...settings, broadcastIdleSeconds: Number(event.target.value) })} /><b>{tr('сек.', 'сек.')}</b></div><small>{tr('После последнего касания в обычной ленте.', 'Қалыпты таспадағы соңғы түртуден кейін.')}</small></label>
          </section>
        </div>

        <footer className="broadcast-settings-footer"><div><CheckCircle2 size={18} /><span>{tr('Изменения появятся на экране сразу после сохранения', 'Өзгерістер сақталғаннан кейін экранда бірден көрінеді')}</span></div><button className="admin-button admin-button--primary" disabled={busy}><Save size={18} />{busy ? tr('Сохранение…') : tr('Сохранить настройки', 'Баптауларды сақтау')}</button></footer>
      </form>

      <section className="broadcast-materials">
        <header className="broadcast-materials__header">
          <div><span>{tr('Дополнения к фотослайдам', 'Фотослайдтарға толықтырулар')}</span><h2>{tr('Дополнительные материалы', 'Қосымша материалдар')}</h2><p>{tr('Видео и поздравления добавляются в ротацию вместе с новостными фотослайдами.', 'Бейне мен құттықтаулар жаңалық фотослайдтарымен бірге ротацияға қосылады.')}</p></div>
          <div className="broadcast-materials__summary"><span><ImageIcon size={16} />{photoCount} {tr('фотослайдов', 'фотослайд')}</span><span><Video size={16} />{videoCount} {tr('видео', 'бейне')}</span><span><Cake size={16} />{birthdayCount} {tr('поздравлений', 'құттықтау')}</span></div>
        </header>

        {items.length ? (
          <div className="broadcast-material-grid">
            {items.map((item, index) => {
              const birthday = item.type === 'BIRTHDAY';
              const image = !birthday && item.mediaKind === 'IMAGE';
              return (
                <article className={`broadcast-material-card ${item.isActive ? '' : 'is-inactive'}`} key={item.id}>
                  <div className={`broadcast-material-card__visual broadcast-material-card__visual--${birthday ? 'birthday' : 'video'}`}>
                    <span className="broadcast-material-card__order">{String(index + 1).padStart(2, '0')}</span>
                    {birthday ? <Cake size={34} /> : image ? <ImageIcon size={38} /> : <MonitorPlay size={38} />}
                    <small>{birthday ? eventDateLabel(item.eventDate, locale, tr('Дата не указана', 'Күні көрсетілмеген')) : image ? tr('Фотоматериал', 'Фотоматериал') : tr('Видеоматериал', 'Бейнематериал')}</small>
                  </div>
                  <div className="broadcast-material-card__body">
                    <div className="broadcast-material-card__meta"><span>{birthday ? <Cake size={14} /> : image ? <ImageIcon size={14} /> : <Video size={14} />}{birthday ? tr('Поздравление', 'Құттықтау') : image ? tr('Фото', 'Фото') : tr('Видео', 'Бейне')}</span><span className={`status-pill ${item.isActive ? 'status-pill--success' : 'status-pill--muted'}`}>{item.isActive ? tr('В эфире', 'Эфирде') : tr('Отключён', 'Өшірілген')}</span></div>
                    <h3>{item[language === 'kz' ? 'titleKz' : 'titleRu']}</h3>
                    <p>{item[language === 'kz' ? 'titleRu' : 'titleKz']}</p>
                    <div className="broadcast-material-card__condition">{birthday ? <><CalendarDays size={15} /><span>{tr('Показ', 'Көрсету')}: {eventDateLabel(item.eventDate, locale, tr('Дата не указана', 'Күні көрсетілмеген'))}</span></> : <>{image ? <ImageIcon size={15} /> : <Film size={15} />}<span>{tr('Показывается постоянно', 'Тұрақты көрсетіледі')}</span></>}</div>
                    <footer><span>{tr('Порядок')}: {item.sortOrder}</span><div className="row-actions"><button type="button" onClick={() => setEditing(toForm(item))} aria-label={tr('Редактировать', 'Өңдеу')}><Edit3 /></button><button type="button" onClick={() => setDeleting(item)} aria-label={tr('Удалить')}><Trash2 /></button></div></footer>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="broadcast-materials-empty"><MonitorPlay size={34} /><h3>{tr('В эфире пока нет дополнительных материалов', 'Эфирде әзірге қосымша материалдар жоқ')}</h3><p>{tr('Добавьте фото или видеоматериал — новости продолжат показываться автоматически.', 'Фото немесе бейнематериал қосыңыз — жаңалықтар автоматты көрсетіле береді.')}</p><button className="admin-button admin-button--primary" onClick={() => setEditing({ ...blank })}><Plus size={18} />{tr('Добавить слайд', 'Слайд қосу')}</button></div>
        )}
      </section>

      {editing && <Modal title={editing.id ? 'Редактирование слайда' : 'Новый слайд'} titleKz={editing.id ? 'Слайдты өңдеу' : 'Жаңа слайд'} onClose={() => setEditing(null)} wide><ItemForm form={editing} setForm={setEditing} onSubmit={saveItem} onCancel={() => setEditing(null)} onUpload={upload} uploading={uploading} busy={busy} error={error} /></Modal>}
      {deleting && <ConfirmDialog title="Удалить слайд?" titleKz="Слайдты жою керек пе?" text={`«${deleting.titleRu}» будет удалён без возможности восстановления.`} textKz={`«${deleting.titleKz}» қалпына келтіру мүмкіндігінсіз жойылады.`} onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />}
      <Toast {...toast} onClose={() => setToast(null)} />
    </div>
  );
}
