import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronDown, CircleHelp, FileQuestion, Phone, SearchX, Sparkles } from 'lucide-react';
import SearchBar from '../../components/kiosk/SearchBar.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { propertyTaxFaq } from '../../data/propertyTaxFaq.js';

const normalize = (value) => value.toLocaleLowerCase().replace(/ё/g, 'е').trim();

export default function FaqPage() {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState(() => new Set([1]));
  const kazakh = language === 'kz';
  const key = kazakh ? 'Kz' : 'Ru';
  const filtered = useMemo(() => {
    const term = normalize(query);
    if (!term) return propertyTaxFaq;
    return propertyTaxFaq.filter((item) => normalize([
      item[`question${key}`],
      item[`answer${key}`],
      ...(item[`details${key}`] || []),
    ].join(' ')).includes(term));
  }, [key, query]);
  const allShownOpen = filtered.length > 0 && filtered.every((item) => openIds.has(item.id));
  const toggle = (id) => setOpenIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setOpenIds((current) => {
    const next = new Set(current);
    if (allShownOpen) filtered.forEach((item) => next.delete(item.id));
    else filtered.forEach((item) => next.add(item.id));
    return next;
  });

  return <article className="faq-page">
    <header className="faq-hero">
      <div className="faq-hero__copy">
        <span><Sparkles size={18} />{kazakh ? 'Жауапты тез табыңыз' : 'Ответ без лишних поисков'}</span>
        <h1>{kazakh ? 'Жиі қойылатын сұрақтар' : 'Частые вопросы'}</h1>
        <p>{kazakh ? 'Жеке тұлғалардың мүлік салығы туралы түсінікті жауаптар.' : 'Понятные ответы о налоге на имущество физических лиц.'}</p>
      </div>
      <div className="faq-hero__visual" aria-hidden="true"><CircleHelp /><span>{propertyTaxFaq.length}</span><small>{kazakh ? 'жауап' : 'ответов'}</small></div>
    </header>

    <section className="faq-workspace">
      <div className="faq-search-panel">
        <div className="faq-topic"><span><BookOpenCheck size={25} /></span><div><small>{kazakh ? 'Тақырып' : 'Тема раздела'}</small><strong>{kazakh ? 'Жеке тұлғалардың мүлік салығы' : 'Налог на имущество физических лиц'}</strong></div></div>
        <SearchBar inputId="faq-search" value={query} onChange={setQuery} placeholder={kazakh ? 'Сұрақ бойынша іздеу' : 'Поиск по вопросам'} />
        <button type="button" className="faq-expand-button" onClick={toggleAll} disabled={!filtered.length}>{allShownOpen ? (kazakh ? 'Барлығын жинау' : 'Свернуть все') : (kazakh ? 'Барлығын ашу' : 'Развернуть все')}</button>
      </div>

      <div className="faq-results-heading"><span>{query ? (kazakh ? 'Іздеу нәтижелері' : 'Результаты поиска') : (kazakh ? 'Сұрақты таңдаңыз' : 'Выберите вопрос')}</span><strong>{filtered.length}</strong></div>
      {filtered.length ? <div className="faq-list">{filtered.map((item, index) => {
        const open = openIds.has(item.id);
        const details = item[`details${key}`] || [];
        return <section className={`faq-item${open ? ' is-open' : ''}`} key={item.id}>
          <button type="button" className="faq-question" onClick={() => toggle(item.id)} aria-expanded={open} aria-controls={`faq-answer-${item.id}`}>
            <span>{String(index + 1).padStart(2, '0')}</span><strong>{item[`question${key}`]}</strong><ChevronDown />
          </button>
          {open && <div className="faq-answer" id={`faq-answer-${item.id}`}><div className="faq-answer__icon"><FileQuestion /></div><div><small>{kazakh ? 'Жауап' : 'Ответ'}</small><p>{item[`answer${key}`]}</p>{details.length > 0 && <ol>{details.map((detail) => <li key={detail}>{detail}</li>)}</ol>}</div></div>}
        </section>;
      })}</div> : <div className="faq-empty"><SearchX /><h2>{kazakh ? 'Ештеңе табылмады' : 'Ничего не найдено'}</h2><p>{kazakh ? 'Сұрауды қысқартып немесе басқа сөздерді қолданып көріңіз.' : 'Попробуйте сократить запрос или использовать другие слова.'}</p><button type="button" onClick={() => setQuery('')}>{kazakh ? 'Іздеуді тазарту' : 'Очистить поиск'}</button></div>}
    </section>

    <aside className="faq-help-card">
      <span><Phone /></span><div><small>{kazakh ? 'Қажетті жауапты таппадыңыз ба?' : 'Не нашли нужный ответ?'}</small><h2>{kazakh ? '1414 нөмірі бойынша кеңес алыңыз' : 'Получите консультацию по номеру 1414'}</h2><p>{kazakh ? 'Бірыңғай байланыс орталығының жұмыс уақыты' : 'График работы единого контакт-центра'}: <strong>{settings[`workingHours${key}`]}</strong></p></div><b>{settings.contactPhone}</b>
    </aside>
    <p className="faq-disclaimer">{kazakh ? 'Ақпарат анықтамалық сипатта берілген. Жеке жағдай бойынша мемлекеттік кірістер органына жүгініңіз.' : 'Информация носит справочный характер. По индивидуальной ситуации обратитесь в орган государственных доходов.'}</p>
  </article>;
}
