import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseNationalBankRates, weatherDescription } from '../src/services/newsInformerService.js';

test('news informer parses and normalizes all ticker currencies', () => {
  const xml = `
    <rss><channel>
      <item><title>USD</title><pubDate>26.08.2026</pubDate><description>458.48</description><quant>1</quant><index>UP</index><change>0.49</change></item>
      <item><title>EUR</title><pubDate>26.08.2026</pubDate><description>534.68</description><quant>1</quant><index>UP</index><change>0.53</change></item>
      <item><title>CNY</title><pubDate>26.08.2026</pubDate><description>682.30</description><quant>10</quant><index>UP</index><change>0.10</change></item>
      <item><title>RUB</title><pubDate>26.08.2026</pubDate><description>5.43</description><quant>1</quant><index>DOWN</index><change>-0.04</change></item>
    </channel></rss>`;

  const rates = parseNationalBankRates(xml);
  assert.deepEqual(rates.map((item) => item.code), ['USD', 'EUR', 'CNY', 'RUB']);
  assert.deepEqual(rates.map((item) => item.rate), [458.48, 534.68, 68.23, 5.43]);
  assert.ok(rates.every((item) => item.date === '2026-08-26'));
});

test('news informer localizes common WMO weather conditions', () => {
  assert.deepEqual(weatherDescription(0), { ru: 'ясно', kz: 'ашық' });
  assert.deepEqual(weatherDescription(63), { ru: 'дождь', kz: 'жаңбыр' });
  assert.deepEqual(weatherDescription(95), { ru: 'гроза', kz: 'найзағай' });
});
