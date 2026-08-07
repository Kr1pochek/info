import { ArrowUpRight, Landmark, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  { name: 'Инфокиоск', description: 'Каталог государственных услуг, требований, документов и пошаговых инструкций.', icon: Landmark, path: '/kiosk', number: '01' },
  { name: 'Новостная лента', description: 'Актуальные объявления, события и важные материалы для сотрудников.', icon: Newspaper, path: '/news', number: '02' },
];

export default function ChoosePage() {
  return <main className="choose-page">
    <header className="choose-header">
      <Link to="/" className="choose-brand" aria-label="Главная страница"><span>ДГД</span><div><strong>Цифровая среда</strong><small>Департамент государственных доходов</small></div></Link>
      <span className="choose-header__status"><i /> Внутренние сервисы доступны</span>
    </header>
    <section className="choose-hero">
      <div className="choose-hero__copy"><span>Единая точка входа</span><h1>Выберите нужный сервис</h1><p>Информация, инструменты и новости департамента — в одном цифровом пространстве.</p></div>
      <div className="choose-grid" aria-label="Доступные сервисы">
        {services.map(({ name, description, icon: Icon, path, number }) => <Link className="choose-card" to={path} key={path}>
          <div className="choose-card__top"><span className="choose-card__icon"><Icon size={34} /></span><small>{number}</small></div>
          <div><h2>{name}</h2><p>{description}</p></div>
          <span className="choose-card__action">Открыть сервис <ArrowUpRight size={22} /></span>
        </Link>)}
      </div>
    </section>
    <footer className="choose-footer"><span>Корпоративный портал ДГД</span><span>Алматы · 2026</span></footer>
  </main>;
}
