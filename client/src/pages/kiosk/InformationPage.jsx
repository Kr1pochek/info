import { BookOpenCheck, CalendarDays, ChevronDown, Clock3, MapPin, QrCode, Scale } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import NotFoundPage from './NotFoundPage.jsx';

const receptionSchedule = [
  {
    nameKz: 'Баеділов Қанат Ескендірұлы',
    nameRu: 'Баедилов Канат Ескендирович',
    positionKz: 'Алматы қаласы бойынша Мемлекеттік кірістер департаментінің басшысы',
    positionRu: 'Руководитель Департамента государственных доходов по городу Алматы',
    dayKz: 'Әр аптаның бейсенбісінде',
    dayRu: 'Каждый четверг недели',
    time: '10:00 – 12:00',
    addressKz: 'Алматы қаласы, Абылай хан даңғылы 93/95',
    addressRu: 'город Алматы, проспект Абылай хана 93/95',
  },
  {
    nameKz: 'Мұхаметжанов Айдос Қасымбайұлы',
    nameRu: 'Мухаметжанов Айдос Касымбаевич',
    positionKz: 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті басшысының орынбасары',
    positionRu: 'Заместитель руководителя Департамента государственных доходов по городу Алматы',
    dayKz: 'Әр аптаның дүйсенбісінде',
    dayRu: 'Каждый понедельник недели',
    time: '10:00 – 12:00',
    addressKz: 'Алматы қаласы, Абылай хан даңғылы 93/95',
    addressRu: 'город Алматы, проспект Абылай хана 93/95',
  },
  {
    nameKz: 'Сухамбеков Қанат Садуақасұлы',
    nameRu: 'Сухамбеков Канат Садуакасович',
    positionKz: 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті басшысының орынбасары',
    positionRu: 'Заместитель руководителя Департамента государственных доходов по городу Алматы',
    dayKz: 'Әр аптаның дүйсенбісінде',
    dayRu: 'Каждый понедельник недели',
    time: '10:00 – 12:00',
    addressKz: 'Алматы қаласы, Абылай хан даңғылы 93/95',
    addressRu: 'город Алматы, проспект Абылай хана 93/95',
  },
  {
    nameKz: 'Омаров Азат Сапарғалиұлы',
    nameRu: 'Омаров Азат Сапаргалиевич',
    positionKz: 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті басшысының орынбасары',
    positionRu: 'Заместитель руководителя Департамента государственных доходов по городу Алматы',
    dayKz: 'Әр аптаның сәрсенбісінде',
    dayRu: 'Каждую среду недели',
    time: '10:00 – 12:00',
    addressKz: 'Алматы қаласы, Абылай хан даңғылы 93/95',
    addressRu: 'город Алматы, проспект Абылай хана 93/95',
  },
  {
    nameKz: 'Мұстафин Дәурен Қамзаұлы',
    nameRu: 'Мустафин Даурен Камзаевич',
    positionKz: 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті басшысының орынбасары',
    positionRu: 'Заместитель руководителя Департамента государственных доходов по городу Алматы',
    dayKz: 'Әр аптаның жұмасында',
    dayRu: 'Каждую пятницу недели',
    time: '10:00 – 12:00',
    addressKz: 'Алматы қаласы, Достық даңғылы, 136',
    addressRu: 'город Алматы, проспект Достык, 136',
  },
];

const districtQrCodes = [
  { id: 'auezov', image: '/qr/districts/almaty-auezov.png', titleKz: 'Әуезов ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Ауэзовскому району' },
  { id: 'bostandyk', image: '/qr/districts/almaty-bostandyk.png', titleKz: 'Бостандық ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Бостандыкскому району' },
  { id: 'zhetysu', image: '/qr/districts/almaty-zhetysu.png', titleKz: 'Жетісу ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Жетисускому району' },
  { id: 'almaly', image: '/qr/districts/almaty-almaly.png', titleKz: 'Алмалы ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Алмалинскому району' },
  { id: 'turksib', image: '/qr/districts/almaty-turksib.png', titleKz: 'Түрксіб ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Турксибскому району' },
  { id: 'medeu', image: '/qr/districts/almaty-medeu.png', titleKz: 'Медеу ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Медеускому району' },
  { id: 'alatau', image: '/qr/districts/almaty-alatau.png', titleKz: 'Алатау ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Алатаускому району' },
  { id: 'nauryzbay', image: '/qr/districts/almaty-nauryzbay.png', titleKz: 'Наурызбай ауданы бойынша Мемлекеттік кірістер басқармасы', titleRu: 'Управление государственных доходов по Наурызбайскому району' },
];

export default function InformationPage() {
  const { informationSlug } = useParams();
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const kazakh = language === 'kz';

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

      <section className="reception-schedule" aria-label={kazakh ? 'Қабылдау кестесі' : 'График приёма'}>
        <div className="reception-schedule__heading"><Clock3 size={30} /><strong>{kazakh ? 'Жеке тұлғаларды және заңды тұлғалардың өкілдерін қабылдау' : 'Приём физических лиц и представителей юридических лиц'}</strong></div>
        <div className="reception-schedule__table-wrap">
          <table>
            <thead><tr>
              <th>{kazakh ? 'Қабылдауды жүзеге асыратын тұлғаның аты-жөні' : 'Ф.И.О. лица, проводящего приём граждан'}</th>
              <th>{kazakh ? 'Лауазымы' : 'Должность'}</th>
              <th>{kazakh ? 'Қабылдау күні және уақыты' : 'Дата и время приёма'}</th>
              <th>{kazakh ? 'Мемлекеттік органның мекенжайы' : 'Местонахождение государственного органа'}</th>
            </tr></thead>
            <tbody>{receptionSchedule.map((item) => <tr key={item.nameRu}>
              <th scope="row">{item[kazakh ? 'nameKz' : 'nameRu']}</th>
              <td>{item[kazakh ? 'positionKz' : 'positionRu']}</td>
              <td><strong>{item[kazakh ? 'dayKz' : 'dayRu']}</strong><time>{item.time}</time></td>
              <td><MapPin size={18} />{item[kazakh ? 'addressKz' : 'addressRu']}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <a className="reception-scroll-arrow" href="#district-qr" aria-label={kazakh ? 'QR-кодтар бөліміне өту' : 'Перейти к разделу QR-кодов'} title={kazakh ? 'QR-кодтарға өту' : 'Перейти к QR-кодам'}><ChevronDown size={38} /></a>

      <section className="district-qr-section" id="district-qr">
        <header><div><QrCode size={30} /><span>{kazakh ? 'Телефон камерасын QR-кодқа бағыттаңыз' : 'Наведите камеру телефона на QR-код'}</span></div><h2>{kazakh ? 'Алматы қаласы бойынша аудандық мемлекеттік кірістер басқармаларының мекенжайлары' : 'Адреса районных управлений государственных доходов по городу Алматы'}</h2></header>
        <div className="district-qr-grid">{districtQrCodes.map((item) => <figure className="district-qr-card" key={item.id}>
          <img src={item.image} alt={`${item[kazakh ? 'titleKz' : 'titleRu']} — QR-код`} loading="lazy" />
          <figcaption>{item[kazakh ? 'titleKz' : 'titleRu']}</figcaption>
        </figure>)}</div>
      </section>

      <footer><BookOpenCheck />{kazakh ? 'Қабылдануға жазылу «e-Otinish» АЖ «Азаматтарды қабылдау» модулінде жүргізіледі.' : 'Запись на приём производится в модуле «Приём граждан» ИС «e-Otinish».'}</footer>
    </article>;
  }

  return <NotFoundPage />;
}
