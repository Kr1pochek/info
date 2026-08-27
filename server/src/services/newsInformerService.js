import { env } from '../config/env.js';

const CURRENCIES = ['USD', 'EUR', 'CNY', 'RUB'];
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = { data: null, expiresAt: 0 };

function xmlValue(xml, tag) {
  return xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim();
}

function finiteNumber(value, message) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(message);
  return number;
}

function isoDate(value) {
  const [day, month, year] = String(value || '').split('.');
  return year && month && day ? `${year}-${month}-${day}` : new Date().toISOString().slice(0, 10);
}

export function parseNationalBankRates(xml) {
  return CURRENCIES.map((code) => {
    const item = xml.match(new RegExp(`<item>\\s*<title>${code}<\\/title>[\\s\\S]*?<\\/item>`))?.[0];
    if (!item) throw new Error(`${code} rate is missing`);
    const quantity = finiteNumber(xmlValue(item, 'quant') || 1, `${code} quantity is invalid`);
    const rate = Math.round((finiteNumber(xmlValue(item, 'description'), `${code} rate is invalid`) / quantity) * 1_000_000) / 1_000_000;
    return {
      code,
      rate,
      change: Number(xmlValue(item, 'change')) || 0,
      direction: xmlValue(item, 'index') || 'UNCHANGED',
      date: isoDate(xmlValue(item, 'pubDate')),
    };
  });
}

export function weatherDescription(code) {
  if (code === 0) return { ru: 'ясно', kz: 'ашық' };
  if ([1, 2].includes(code)) return { ru: 'переменная облачность', kz: 'ала бұлтты' };
  if (code === 3) return { ru: 'облачно', kz: 'бұлтты' };
  if ([45, 48].includes(code)) return { ru: 'туман', kz: 'тұман' };
  if ([51, 53, 55, 56, 57].includes(code)) return { ru: 'морось', kz: 'сіркіреме жаңбыр' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { ru: 'дождь', kz: 'жаңбыр' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { ru: 'снег', kz: 'қар' };
  if ([95, 96, 99].includes(code)) return { ru: 'гроза', kz: 'найзағай' };
  return { ru: 'погода без осадков', kz: 'жауын-шашынсыз' };
}

function ninjaWeatherDescription(value) {
  const weather = String(value || '').toLowerCase();
  if (weather.includes('thunder')) return { ru: 'гроза', kz: 'найзағай' };
  if (weather.includes('snow')) return { ru: 'снег', kz: 'қар' };
  if (weather.includes('rain') || weather.includes('drizzle')) return { ru: 'дождь', kz: 'жаңбыр' };
  if (weather.includes('fog') || weather.includes('mist')) return { ru: 'туман', kz: 'тұман' };
  if (weather.includes('cloud')) return { ru: 'облачно', kz: 'бұлтты' };
  if (weather.includes('clear')) return { ru: 'ясно', kz: 'ашық' };
  return { ru: 'погода без осадков', kz: 'жауын-шашынсыз' };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} responded with ${response.status}`);
  return response.json();
}

async function loadOfficialInformer() {
  const [ratesResponse, weatherData] = await Promise.all([
    fetch('https://nationalbank.kz/rss/rates_all.xml', {
      headers: { accept: 'application/xml,text/xml' },
      signal: AbortSignal.timeout(8000),
    }),
    fetchJson('https://api.open-meteo.com/v1/forecast?latitude=43.2383&longitude=76.945&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FAlmaty'),
  ]);
  if (!ratesResponse.ok) throw new Error(`nationalbank.kz responded with ${ratesResponse.status}`);
  const rates = parseNationalBankRates(await ratesResponse.text());
  const current = weatherData.current;
  if (!current) throw new Error('Current weather is missing');

  return {
    rates,
    weather: {
      cityRu: 'Алматы', cityKz: 'Алматы',
      temperature: finiteNumber(current.temperature_2m, 'Temperature is invalid'),
      feelsLike: finiteNumber(current.apparent_temperature, 'Feels-like temperature is invalid'),
      humidity: finiteNumber(current.relative_humidity_2m, 'Humidity is invalid'),
      windSpeed: finiteNumber(current.wind_speed_10m, 'Wind speed is invalid'),
      description: weatherDescription(Number(current.weather_code)),
      observedAt: current.time,
    },
    source: { rates: 'Национальный Банк Республики Казахстан', weather: 'Open-Meteo' },
  };
}

async function loadApiNinjasInformer() {
  if (!env.API_NINJAS_KEY) throw new Error('API_NINJAS_KEY is not configured');
  const headers = { accept: 'application/json', 'X-Api-Key': env.API_NINJAS_KEY };
  const requests = CURRENCIES.map((code) => fetchJson(`https://api.api-ninjas.com/v1/exchangerate?pair=${code}_KZT`, { headers }));
  requests.push(fetchJson('https://api.api-ninjas.com/v1/weatherforecast?lat=43.2383&lon=76.945', { headers }));
  const results = await Promise.all(requests);
  const weatherForecast = results.at(-1);
  const current = Array.isArray(weatherForecast) ? weatherForecast[0] : null;
  if (!current) throw new Error('Weather forecast is missing');

  return {
    rates: results.slice(0, CURRENCIES.length).map((item, index) => ({
      code: CURRENCIES[index],
      rate: finiteNumber(item.exchange_rate, `${CURRENCIES[index]} rate is invalid`),
      change: 0,
      direction: 'UNCHANGED',
      date: item.timestamp ? new Date(item.timestamp * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    })),
    weather: {
      cityRu: 'Алматы', cityKz: 'Алматы',
      temperature: finiteNumber(current.temp, 'Temperature is invalid'),
      feelsLike: finiteNumber(current.feels_like, 'Feels-like temperature is invalid'),
      humidity: finiteNumber(current.humidity, 'Humidity is invalid'),
      windSpeed: finiteNumber(current.wind_speed, 'Wind speed is invalid'),
      description: ninjaWeatherDescription(current.weather),
      observedAt: current.timestamp ? new Date(current.timestamp * 1000).toISOString() : new Date().toISOString(),
    },
    source: { rates: 'API Ninjas', weather: 'API Ninjas' },
  };
}

export async function getNewsInformer() {
  const now = Date.now();
  if (cache.data && cache.expiresAt > now) return cache.data;

  try {
    const data = env.INFORMER_PROVIDER === 'api-ninjas'
      ? await loadApiNinjasInformer()
      : await loadOfficialInformer();
    cache.data = { ...data, updatedAt: new Date().toISOString(), stale: false };
    cache.expiresAt = now + CACHE_TTL_MS;
    return cache.data;
  } catch (error) {
    if (cache.data) return { ...cache.data, stale: true };
    throw error;
  }
}
