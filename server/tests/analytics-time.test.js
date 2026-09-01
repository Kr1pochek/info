import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addAnalyticsDays, analyticsDateString, analyticsPeriod } from '../src/utils/analytics.js';

test('analytics uses the calendar day in Almaty', () => {
  assert.equal(analyticsDateString(new Date('2026-08-29T20:30:00.000Z')), '2026-08-30');
  assert.equal(addAnalyticsDays('2026-03-01', -1), '2026-02-28');
  const period = analyticsPeriod({ from: '2026-08-30', to: '2026-08-30' });
  assert.equal(period.from.toISOString(), '2026-08-29T19:00:00.000Z');
  assert.equal(period.to.toISOString(), '2026-08-30T18:59:59.999Z');
});
