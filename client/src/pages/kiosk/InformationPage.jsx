import { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, QrCode, Scale } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { assetUrl } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { defaultCustomsQrCodes, defaultDistrictQrCodes, defaultReceptionSchedule } from '../../data/receptionContent.js';
import NotFoundPage from './NotFoundPage.jsx';
import EthicsFireSafetyPage from './EthicsFireSafetyPage.jsx';

const RECEPTION_SLIDE_SECONDS = 15;

export default function InformationPage() {
  const { informationSlug } = useParams();
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const kazakh = language === 'kz';
  const [receptionSlide, setReceptionSlide] = useState(0);
  const [rotationKey, setRotationKey] = useState(0);
  const selectReceptionSlide = useCallback((index) => {
    setReceptionSlide(index);
    setRotationKey((value) => value + 1);
  }, []);
  useEffect(() => {
    if (informationSlug !== 'reception-schedule') return undefined;
    const timer = setTimeout(() => setReceptionSlide((value) => (value + 1) % 3), RECEPTION_SLIDE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [informationSlug, receptionSlide, rotationKey]);
  const configuredReceptionSchedule = Array.isArray(settings?.receptionSchedule) ? settings.receptionSchedule : defaultReceptionSchedule;
  const configuredDistrictQrCodes = Array.isArray(settings?.districtQrCodes) ? settings.districtQrCodes : defaultDistrictQrCodes;
  const configuredCustomsQrCodes = Array.isArray(settings?.customsQrCodes) ? settings.customsQrCodes : defaultCustomsQrCodes;
  const receptionSchedule = configuredReceptionSchedule.filter((item) => item && item.isActive !== false);
  const districtQrCodes = configuredDistrictQrCodes.filter((item) => item && item.isActive !== false && item.image);
  const customsQrCodes = configuredCustomsQrCodes.filter((item) => item && item.isActive !== false && item.image);

  if (informationSlug === 'ethics-fire-safety') return <EthicsFireSafetyPage />;

  if (informationSlug === 'taxpayer-rights') {
    const content = settings[kazakh ? 'taxpayerRightsKz' : 'taxpayerRightsRu'];
    return <article className="information-page"><header><div><Scale size={54} /></div><span>{t.usefulInformation}</span><h1>{t.taxpayerRights}</h1></header><section className="information-page__content">{content ? content.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>{kazakh ? 'Мазмұнды Тапсырыс беруші бекіткеннен кейін әкімші жариялайды.' : 'Содержание будет опубликовано администратором после утверждения Заказчиком.'}</p>}</section><footer><BookOpenCheck />{kazakh ? 'Ресми дереккөз: № 214-VIII ҚРЗ Салық кодексінің 36-бабы, ҚР МКК, 24.06.2026' : 'Официальный источник: статья 36 Налогового кодекса № 214-VIII, КГД РК, 24.06.2026'}</footer></article>;
  }

  if (informationSlug === 'reception-schedule') {
    return <article className="information-page reception-page">
      <header>
        <div><CalendarDays size={54} /></div>
        <span>{kazakh ? 'Азаматтарға арналған ақпарат' : 'Информация для граждан'}</span>
        <h1>{kazakh ? 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті басшылығының қабылдау кестесі' : 'График приёма руководства Департамента государственных доходов по городу Алматы'}</h1>
      </header>

      <nav className="reception-slides-nav" aria-label={kazakh ? 'Ақпарат бөлімдері' : 'Разделы информации'}>
        <button className={receptionSlide === 0 ? 'active' : ''} onClick={() => selectReceptionSlide(0)}><CalendarDays size={22} /><span><small>01</small><strong>{kazakh ? 'Қабылдау кестесі' : 'График приёма'}</strong></span>{receptionSlide === 0 && <i key={`schedule-${rotationKey}`} style={{ '--slide-seconds': `${RECEPTION_SLIDE_SECONDS}s` }} />}</button>
        <button className={receptionSlide === 1 ? 'active' : ''} onClick={() => selectReceptionSlide(1)}><QrCode size={22} /><span><small>02</small><strong>{kazakh ? 'Аудандық басқармалардың QR-кодтары' : 'QR-коды районных управлений'}</strong></span>{receptionSlide === 1 && <i key={`qr-${rotationKey}`} style={{ '--slide-seconds': `${RECEPTION_SLIDE_SECONDS}s` }} />}</button>
        <button className={receptionSlide === 2 ? 'active' : ''} onClick={() => selectReceptionSlide(2)}><QrCode size={22} /><span><small>03</small><strong>{kazakh ? 'Кеден бекеттерінің QR-кодтары' : 'QR-коды таможенных постов'}</strong></span>{receptionSlide === 2 && <i key={`customs-${rotationKey}`} style={{ '--slide-seconds': `${RECEPTION_SLIDE_SECONDS}s` }} />}</button>
      </nav>

      <div className="reception-slides" key={`${receptionSlide}-${rotationKey}`}>
      {receptionSlide === 0 ? <section className="reception-schedule" aria-label={kazakh ? 'Қабылдау кестесі' : 'График приёма'}>
        <div className="reception-schedule__heading"><Clock3 size={30} /><strong>{kazakh ? 'Жеке тұлғаларды және заңды тұлғалардың өкілдерін қабылдау' : 'Приём физических лиц и представителей юридических лиц'}</strong></div>
        <div className="reception-schedule__table-wrap">
          <table>
            <thead><tr>
              <th>{kazakh ? 'Қабылдауды жүзеге асыратын тұлғаның аты-жөні' : 'Ф.И.О. лица, проводящего приём граждан'}</th>
              <th>{kazakh ? 'Лауазымы' : 'Должность'}</th>
              <th>{kazakh ? 'Қабылдау күні және уақыты' : 'Дата и время приёма'}</th>
              <th>{kazakh ? 'Мемлекеттік органның мекенжайы' : 'Местонахождение государственного органа'}</th>
            </tr></thead>
            <tbody>{receptionSchedule.map((item) => <tr key={item.id || item.nameRu}>
              <th scope="row">{item[kazakh ? 'nameKz' : 'nameRu']}</th>
              <td>{item[kazakh ? 'positionKz' : 'positionRu']}</td>
              <td><strong>{item[kazakh ? 'dayKz' : 'dayRu']}</strong><time>{item.time}</time></td>
              <td><MapPin size={18} />{item[kazakh ? 'addressKz' : 'addressRu']}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section> : receptionSlide === 1 ? <section className="district-qr-section" id="district-qr">
        <header><div><QrCode size={30} /><span>{kazakh ? 'Телефон камерасын QR-кодқа бағыттаңыз' : 'Наведите камеру телефона на QR-код'}</span></div><h2>{kazakh ? 'Алматы қаласы бойынша аудандық мемлекеттік кірістер басқармаларының мекенжайлары' : 'Адреса районных управлений государственных доходов по городу Алматы'}</h2></header>
        <div className="district-qr-grid">{districtQrCodes.map((item) => <figure className="district-qr-card" key={item.id}>
          <img src={assetUrl(item.image)} alt={`${item[kazakh ? 'titleKz' : 'titleRu']} — QR-код`} loading="lazy" />
          <figcaption>{item[kazakh ? 'titleKz' : 'titleRu']}</figcaption>
        </figure>)}</div>
      </section> : <section className="district-qr-section district-qr-section--customs" id="customs-qr">
        <header><div><QrCode size={30} /><span>{kazakh ? 'Телефон камерасын QR-кодқа бағыттаңыз' : 'Наведите камеру телефона на QR-код'}</span></div><h2>{kazakh ? 'Алматы қаласының кеден бекеттері' : 'Таможенные посты города Алматы'}</h2></header>
        <div className="district-qr-grid district-qr-grid--customs">{customsQrCodes.map((item) => <figure className="district-qr-card district-qr-card--customs" key={item.id}>
          <img src={assetUrl(item.image)} alt={`${item[kazakh ? 'titleKz' : 'titleRu']} — QR-код`} loading="lazy" />
          <figcaption><strong>{item[kazakh ? 'titleKz' : 'titleRu']}</strong>{item.code && <small>{item.code}</small>}{item[kazakh ? 'addressKz' : 'addressRu'] && <span>{item[kazakh ? 'addressKz' : 'addressRu']}</span>}</figcaption>
        </figure>)}</div>
      </section>}
      </div>

      <div className="reception-slide-controls"><button onClick={() => selectReceptionSlide((receptionSlide + 2) % 3)} aria-label={kazakh ? 'Алдыңғы бөлім' : 'Предыдущий раздел'}><ChevronLeft /></button><span><strong>{receptionSlide + 1}</strong> / 3 · {kazakh ? `${RECEPTION_SLIDE_SECONDS} секундтан кейін автоматты түрде ауысады` : `автоматическое переключение через ${RECEPTION_SLIDE_SECONDS} секунд`}</span><button onClick={() => selectReceptionSlide((receptionSlide + 1) % 3)} aria-label={kazakh ? 'Келесі бөлім' : 'Следующий раздел'}><ChevronRight /></button></div>

      <footer><BookOpenCheck />{kazakh ? 'Қабылдануға жазылу «e-Otinish» АЖ «Азаматтарды қабылдау» модулінде жүргізіледі.' : 'Запись на приём производится в модуле «Приём граждан» ИС «e-Otinish».'}</footer>
    </article>;
  }

  return <NotFoundPage />;
}
