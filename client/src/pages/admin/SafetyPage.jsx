import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Flame, ImagePlus, Plus, Save, Trash2, UserRoundCheck, Video } from 'lucide-react';
import api, { apiMessage, assetUrl } from '../../api/client.js';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Toast from '../../components/admin/Toast.jsx';
import { LoadingState } from '../../components/common/States.jsx';
import { useAdminI18n } from '../../utils/adminLocalization.js';

const makeId = () => `fire-rule-${globalThis.crypto?.randomUUID?.() || Date.now()}`;

function Section({ icon: Icon, title, titleKz, description, descriptionKz, children }) {
  const { tr } = useAdminI18n();
  return <section className="admin-card settings-section"><header><Icon /><div><h2>{tr(title, titleKz)}</h2><p>{tr(description, descriptionKz)}</p></div></header>{children}</section>;
}

export default function SafetyPage({ section = 'ethics' }) {
  const { tr } = useAdminI18n();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { const response = await api.get('/admin/safety'); setForm(response.data.data); }
    catch (err) { setError(apiMessage(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateRule = (index, key, value) => update('fireSafetyRules', form.fireSafetyRules.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const addRule = () => update('fireSafetyRules', [...form.fireSafetyRules, { id: makeId(), titleRu: '', titleKz: '', textRu: '', textKz: '' }]);
  const removeRule = (index) => update('fireSafetyRules', form.fireSafetyRules.filter((_, itemIndex) => itemIndex !== index));
  const moveRule = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= form.fireSafetyRules.length) return;
    const next = [...form.fireSafetyRules];
    [next[index], next[target]] = [next[target], next[index]];
    update('fireSafetyRules', next);
  };
  const upload = async (event, target, key) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(target); setError('');
    try { const data = new FormData(); data.append('media', file); const response = await api.post('/admin/broadcast/media', data); update(key, response.data.data.path); }
    catch (err) { setError(apiMessage(err)); }
    finally { setUploading(''); event.target.value = ''; }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...form };
      delete payload.updatedAt;
      const response = await api.patch('/admin/safety', payload);
      setForm(response.data.data);
      setToast({ message: tr('Раздел сохранён', 'Бөлім сақталды') });
    } catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  };

  if (!form) return <LoadingState text={tr('Загрузка раздела…', 'Бөлім жүктелуде…')} />;
  const ethics = section === 'ethics';
  return <><AdminPageHeader eyebrow="Этика и безопасность" eyebrowKz="Әдеп және қауіпсіздік" title={ethics ? 'Уполномоченный по этике' : 'Пожарная безопасность'} titleKz={ethics ? 'Әдеп жөніндегі уәкіл' : 'Өрт қауіпсіздігі'} description={ethics ? 'Имя, контакты и фотография уполномоченного' : 'Памятка, предупреждение и видеоинструкция'} descriptionKz={ethics ? 'Уәкілдің аты-жөні, байланыстары және фотосуреті' : 'Жаднама, ескерту және бейненұсқаулық'} actions={<a className="admin-button admin-button--secondary" href="/information/ethics-fire-safety" target="_blank" rel="noreferrer">{tr('Открыть страницу инфокиоска', 'Инфокиоск бетін ашу')}</a>} />
    <form className="settings-layout safety-settings" onSubmit={save}>
      {ethics && <Section icon={UserRoundCheck} title="Уполномоченный по этике" titleKz="Әдеп жөніндегі уәкіл" description="Имя, контакты и фотография, которые видит посетитель" descriptionKz="Келуші көретін аты-жөні, байланыстары және фотосуреті">
        <div className="form-grid settings-fields">
          <label><span>{tr('ФИО или должность на русском', 'Орысша аты-жөні немесе лауазымы')}</span><input required maxLength={240} value={form.ethicsOfficerNameRu} onChange={(event) => update('ethicsOfficerNameRu', event.target.value)} /></label>
          <label><span>{tr('ФИО или должность на казахском', 'Қазақша аты-жөні немесе лауазымы')}</span><input required maxLength={240} value={form.ethicsOfficerNameKz} onChange={(event) => update('ethicsOfficerNameKz', event.target.value)} /></label>
          <label><span>{tr('Контакты и пояснение на русском', 'Орысша байланыстар мен түсіндірме')}</span><textarea required maxLength={1000} value={form.ethicsOfficerContactsRu} onChange={(event) => update('ethicsOfficerContactsRu', event.target.value)} /></label>
          <label><span>{tr('Контакты и пояснение на казахском', 'Қазақша байланыстар мен түсіндірме')}</span><textarea required maxLength={1000} value={form.ethicsOfficerContactsKz} onChange={(event) => update('ethicsOfficerContactsKz', event.target.value)} /></label>
          <label className="form-grid__wide"><span>{tr('Фотография — необязательно', 'Фотосурет — міндетті емес')}</span><span className="image-upload-control"><ImagePlus size={20} />{uploading === 'ethics-photo' ? tr('Загрузка…') : form.ethicsOfficerPhoto ? tr('Заменить фотографию', 'Фотосуретті ауыстыру') : tr('Загрузить фотографию', 'Фотосурет жүктеу')}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => upload(event, 'ethics-photo', 'ethicsOfficerPhoto')} /></span></label>
          {form.ethicsOfficerPhoto && <><img className="settings-photo-preview" src={assetUrl(form.ethicsOfficerPhoto)} alt="" /><button type="button" className="admin-button admin-button--danger settings-media-remove" onClick={() => update('ethicsOfficerPhoto', '')}><Trash2 size={17} />{tr('Убрать фотографию', 'Фотосуретті алып тастау')}</button></>}
        </div>
      </Section>}

      {!ethics && <><Section icon={Flame} title="Правила пожарной безопасности" titleKz="Өрт қауіпсіздігі ережелері" description="Пункты показываются посетителю в том же порядке" descriptionKz="Тармақтар келушіге осы ретпен көрсетіледі">
        <div className="settings-repeater safety-rules-editor">
          {form.fireSafetyRules.map((rule, index) => <fieldset className="settings-repeat-card" key={rule.id}>
            <legend>{tr('Правило', 'Ереже')} {index + 1}</legend>
            <div className="form-grid">
              <label><span>{tr('Короткий заголовок на русском', 'Орысша қысқа тақырып')}</span><input required maxLength={240} value={rule.titleRu} onChange={(event) => updateRule(index, 'titleRu', event.target.value)} /></label>
              <label><span>{tr('Короткий заголовок на казахском', 'Қазақша қысқа тақырып')}</span><input required maxLength={240} value={rule.titleKz} onChange={(event) => updateRule(index, 'titleKz', event.target.value)} /></label>
              <label><span>{tr('Пояснение на русском', 'Орысша түсіндірме')}</span><textarea required maxLength={1000} value={rule.textRu} onChange={(event) => updateRule(index, 'textRu', event.target.value)} /></label>
              <label><span>{tr('Пояснение на казахском', 'Қазақша түсіндірме')}</span><textarea required maxLength={1000} value={rule.textKz} onChange={(event) => updateRule(index, 'textKz', event.target.value)} /></label>
            </div>
            <div className="settings-repeat-actions safety-rule-actions"><div><button type="button" className="admin-button" disabled={index === 0} onClick={() => moveRule(index, -1)}><ArrowUp size={17} />{tr('Выше', 'Жоғары')}</button><button type="button" className="admin-button" disabled={index === form.fireSafetyRules.length - 1} onClick={() => moveRule(index, 1)}><ArrowDown size={17} />{tr('Ниже', 'Төмен')}</button></div><button type="button" className="admin-button admin-button--danger" disabled={form.fireSafetyRules.length <= 1} onClick={() => removeRule(index)}><Trash2 size={17} />{tr('Удалить')}</button></div>
          </fieldset>)}
          <button type="button" className="admin-button" disabled={form.fireSafetyRules.length >= 12} onClick={addRule}><Plus size={18} />{tr('Добавить правило', 'Ереже қосу')}</button>
        </div>
      </Section>

      <Section icon={Flame} title="Важное предупреждение" titleKz="Маңызды ескерту" description="Выделенный текст под списком правил" descriptionKz="Ережелер тізімінің астындағы ерекшеленген мәтін">
        <div className="form-grid settings-fields"><label><span>{tr('Предупреждение на русском', 'Орысша ескерту')}</span><textarea required maxLength={1000} value={form.fireSafetyWarningRu} onChange={(event) => update('fireSafetyWarningRu', event.target.value)} /></label><label><span>{tr('Предупреждение на казахском', 'Қазақша ескерту')}</span><textarea required maxLength={1000} value={form.fireSafetyWarningKz} onChange={(event) => update('fireSafetyWarningKz', event.target.value)} /></label></div>
      </Section>

      <Section icon={Video} title="Видео о действиях при пожаре" titleKz="Өрт кезіндегі әрекеттер туралы бейне" description="Если видео загружено, оно показывается крупно и чередуется с памяткой" descriptionKz="Бейне жүктелсе, ол ірі көрсетіліп, жаднамамен кезектеседі">
        <div className="form-grid settings-fields"><label className="form-grid__wide"><span>{tr('Видео — необязательно', 'Бейне — міндетті емес')}</span><span className="image-upload-control"><Video size={20} />{uploading === 'fire-video' ? tr('Загрузка…') : form.fireSafetyVideo ? tr('Заменить видео', 'Бейнені ауыстыру') : tr('Загрузить видео', 'Бейне жүктеу')}<input type="file" accept="video/mp4,video/webm" disabled={Boolean(uploading)} onChange={(event) => upload(event, 'fire-video', 'fireSafetyVideo')} /></span><small>{tr('Поддерживаются видео до 150 МБ.', '150 МБ дейінгі бейнелерге қолдау көрсетіледі.')}</small></label>{form.fireSafetyVideo && <><video className="settings-video-preview" src={assetUrl(form.fireSafetyVideo)} controls muted /><button type="button" className="admin-button admin-button--danger settings-media-remove" onClick={() => update('fireSafetyVideo', '')}><Trash2 size={17} />{tr('Убрать видео', 'Бейнені алып тастау')}</button></>}</div>
      </Section></>}

      {error && <div className="form-error">{tr(error)}</div>}
      <div className="settings-save"><button className="admin-button admin-button--primary" disabled={busy || Boolean(uploading)}><Save size={19} />{busy ? tr('Сохранение…') : tr('Сохранить раздел', 'Бөлімді сақтау')}</button></div>
    </form><Toast {...toast} onClose={() => setToast(null)} />
  </>;
}
