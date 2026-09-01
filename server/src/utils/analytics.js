export const ANALYTICS_TIME_ZONE = 'Asia/Almaty';
const ANALYTICS_UTC_OFFSET = '+05:00';

export function analyticsDateString(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addAnalyticsDays(day, amount) {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function analyticsPeriod(query, defaultDays = 30) {
  const toDay = query.to || analyticsDateString();
  const fromDay = query.from || addAnalyticsDays(toDay, -(defaultDays - 1));
  return {
    from: new Date(`${fromDay}T00:00:00.000${ANALYTICS_UTC_OFFSET}`),
    to: new Date(`${toDay}T23:59:59.999${ANALYTICS_UTC_OFFSET}`),
    fromDay,
    toDay,
  };
}
