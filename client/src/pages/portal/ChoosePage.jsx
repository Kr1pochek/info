import { ArrowUpRight, CalendarDays, Landmark, Languages, Newspaper, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import DgdLogo from '../../components/common/DgdLogo.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const services = [
  { nameRu: 'Инфокиоск', nameKz: 'Инфокиоск', descriptionRu: 'Каталог государственных услуг, требований, документов и пошаговых инструкций.', descriptionKz: 'Мемлекеттік қызметтер, талаптар, құжаттар және қадамдық нұсқаулықтар каталогы.', icon: Landmark, path: '/kiosk', number: '01' },
  { nameRu: 'Новостная лента', nameKz: 'Жаңалықтар лентасы', descriptionRu: 'Актуальные объявления, события и важные материалы для сотрудников.', descriptionKz: 'Қызметкерлерге арналған өзекті хабарландырулар, оқиғалар және маңызды материалдар.', icon: Newspaper, path: '/news', number: '02' },
  { nameRu: 'График приёма граждан', nameKz: 'Азаматтарды қабылдау кестесі', descriptionRu: 'Дни и часы приёма, адрес департамента и контактный телефон.', descriptionKz: 'Қабылдау күндері мен сағаттары, департамент мекенжайы және байланыс телефоны.', icon: CalendarDays, path: '/information/reception-schedule', number: '03' },
  { nameRu: 'Этика и безопасность', nameKz: 'Әдеп және қауіпсіздік', descriptionRu: 'Уполномоченный по этике и понятная памятка о действиях при пожаре.', descriptionKz: 'Әдеп жөніндегі уәкіл және өрт кезіндегі іс-қимыл туралы түсінікті жадынама.', icon: ShieldCheck, path: '/information/ethics-fire-safety', number: '04' },
];

export default function ChoosePage() {
  const { language, setLanguage } = useLanguage();
  const kazakh = language === 'kz';
  return <main className="choose-page">
    <header className="choose-header">
      <Link to="/" className="choose-brand" aria-label={kazakh ? 'Басты бет' : 'Главная страница'}><DgdLogo className="choose-brand__logo" decorative /><div><strong>{kazakh ? 'Цифрлық орта' : 'Цифровая среда'}</strong><small>{kazakh ? 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті' : 'Департамент государственных доходов по городу Алматы'}</small></div></Link>
      <div className="choose-header__actions"><span className="choose-header__status"><i />{kazakh ? 'Ішкі сервистер қолжетімді' : 'Внутренние сервисы доступны'}</span><button type="button" className="choose-language-switch" onClick={() => setLanguage(kazakh ? 'ru' : 'kz')}><Languages size={19} />{kazakh ? 'Рус' : 'Қаз'}</button></div>
    </header>
    <section className="choose-hero">
      <div className="choose-hero__copy"><span>{kazakh ? 'Бірыңғай кіру нүктесі' : 'Единая точка входа'}</span><h1>{kazakh ? 'Қажетті сервисті таңдаңыз' : 'Выберите нужный сервис'}</h1><p>{kazakh ? 'Департаменттің ақпараты, құралдары мен жаңалықтары бір цифрлық кеңістікте.' : 'Информация, инструменты и новости департамента — в одном цифровом пространстве.'}</p></div>
      <div className="choose-grid" aria-label={kazakh ? 'Қолжетімді сервистер' : 'Доступные сервисы'}>
        {services.map(({ icon: Icon, path, number, ...service }) => <Link className="choose-card" to={path} key={path}>
          <div className="choose-card__top"><span className="choose-card__icon"><Icon size={34} /></span><small>{number}</small></div>
          <div><h2>{service[kazakh ? 'nameKz' : 'nameRu']}</h2><p>{service[kazakh ? 'descriptionKz' : 'descriptionRu']}</p></div>
          <span className="choose-card__action">{kazakh ? 'Сервисті ашу' : 'Открыть сервис'} <ArrowUpRight size={22} /></span>
        </Link>)}
      </div>
    </section>
    <footer className="choose-footer"><span>{kazakh ? 'МКД корпоративтік порталы' : 'Корпоративный портал ДГД'}</span><span>{kazakh ? 'Алматы · 2026' : 'Алматы · 2026'}</span></footer>
  </main>;
}
