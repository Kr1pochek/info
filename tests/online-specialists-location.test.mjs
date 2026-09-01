import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('today specialists belong to the kiosk home and not the news broadcast', async () => {
  const [home, news, settings] = await Promise.all([
    readFile(new URL('../client/src/pages/kiosk/HomePage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/news/NewsListPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/admin/SettingsPage.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(home, /settings\.onlineSpecialists/);
  assert.match(home, /className="content-section kiosk-specialists"/);
  assert.match(home, /item\.isActive && item\.workDate === localDate/);
  assert.doesNotMatch(news, /onlineSpecialists|broadcast-specialists/);
  assert.match(settings, /главной странице инфокиоска/);
});
