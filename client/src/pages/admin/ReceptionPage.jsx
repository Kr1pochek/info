import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, ImagePlus, Plus, QrCode, Save, Trash2 } from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const makeId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
const newScheduleItem = () => ({ id: makeId('reception'), nameRu: '', nameKz: '', positionRu: '', positionKz: '', dayRu: '', dayKz: '', time: '', addressRu: '', addressKz: '', isActive: true });
const newQrCode = () => ({ id: makeId('district-qr'), titleRu: '', titleKz: '', image: '', isActive: true });
const asArray = (value) => Array.isArray(value) ? value : [];
const normalizeScheduleItem = (item) => ({ ...newScheduleItem(), ...item, id: item?.id || makeId('reception'), isActive: item?.isActive !== false });
const normalizeQrCode = (item) => ({ ...newQrCode(), ...item, id: item?.id || makeId('district-qr'), isActive: item?.isActive !== false });

function Section({ icon: Icon, title, titleKz, description, descriptionKz, children }) {
  const { tr } = useAdminI18n();
  return <section className="admin-card settings-section"><header><Icon /><div><h2>{tr(title, titleKz)}</h2><p>{tr(description, descriptionKz)}</p></div></header>{children}</section>;
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
      setForm({
        receptionSchedule: asArray(response.data.data?.receptionSchedule).map(normalizeScheduleItem),
        districtQrCodes: asArray(response.data.data?.districtQrCodes).map(normalizeQrCode),
      });
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
  const uploadQr = async (event, index) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(`qr-${index}`); setError('');
    try {
      const data = new FormData();
      data.append('media', file);
      const response = await api.post('/admin/reception/qr-media', data);
      updateItem('districtQrCodes', index, 'image', response.data.data.path);
    } catch (err) { setError(apiMessage(err)); }
    finally { setUploading(''); event.target.value = ''; }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await api.patch('/admin/reception', form);
      setForm({
        receptionSchedule: asArray(response.data.data?.receptionSchedule).map(normalizeScheduleItem),
        districtQrCodes: asArray(response.data.data?.districtQrCodes).map(normalizeQrCode),
      });
      setToast({ message: tr('Настройки приёма сохранены', 'Қабылдау баптаулары сақталды') });
    } catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  };

  if (!form) return <LoadingState text={tr('Загрузка настроек приёма…', 'Қабылдау баптаулары жүктелуде…')} />;
  const schedule = section === 'schedule';
  return <><AdminPageHeader eyebrow="Приём граждан" eyebrowKz="Азаматтарды қабылдау" title={schedule ? 'График приёма' : 'QR-коды управлений'} titleKz={schedule ? 'Қабылдау кестесі' : 'Басқармалардың QR-кодтары'} description={schedule ? 'Дни, время, должности и адреса приёма руководства' : 'Названия, замена изображений и добавление новых QR-кодов'} descriptionKz={schedule ? 'Басшылықтың қабылдау күндері, уақыты, лауазымдары және мекенжайлары' : 'Атаулар, суреттерді ауыстыру және жаңа QR-кодтарды қосу'} actions={<a className="admin-button admin-button--secondary" href="/information/reception-schedule" target="_blank" rel="noreferrer">{tr('Открыть страницу инфокиоска', 'Инфокиоск бетін ашу')}</a>} />
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

      {!schedule && <Section icon={QrCode} title="QR-коды районных управлений" titleKz="Аудандық басқармалардың QR-кодтары" description="Изображения можно загрузить заново при изменении адреса или ссылки" descriptionKz="Мекенжай немесе сілтеме өзгерсе, суретті қайта жүктеуге болады">
        <div className="settings-repeater">
          {form.districtQrCodes.map((item, index) => <fieldset className="settings-repeat-card" key={item.id}>
            <legend>{tr('QR-код', 'QR-код')} {index + 1}</legend>
            <div className="form-grid">
              <label><span>{tr('Название (русский)', 'Атауы (орысша)')}</span><input required maxLength={240} value={item.titleRu} onChange={(event) => updateItem('districtQrCodes', index, 'titleRu', event.target.value)} /></label>
              <label><span>{tr('Название (казахский)', 'Атауы (қазақша)')}</span><input required maxLength={240} value={item.titleKz} onChange={(event) => updateItem('districtQrCodes', index, 'titleKz', event.target.value)} /></label>
              <label><span>{tr('Путь к QR-коду', 'QR-код жолы')}</span><input maxLength={500} value={item.image} onChange={(event) => updateItem('districtQrCodes', index, 'image', event.target.value)} /></label>
              <label className="toggle-label"><input type="checkbox" checked={item.isActive} onChange={(event) => updateItem('districtQrCodes', index, 'isActive', event.target.checked)} /><span>{tr('Показывать', 'Көрсету')}</span></label>
              <label className="form-grid__wide"><span>{tr('Загрузить QR-код', 'QR-код жүктеу')}</span><span className="image-upload-control"><ImagePlus size={20} />{uploading === `qr-${index}` ? tr('Загрузка…') : item.image ? tr('Заменить изображение', 'Суретті ауыстыру') : tr('Загрузить изображение', 'Сурет жүктеу')}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => uploadQr(event, index)} /></span></label>
              {item.image && <><img className="settings-qr-preview" src={assetUrl(item.image)} alt="" /><button type="button" className="admin-button admin-button--danger settings-media-remove" onClick={() => updateItem('districtQrCodes', index, 'image', '')}><Trash2 size={17} />{tr('Убрать изображение', 'Суретті алып тастау')}</button></>}
            </div>
            <div className="settings-repeat-actions safety-rule-actions"><div><button type="button" className="admin-button" disabled={index === 0} onClick={() => moveItem('districtQrCodes', index, -1)}><ArrowUp size={17} />{tr('Выше', 'Жоғары')}</button><button type="button" className="admin-button" disabled={index === form.districtQrCodes.length - 1} onClick={() => moveItem('districtQrCodes', index, 1)}><ArrowDown size={17} />{tr('Ниже', 'Төмен')}</button></div><button type="button" className="admin-button admin-button--danger" onClick={() => removeItem('districtQrCodes', index)}><Trash2 size={17} />{tr('Удалить')}</button></div>
          </fieldset>)}
          <button type="button" className="admin-button" disabled={form.districtQrCodes.length >= 30} onClick={() => addItem('districtQrCodes', newQrCode())}><Plus size={18} />{tr('Добавить QR-код', 'QR-код қосу')}</button>
        </div>
      </Section>}

      {error && <div className="form-error">{tr(error)}</div>}
      <div className="settings-save"><button className="admin-button admin-button--primary" disabled={busy || Boolean(uploading)}><Save size={19} />{busy ? tr('Сохранение…') : tr('Сохранить раздел', 'Бөлімді сақтау')}</button></div>
    </form><Toast {...toast} onClose={() => setToast(null)} />
  </>;
}
