const dateWords = {
  ru: {
    weekdays: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  },
  kz: {
    weekdays: ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'],
    months: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  },
};

const parts = (value, language) => {
  const date = value instanceof Date ? value : new Date(value);
  const words = dateWords[language] || dateWords.ru;
  return {
    day: date.getDate(),
    month: words.months[date.getMonth()],
    weekday: words.weekdays[date.getDay()],
    year: date.getFullYear(),
  };
};

export function formatFullDate(value, language = 'ru') {
  const { day, month, weekday, year } = parts(value, language);
  return language === 'kz'
    ? `${year} жылғы ${day} ${month}, ${weekday}`
    : `${weekday}, ${day} ${month} ${year} г.`;
}

export function formatCalendarDate(value, language = 'ru') {
  const { day, month, year } = parts(value, language);
  return language === 'kz' ? `${year} жылғы ${day} ${month}` : `${day} ${month} ${year} г.`;
}

export function formatDayMonth(value, language = 'ru') {
  const { day, month } = parts(value, language);
  return `${day} ${month}`;
}
