import { BadgeCheck, BellRing, DoorOpen, FireExtinguisher, Flame, PhoneCall, UserRoundCheck } from 'lucide-react';
import { assetUrl } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

const defaultFireSteps = {
  ru: [
    ['Сообщите о пожаре', 'Позвоните 101 или 112, назовите точный адрес и место возгорания.'],
    ['Предупредите людей', 'Нажмите кнопку пожарной сигнализации и спокойно сообщите окружающим.'],
    ['Покиньте здание', 'Идите к ближайшему эвакуационному выходу, закрывая за собой двери. Не пользуйтесь лифтом.'],
    ['Помогите другим', 'По возможности помогите детям, пожилым людям и людям с инвалидностью.'],
    ['Не возвращайтесь', 'Ожидайте пожарных снаружи и выполняйте указания ответственных лиц.'],
  ],
  kz: [
    ['Өрт туралы хабарлаңыз', '101 немесе 112 нөміріне қоңырау шалып, нақты мекенжай мен өрт орнын айтыңыз.'],
    ['Адамдарды ескертіңіз', 'Өрт дабылы түймесін басып, айналадағы адамдарға сабырмен хабарлаңыз.'],
    ['Ғимараттан шығыңыз', 'Есіктерді артыңыздан жауып, жақын эвакуациялық шығу жолына барыңыз. Лифтіні пайдаланбаңыз.'],
    ['Басқаларға көмектесіңіз', 'Мүмкіндігінше балаларға, қарттарға және мүгедектігі бар адамдарға көмектесіңіз.'],
    ['Қайтып кірмеңіз', 'Өрт сөндірушілерді сыртта күтіп, жауапты адамдардың нұсқауын орындаңыз.'],
  ],
};

export default function EthicsFireSafetyPage() {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const kazakh = language === 'kz';
  const officerName = settings[kazakh ? 'ethicsOfficerNameKz' : 'ethicsOfficerNameRu'];
  const officerContacts = settings[kazakh ? 'ethicsOfficerContactsKz' : 'ethicsOfficerContactsRu'];
  const configuredRules = Array.isArray(settings.fireSafetyRules) ? settings.fireSafetyRules : [];
  const fireSteps = configuredRules.length
    ? configuredRules.map((rule) => [rule[kazakh ? 'titleKz' : 'titleRu'], rule[kazakh ? 'textKz' : 'textRu']])
    : defaultFireSteps[language];
  const fireWarning = settings[kazakh ? 'fireSafetyWarningKz' : 'fireSafetyWarningRu'] || (kazakh
    ? 'Түтін болған жағдайда еңкейіп қозғалыңыз және ауыз-мұрныңызды дымқыл матамен жабыңыз.'
    : 'При задымлении двигайтесь пригнувшись и прикройте рот и нос влажной тканью.');

  return <article className="ethics-fire-page">
    <div className="ethics-fire-grid">
      <section className="ethics-panel">
        <header><span><UserRoundCheck size={24} /></span><div><small>{kazakh ? 'Қызметтік әдеп' : 'Служебная этика'}</small><h2>{kazakh ? 'Әдеп жөніндегі уәкіл' : 'Уполномоченный по этике'}</h2></div></header>
        <div className="ethics-panel__person">
          {settings.ethicsOfficerPhoto
            ? <img src={assetUrl(settings.ethicsOfficerPhoto)} alt={officerName || ''} />
            : <div className="ethics-panel__placeholder"><UserRoundCheck size={74} /></div>}
          <div><span><BadgeCheck size={17} />{kazakh ? 'Ресми байланыс' : 'Официальный контакт'}</span><h3>{officerName || (kazakh ? 'Әдеп жөніндегі уәкіл' : 'Уполномоченный по этике')}</h3></div>
        </div>
        <div className="ethics-panel__contacts">{officerContacts
          ? officerContacts.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
          : <p>{kazakh ? 'Байланыс деректері әкімшілік панельде толтырылады.' : 'Контактные данные заполняются в панели администратора.'}</p>}
        </div>
      </section>

      <section className="fire-panel">
        <header><span><Flame size={24} /></span><div><small>{kazakh ? 'Төтенше жағдай' : 'Экстренная ситуация'}</small><h2>{kazakh ? 'Өрт кезіндегі әрекеттер' : 'Действия при пожаре'}</h2></div><aside className="fire-panel__emergency-number" aria-label={kazakh ? 'Төтенше қызмет нөмірі 112' : 'Номер экстренной службы 112'}><PhoneCall size={21} /><span>{kazakh ? 'Қоңырау шалу' : 'Позвонить'}</span><strong>112</strong></aside></header>
        {settings.fireSafetyVideo
          ? <video className="fire-panel__video" src={assetUrl(settings.fireSafetyVideo)} controls muted playsInline preload="metadata" />
          : <div className="fire-panel__visual" role="img" aria-label={kazakh ? 'Өрт кезіндегі эвакуация сызбасы' : 'Схема эвакуации при пожаре'}><div><BellRing /><span>01</span></div><i /><div><DoorOpen /><span>02</span></div><i /><div><FireExtinguisher /><span>03</span></div><strong>112</strong></div>}
        <ol className="fire-steps">{fireSteps.map(([title, text], index) => <li key={`${index}-${title}`}><span>{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        <p className="fire-panel__warning"><Flame size={20} />{fireWarning}</p>
      </section>
    </div>
  </article>;
}
