import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, ImagePlus, Plus, QrCode, Save, Settings2, Trash2, UserRoundCheck } from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { LoadingState } from '../../components/common/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const makeId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;

function Section({ icon: Icon = Settings2, title, description, children }) {
  return <section className="admin-card settings-section"><header><Icon /><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(null); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(''); const [toast, setToast] = useState(null); const [error, setError] = useState('');
  const criticalDisabled = user.role !== 'SUPER_ADMIN';
  const load = useCallback(async () => { try { const response = await api.get('/admin/settings'); setForm(response.data.data); } catch (err) { setToast({ type: 'error', message: apiMessage(err) }); } }, []);
  useEffect(() => { load(); }, [load]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateItem = (key, index, field, value) => update(key, form[key].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const removeItem = (key, index) => update(key, form[key].filter((_, itemIndex) => itemIndex !== index));
  const uploadImage = async (event, target, onReady) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(target); setError('');
    try { const data = new FormData(); data.append('media', file); const response = await api.post('/admin/broadcast/media', data); onReady(response.data.data.path); }
    catch (err) { setError(apiMessage(err)); }
    finally { setUploading(''); event.target.value = ''; }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const payload = { ...form }; delete payload.id; delete payload.updatedAt; const response = await api.patch('/admin/settings', payload); setForm(response.data.data); setToast({ message: 'Настройки сохранены' }); }
    catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  };
  if (!form) return <LoadingState text="Загрузка настроек…" />;
  return <><AdminPageHeader eyebrow="Система" title="Настройки инфокиоска" description="Контент сенсорного киоска и информационной ТВ‑панели" />
    <form className="settings-layout" onSubmit={save}>
      <Section title="Организация и контакты" description="Основная информация для посетителей киоска"><div className="form-grid settings-fields">
        <label><span>Название (русский)</span><input required disabled={criticalDisabled} maxLength={240} value={form.organizationNameRu} onChange={(e) => update('organizationNameRu', e.target.value)} /></label>
        <label><span>Название (қазақша)</span><input required disabled={criticalDisabled} maxLength={240} value={form.organizationNameKz} onChange={(e) => update('organizationNameKz', e.target.value)} /></label>
        <label><span>Телефон</span><input required maxLength={80} value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} /></label>
        <label><span>Язык по умолчанию</span><select disabled={criticalDisabled} value={form.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value)}><option value="ru">Русский</option><option value="kz">Қазақша</option></select></label>
        <label><span>Адрес (русский)</span><textarea required maxLength={500} value={form.addressRu} onChange={(e) => update('addressRu', e.target.value)} /></label>
        <label><span>Адрес (қазақша)</span><textarea required maxLength={500} value={form.addressKz} onChange={(e) => update('addressKz', e.target.value)} /></label>
        <label><span>График (русский)</span><textarea required maxLength={300} value={form.workingHoursRu} onChange={(e) => update('workingHoursRu', e.target.value)} /></label>
        <label><span>График (қазақша)</span><textarea required maxLength={300} value={form.workingHoursKz} onChange={(e) => update('workingHoursKz', e.target.value)} /></label>
      </div></Section>

      <Section title="Права и обязанности налогоплательщика" description="Двуязычный текст для нового раздела киоска"><div className="form-grid settings-fields"><label><span>Текст (русский)</span><textarea className="settings-long-text" maxLength={30000} value={form.taxpayerRightsRu} onChange={(e) => update('taxpayerRightsRu', e.target.value)} /></label><label><span>Мәтін (қазақша)</span><textarea className="settings-long-text" maxLength={30000} value={form.taxpayerRightsKz} onChange={(e) => update('taxpayerRightsKz', e.target.value)} /></label></div></Section>

      <Section icon={UserRoundCheck} title="Уполномоченный по этике" description="ФИО, фотография и контакты на двух языках"><div className="form-grid settings-fields">
        <label><span>ФИО (русский)</span><input maxLength={240} value={form.ethicsOfficerNameRu} onChange={(e) => update('ethicsOfficerNameRu', e.target.value)} /></label><label><span>Аты-жөні (қазақша)</span><input maxLength={240} value={form.ethicsOfficerNameKz} onChange={(e) => update('ethicsOfficerNameKz', e.target.value)} /></label>
        <label><span>Контакты (русский)</span><textarea maxLength={1000} value={form.ethicsOfficerContactsRu} onChange={(e) => update('ethicsOfficerContactsRu', e.target.value)} /></label><label><span>Байланыс (қазақша)</span><textarea maxLength={1000} value={form.ethicsOfficerContactsKz} onChange={(e) => update('ethicsOfficerContactsKz', e.target.value)} /></label>
        <label className="form-grid__wide"><span>Фотография</span><span className="image-upload-control"><ImagePlus size={20} />{uploading === 'ethics' ? 'Загрузка…' : form.ethicsOfficerPhoto ? 'Заменить фотографию' : 'Загрузить фотографию'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(e) => uploadImage(e, 'ethics', (path) => update('ethicsOfficerPhoto', path))} /></span></label>
        {form.ethicsOfficerPhoto && <img className="settings-photo-preview" src={assetUrl(form.ethicsOfficerPhoto)} alt="" />}
      </div></Section>

      <Section icon={CalendarClock} title="Сроки отчётности и уплаты налогов" description="На киоске автоматически показывается обратный отсчёт до ближайших активных дат"><div className="settings-repeater">
        {form.reportingDeadlines.map((item, index) => <fieldset className="settings-repeat-card" key={item.id}><div className="form-grid">
          <label><span>Название (русский)</span><input required maxLength={240} value={item.titleRu} onChange={(e) => updateItem('reportingDeadlines', index, 'titleRu', e.target.value)} /></label><label><span>Атауы (қазақша)</span><input required maxLength={240} value={item.titleKz} onChange={(e) => updateItem('reportingDeadlines', index, 'titleKz', e.target.value)} /></label>
          <label><span>Дата</span><input required type="date" value={item.date} onChange={(e) => updateItem('reportingDeadlines', index, 'date', e.target.value)} /></label><label><span>Тип</span><select value={item.kind} onChange={(e) => updateItem('reportingDeadlines', index, 'kind', e.target.value)}><option value="MONTHLY">Ежемесячная отчётность</option><option value="QUARTERLY">Квартальная отчётность</option><option value="HALF_YEAR">Полугодовая отчётность</option><option value="TAX">Уплата налогов</option></select></label>
        </div><div className="settings-repeat-actions"><label className="toggle-label"><input type="checkbox" checked={item.isActive} onChange={(e) => updateItem('reportingDeadlines', index, 'isActive', e.target.checked)} /><span>Показывать</span></label><button type="button" className="admin-button admin-button--danger" onClick={() => removeItem('reportingDeadlines', index)}><Trash2 size={17} />Удалить</button></div></fieldset>)}
        <button type="button" className="admin-button" onClick={() => update('reportingDeadlines', [...form.reportingDeadlines, { id: makeId('deadline'), titleRu: '', titleKz: '', date: '', kind: 'MONTHLY', isActive: true }])}><Plus size={18} />Добавить дату</button>
      </div></Section>

      <Section icon={QrCode} title="QR‑коды ТВ‑панели" description="Блок скрыт на панели, пока изображения QR‑кодов не загружены"><div className="settings-repeater">
        {form.panelQrCodes.map((item, index) => <fieldset className="settings-repeat-card" key={item.id}><div className="form-grid"><label><span>Подпись (русский)</span><input required maxLength={160} value={item.labelRu} onChange={(e) => updateItem('panelQrCodes', index, 'labelRu', e.target.value)} /></label><label><span>Қолтаңба (қазақша)</span><input required maxLength={160} value={item.labelKz} onChange={(e) => updateItem('panelQrCodes', index, 'labelKz', e.target.value)} /></label><label className="form-grid__wide"><span>Ссылка (необязательно)</span><input type="url" maxLength={500} value={item.url} onChange={(e) => updateItem('panelQrCodes', index, 'url', e.target.value)} /></label><label className="form-grid__wide"><span>Изображение QR‑кода</span><span className="image-upload-control"><ImagePlus size={20} />{uploading === `qr-${index}` ? 'Загрузка…' : item.image ? 'Заменить QR‑код' : 'Загрузить QR‑код'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(e) => uploadImage(e, `qr-${index}`, (path) => updateItem('panelQrCodes', index, 'image', path))} /></span></label>{item.image && <img className="settings-qr-preview" src={assetUrl(item.image)} alt="" />}</div><div className="settings-repeat-actions"><label className="toggle-label"><input type="checkbox" checked={item.isActive} onChange={(e) => updateItem('panelQrCodes', index, 'isActive', e.target.checked)} /><span>Показывать</span></label><button type="button" className="admin-button admin-button--danger" onClick={() => removeItem('panelQrCodes', index)}><Trash2 size={17} />Удалить</button></div></fieldset>)}
        <button type="button" className="admin-button" onClick={() => update('panelQrCodes', [...form.panelQrCodes, { id: makeId('qr'), labelRu: '', labelKz: '', image: '', url: '', isActive: true }])}><Plus size={18} />Добавить QR‑код</button>
      </div></Section>

      <Section icon={UserRoundCheck} title="Специалисты онлайн на сегодня" description="Карточки специалистов для ТВ‑панели"><div className="settings-repeater">
        {form.onlineSpecialists.map((item, index) => <fieldset className="settings-repeat-card" key={item.id}><div className="form-grid"><label><span>ФИО (русский)</span><input required maxLength={240} value={item.nameRu} onChange={(e) => updateItem('onlineSpecialists', index, 'nameRu', e.target.value)} /></label><label><span>Аты-жөні (қазақша)</span><input required maxLength={240} value={item.nameKz} onChange={(e) => updateItem('onlineSpecialists', index, 'nameKz', e.target.value)} /></label><label><span>Категория (русский)</span><input required maxLength={240} value={item.categoryRu} onChange={(e) => updateItem('onlineSpecialists', index, 'categoryRu', e.target.value)} /></label><label><span>Санат (қазақша)</span><input required maxLength={240} value={item.categoryKz} onChange={(e) => updateItem('onlineSpecialists', index, 'categoryKz', e.target.value)} /></label><label><span>Услуги (русский)</span><textarea required maxLength={1000} value={item.servicesRu} onChange={(e) => updateItem('onlineSpecialists', index, 'servicesRu', e.target.value)} /></label><label><span>Қызметтер (қазақша)</span><textarea required maxLength={1000} value={item.servicesKz} onChange={(e) => updateItem('onlineSpecialists', index, 'servicesKz', e.target.value)} /></label><label><span>Дата работы</span><input required type="date" value={item.workDate} onChange={(e) => updateItem('onlineSpecialists', index, 'workDate', e.target.value)} /></label><label><span>Фотография</span><span className="image-upload-control"><ImagePlus size={20} />{uploading === `specialist-${index}` ? 'Загрузка…' : item.photo ? 'Заменить фотографию' : 'Загрузить фотографию'}<input required={!item.photo} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(e) => uploadImage(e, `specialist-${index}`, (path) => updateItem('onlineSpecialists', index, 'photo', path))} /></span></label>{item.photo && <img className="settings-photo-preview" src={assetUrl(item.photo)} alt="" />}</div><div className="settings-repeat-actions"><label className="toggle-label"><input type="checkbox" checked={item.isActive} onChange={(e) => updateItem('onlineSpecialists', index, 'isActive', e.target.checked)} /><span>Показывать</span></label><button type="button" className="admin-button admin-button--danger" onClick={() => removeItem('onlineSpecialists', index)}><Trash2 size={17} />Удалить</button></div></fieldset>)}
        <button type="button" className="admin-button" onClick={() => update('onlineSpecialists', [...form.onlineSpecialists, { id: makeId('specialist'), nameRu: '', nameKz: '', categoryRu: '', categoryKz: '', servicesRu: '', servicesKz: '', photo: '', workDate: '', isActive: true }])}><Plus size={18} />Добавить специалиста</button>
      </div></Section>

      <Section title="Сеанс и техническое обслуживание" description="Параметры поведения сенсорного интерфейса"><div className="form-grid settings-fields"><label><span>Бездействие, секунд</span><input type="number" min="30" max="3600" required disabled={criticalDisabled} value={form.inactivitySeconds} onChange={(e) => update('inactivitySeconds', Number(e.target.value))} /></label><label><span>Предупреждение, секунд</span><input type="number" min="5" max="120" required disabled={criticalDisabled} value={form.warningSeconds} onChange={(e) => update('warningSeconds', Number(e.target.value))} /></label><label><span>Популярных услуг</span><input type="number" min="1" max="20" required value={form.popularServicesCount} onChange={(e) => update('popularServicesCount', Number(e.target.value))} /></label><p className="settings-note">Дата и время показываются постоянно согласно обновлённому ТЗ.</p></div><label className="toggle-label maintenance-toggle"><input type="checkbox" disabled={criticalDisabled} checked={form.maintenanceMode} onChange={(e) => update('maintenanceMode', e.target.checked)} /><span>Режим технического обслуживания</span></label><div className="form-grid settings-fields"><label><span>Сообщение (русский)</span><textarea required maxLength={500} value={form.maintenanceMessageRu} onChange={(e) => update('maintenanceMessageRu', e.target.value)} /></label><label><span>Хабарлама (қазақша)</span><textarea required maxLength={500} value={form.maintenanceMessageKz} onChange={(e) => update('maintenanceMessageKz', e.target.value)} /></label></div></Section>
      {error && <div className="form-error">{error}</div>}<div className="settings-save"><button className="admin-button admin-button--primary" disabled={busy || Boolean(uploading)}><Save size={19} />{busy ? 'Сохранение…' : 'Сохранить настройки'}</button></div>
    </form><Toast {...toast} onClose={() => setToast(null)} /></>;
}
