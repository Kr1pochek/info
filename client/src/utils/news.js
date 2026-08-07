export const newsCategories = [
  { value: '', label: 'Все новости', labelKz: 'Барлық жаңалықтар' },
  { value: 'IMPORTANT', label: 'Важное', labelKz: 'Маңызды' },
  { value: 'ANNOUNCEMENT', label: 'Объявления', labelKz: 'Хабарландырулар' },
  { value: 'EVENT', label: 'События', labelKz: 'Іс-шаралар' },
  { value: 'GENERAL', label: 'Новости', labelKz: 'Жаңалықтар' },
];

export const newsCopy = {
  ru: {
    brand: 'Новости ДГД', brandSubtitle: 'Корпоративная лента', backToFeed: 'К ленте', allServices: 'Все сервисы',
    organization: 'Департамент государственных доходов по городу Алматы', administration: 'Администрирование',
    portal: 'Корпоративный медиапортал', title: 'Новости ДГД', officialRate: 'Официальный курс', updating: 'Обновляем…', rateUnavailable: 'Курс недоступен',
    search: 'Поиск по новостям', clearSearch: 'Очистить поиск', loading: 'Загружаем новости…', loadError: 'Не удалось загрузить новости', empty: 'По вашему запросу публикаций не найдено',
    readFeatured: 'Читать главную новость', results: 'Результаты', fresh: 'Свежие публикации', searchResult: 'Поиск', latest: 'Последние новости', onlyOne: 'Это единственная публикация в выбранном разделе.',
    readFull: 'Читать полностью', loadingArticle: 'Загружаем публикацию…', unavailable: 'Новость недоступна', news: 'Новости', returnToFeed: 'Вернуться к ленте', continueReading: 'Продолжить чтение', related: 'Другие материалы по теме',
  },
  kz: {
    brand: 'МКД жаңалықтары', brandSubtitle: 'Корпоративтік жаңалықтар', backToFeed: 'Жаңалықтарға', allServices: 'Барлық сервистер',
    organization: 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті', administration: 'Әкімшілік басқару',
    portal: 'Корпоративтік медиапортал', title: 'МКД жаңалықтары', officialRate: 'Ресми бағам', updating: 'Жаңартылуда…', rateUnavailable: 'Бағам қолжетімсіз',
    search: 'Жаңалықтардан іздеу', clearSearch: 'Іздеуді тазарту', loading: 'Жаңалықтар жүктелуде…', loadError: 'Жаңалықтарды жүктеу мүмкін болмады', empty: 'Сұрауыңыз бойынша жарияланымдар табылмады',
    readFeatured: 'Басты жаңалықты оқу', results: 'Нәтижелер', fresh: 'Жаңа жарияланымдар', searchResult: 'Іздеу', latest: 'Соңғы жаңалықтар', onlyOne: 'Таңдалған бөлімде әзірге бір ғана жарияланым бар.',
    readFull: 'Толығырақ оқу', loadingArticle: 'Жарияланым жүктелуде…', unavailable: 'Жаңалық қолжетімсіз', news: 'Жаңалықтар', returnToFeed: 'Жаңалықтарға оралу', continueReading: 'Оқуды жалғастыру', related: 'Осы тақырыптағы басқа материалдар',
  },
};

export function newsCategoryLabel(value, language = 'ru') {
  const category = newsCategories.find((item) => item.value === value);
  return (language === 'kz' ? category?.labelKz : category?.label) || newsCopy[language]?.news || newsCopy.ru.news;
}

export function localizedNews(item, language) {
  if (!item) return item;
  const suffix = language === 'kz' ? 'Kz' : 'Ru';
  return {
    ...item,
    title: item[`title${suffix}`] || item.titleRu || item.titleKz || '',
    description: item[`description${suffix}`] || item.descriptionRu || item.descriptionKz || '',
    content: item[`content${suffix}`] || item.contentRu || item.contentKz || '',
  };
}

export function newsCategoryClass(value) {
  return `news-category news-category--${String(value || 'GENERAL').toLowerCase()}`;
}
