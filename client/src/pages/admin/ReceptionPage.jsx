import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, ImagePlus, Plus, QrCode, Save, Trash2 } from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const makeId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
const newScheduleItem = () => ({ id: makeId('reception'), nameRu: '', nameKz: '', positionRu: '', positionKz: '', dayRu: '', dayKz: '', time: '', addressRu: '', addressKz: '', isActive: true });
const newDistrictQrCode = () => ({ id: makeId('district-qr'), titleRu: '', titleKz: '', image: '', isActive: true });
const newCustomsQrCode = () => ({ id: makeId('customs-qr'), code: '', titleRu: '', titleKz: '', addressRu: '', addressKz: '', targetTypeRu: 'Адрес в 2GIS', targetTypeKz: '2GIS мекенжайы', targetUrl: '', image: '', isActive: true });
const asArray = (value) => Array.isArray(value) ? value : [];
const normalizeScheduleItem = (item) => ({ ...newScheduleItem(), ...item, id: item?.id || makeId('reception'), isActive: item?.isActive !== false });
const normalizeDistrictQrCode = (item) => ({ ...newDistrictQrCode(), ...item, id: item?.id || makeId('district-qr'), isActive: item?.isActive !== false });
const normalizeCustomsQrCode = (item) => ({ ...newCustomsQrCode(), ...item, id: item?.id || makeId('customs-qr'), isActive: item?.isActive !== false });
const normalizeReceptionForm = (data) => ({
  receptionSchedule: asArray(data?.receptionSchedule).map(normalizeScheduleItem),
  districtQrCodes: asArray(data?.districtQrCodes).map(normalizeDistrictQrCode),
  customsQrCodes: asArray(data?.customsQrCodes).map(normalizeCustomsQrCode),
});

function Section({ icon: Icon, title, titleKz, description, descriptionKz, children }) {
  const { tr } = useAdminI18n();
  return <section className="admin-card settings-section"><header><Icon /><div><h2>{tr(title, titleKz)}</h2><p>{tr(description, descriptionKz)}</p></div></header>{children}</section>;
}

function QrListSection({ listKey, items, customs, uploading, updateItem, addItem, removeItem, moveItem, uploadQr }) {
  const { tr } = useAdminI18n();
  return <Section
    icon={QrCode}
    title={customs ? 'QR-коды таможенных постов' : 'QR-коды районных управлений'}
    titleKz={customs ? 'Кеден бекеттерінің QR-кодтары' : 'Аудандық басқармалардың QR-кодтары'}
    description={customs ? 'Соцсети постов или адреса в 2GIS, если отдельных соцсетей нет' : 'Изображения можно загрузить заново при изменении адреса или ссылки'}
    descriptionKz={customs ? 'Посттардың әлеуметтік желілері немесе бөлек әлеуметтік желілер болмаса, 2GIS мекенжайлары' : 'Мекенжай немесе сілтеме өзгерсе, суретті қайта жүктеуге болады'}
  >
    <div className="settings-repeater">
      {items.map((item, index) => <fieldset className="settings-repeat-card" key={item.id}>
        <legend>{customs ? tr('Таможенный пост', 'Кеден бекеті') : tr('QR-код', 'QR-код')} {index + 1}</legend>
        <div className="form-grid">
          {customs && <label><span>{tr('Код поста', 'Бекет коды')}</span><input maxLength={80} value={item.code} onChange={(event) => updateItem(listKey, index, 'code', event.target.value)} /></label>}
          <label><span>{tr('Название (русский)', 'Атауы (орысша)')}</span><input required maxLength={240} value={item.titleRu} onChange={(event) => updateItem(listKey, index, 'titleRu', event.target.value)} /></label>
          <label><span>{tr('Название (казахский)', 'Атауы (қазақша)')}</span><input required maxLength={240} value={item.titleKz} onChange={(event) => updateItem(listKey, index, 'titleKz', event.target.value)} /></label>
          {customs && <label><span>{tr('Тип QR (русский)', 'QR түрі (орысша)')}</span><input maxLength={160} value={item.targetTypeRu} onChange={(event) => updateItem(listKey, index, 'targetTypeRu', event.target.value)} /></label>}
          {customs && <label><span>{tr('Тип QR (казахский)', 'QR түрі (қазақша)')}</span><input maxLength={160} value={item.targetTypeKz} onChange={(event) => updateItem(listKey, index, 'targetTypeKz', event.target.value)} /></label>}
          {customs && <label className="form-grid__wide"><span>{tr('Ссылка соцсети или 2GIS', 'Әлеуметтік желі немесе 2GIS сілтемесі')}</span><input type="url" maxLength={500} value={item.targetUrl} onChange={(event) => updateItem(listKey, index, 'targetUrl', event.target.value)} /></label>}
          <label><span>{tr('Путь к QR-коду', 'QR-код жолы')}</span><input maxLength={500} value={item.image} onChange={(event) => updateItem(listKey, index, 'image', event.target.value)} /></label>
          <label className="toggle-label"><input type="checkbox" checked={item.isActive} onChange={(event) => updateItem(listKey, index, 'isActive', event.target.checked)} /><span>{tr('Показывать', 'Көрсету')}</span></label>
          {customs && <label><span>{tr('Адрес (русский)', 'Мекенжай (орысша)')}</span><textarea maxLength={500} value={item.addressRu} onChange={(event) => updateItem(listKey, index, 'addressRu', event.target.value)} /></label>}
          {customs && <label><span>{tr('Адрес (казахский)', 'Мекенжай (қазақша)')}</span><textarea maxLength={500} value={item.addressKz} onChange={(event) => updateItem(listKey, index, 'addressKz', event.target.value)} /></label>}
          <label className="form-grid__wide"><span>{tr('Загрузить QR-код', 'QR-код жүктеу')}</span><span className="image-upload-control"><ImagePlus size={20} />{uploading === `${listKey}-${index}` ? tr('Загрузка...') : item.image ? tr('Заменить изображение', 'Суретті ауыстыру') : tr('Загрузить изображение', 'Сурет жүктеу')}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => uploadQr(event, listKey, index)} /></span></label>
          {item.image && <><img className="settings-qr-preview" src={assetUrl(item.image)} alt="" /><button type="button" className="admin-button admin-button--danger settings-media-remove" onClick={() => updateItem(listKey, index, 'image', '')}><Trash2 size={17} />{tr('Убрать изображение', 'Суретті алып тастау')}</button></>}
        </div>
        <div className="settings-repeat-actions safety-rule-actions"><div><button type="button" className="admin-button" disabled={index === 0} onClick={() => moveItem(listKey, index, -1)}><ArrowUp size={17} />{tr('Выше', 'Жоғары')}</button><button type="button" className="admin-button" disabled={index === items.length - 1} onClick={() => moveItem(listKey, index, 1)}><ArrowDown size={17} />{tr('Ниже', 'Төмен')}</button></div><button type="button" className="admin-button admin-button--danger" onClick={() => removeItem(listKey, index)}><Trash2 size={17} />{tr('Удалить')}</button></div>
      </fieldset>)}
      <button type="button" className="admin-button" disabled={items.length >= 30} onClick={() => addItem(listKey, customs ? newCustomsQrCode() : newDistrictQrCode())}><Plus size={18} />{customs ? tr('Добавить таможенный QR-код', 'Кеден QR-кодын қосу') : tr('Добавить QR-код', 'QR-код қосу')}</button>
    </div>
  </Section>;
}

export default function ReceptionPage({ section = 'schedule' }) {
  const { tr } = useAdminI18n();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/admin/reception');
      setForm(normalizeReceptionForm(response.data.data));
    } catch (err) { setError(apiMessage(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateItem = (key, index, field, value) => update(key, form[key].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const addItem = (key, item) => update(key, [...form[key], item]);
  const removeItem = (key, index) => update(key, form[key].filter((_, itemIndex) => itemIndex !== index));
  const moveItem = (key, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= form[key].length) return;
    const next = [...form[key]];
    [next[index], next[target]] = [next[target], next[index]];
    update(key, next);
  };
  const uploadQr = async (event, key, index) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(`${key}-${index}`); setError('');
    try {
      const data = new FormData();
      data.append('media', file);
      const response = await api.post('/admin/reception/qr-media', data);
      updateItem(key, index, 'image', response.data.data.path);
    } catch (err) { setError(apiMessage(err)); }
    finally { setUploading(''); event.target.value = ''; }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await api.patch('/admin/reception', form);
      setForm(normalizeReceptionForm(response.data.data));
      setToast({ message: tr('Настройки приёма сохранены', 'Қабылдау баптаулары сақталды') });
    } catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  };

  if (!form) return <LoadingState text={tr('Загрузка настроек приёма...', 'Қабылдау баптаулары жүктелуде...')} />;
  const schedule = section === 'schedule';
  return <><AdminPageHeader eyebrow="Приём граждан" eyebrowKz="Азаматтарды қабылдау" title={schedule ? 'График приёма' : 'QR-коды'} titleKz={schedule ? 'Қабылдау кестесі' : 'QR-кодтар'} description={schedule ? 'Дни, время, должности и адреса приёма руководства' : 'Районные управления и таможенные посты на одной странице'} descriptionKz={schedule ? 'Басшылықтың қабылдау күндері, уақыты, лауазымдары және мекенжайлары' : 'Аудандық басқармалар мен кеден бекеттері бір бетте'} actions={<a className="admin-button admin-button--secondary" href="/information/reception-schedule" target="_blank" rel="noreferrer">{tr('Открыть страницу инфокиоска', 'Инфокиоск бетін ашу')}</a>} />
    <form className="settings-layout reception-settings" onSubmit={save}>
      {schedule && <Section icon={CalendarDays} title="График приёма руководства" titleKz="Басшылықтың қабылдау кестесі" description="Строки показываются посетителю в указанном порядке" descriptionKz="Жолдар келушіге көрсетілген ретпен көрсетіледі">
        <div className="settings-repeater">
          {form.receptionSchedule.map((item, index) => <fieldset className="settings-repeat-card" key={item.id}>
            <legend>{tr('Запись графика', 'Кесте жазбасы')} {index + 1}</legend>
            <div className="form-grid">
              <label><span>{tr('ФИО (русский)', 'Аты-жөні (орысша)')}</span><input required maxLength={240} value={item.nameRu} onChange={(event) => updateItem('receptionSchedule', index, 'nameRu', event.target.value)} /></label>
              <label><span>{tr('ФИО (казахский)', 'Аты-жөні (қазақша)')}</span><input required maxLength={240} value={item.nameKz} onChange={(event) => updateItem('receptionSchedule', index, 'nameKz', event.target.value)} /></label>
              <label><span>{tr('Должность (русский)', 'Лауазымы (орысша)')}</span><textarea required maxLength={500} value={item.positionRu} onChange={(event) => updateItem('receptionSchedule', index, 'positionRu', event.target.value)} /></label>
              <label><span>{tr('Должность (казахский)', 'Лауазымы (қазақша)')}</span><textarea required maxLength={500} value={item.positionKz} onChange={(event) => updateItem('receptionSchedule', index, 'positionKz', event.target.value)} /></label>
              <label><span>{tr('День приёма (русский)', 'Қабылдау күні (орысша)')}</span><input required maxLength={240} value={item.dayRu} onChange={(event) => updateItem('receptionSchedule', index, 'dayRu', event.target.value)} /></label>
              <label><span>{tr('День приёма (казахский)', 'Қабылдау күні (қазақша)')}</span><input required maxLength={240} value={item.dayKz} onChange={(event) => updateItem('receptionSchedule', index, 'dayKz', event.target.value)} /></label>
              <label><span>{tr('Время', 'Уақыты')}</span><input required maxLength={120} value={item.time} onChange={(event) => updateItem('receptionSchedule', index, 'time', event.target.value)} /></label>
              <label className="toggle-label"><input type="checkbox" checked={item.isActive} onChange={(event) => updateItem('receptionSchedule', index, 'isActive', event.target.checked)} /><span>{tr('Показывать', 'Көрсету')}</span></label>
              <label><span>{tr('Адрес (русский)', 'Мекенжай (орысша)')}</span><textarea required maxLength={500} value={item.addressRu} onChange={(event) => updateItem('receptionSchedule', index, 'addressRu', event.target.value)} /></label>
              <label><span>{tr('Адрес (казахский)', 'Мекенжай (қазақша)')}</span><textarea required maxLength={500} value={item.addressKz} onChange={(event) => updateItem('receptionSchedule', index, 'addressKz', event.target.value)} /></label>
            </div>
            <div className="settings-repeat-actions safety-rule-actions"><div><button type="button" className="admin-button" disabled={index === 0} onClick={() => moveItem('receptionSchedule', index, -1)}><ArrowUp size={17} />{tr('Выше', 'Жоғары')}</button><button type="button" className="admin-button" disabled={index === form.receptionSchedule.length - 1} onClick={() => moveItem('receptionSchedule', index, 1)}><ArrowDown size={17} />{tr('Ниже', 'Төмен')}</button></div><button type="button" className="admin-button admin-button--danger" onClick={() => removeItem('receptionSchedule', index)}><Trash2 size={17} />{tr('Удалить')}</button></div>
          </fieldset>)}
          <button type="button" className="admin-button" disabled={form.receptionSchedule.length >= 30} onClick={() => addItem('receptionSchedule', newScheduleItem())}><Plus size={18} />{tr('Добавить запись', 'Жазба қосу')}</button>
        </div>
      </Section>}

      {!schedule && <>
        <QrListSection listKey="districtQrCodes" items={form.districtQrCodes} uploading={uploading} updateItem={updateItem} addItem={addItem} removeItem={removeItem} moveItem={moveItem} uploadQr={uploadQr} />
        <QrListSection customs listKey="customsQrCodes" items={form.customsQrCodes} uploading={uploading} updateItem={updateItem} addItem={addItem} removeItem={removeItem} moveItem={moveItem} uploadQr={uploadQr} />
      </>}

      {error && <div className="form-error">{tr(error)}</div>}
      <div className="settings-save"><button className="admin-button admin-button--primary" disabled={busy || Boolean(uploading)}><Save size={19} />{busy ? tr('Сохранение...') : tr('Сохранить раздел', 'Бөлімді сақтау')}</button></div>
    </form><Toast {...toast} onClose={() => setToast(null)} />
  </>;
}
