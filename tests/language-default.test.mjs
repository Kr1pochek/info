import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Kazakh is the initial and reset language throughout the client', async () => {
  const context = await readFile(new URL('../client/src/context/LanguageContext.jsx', import.meta.url), 'utf8');
  assert.match(context, /useState\('kz'\)/);
  assert.match(context, /setLanguage\('kz', true\)/);
});

test('the root route opens the kiosk without a service chooser', async () => {
  const app = await readFile(new URL('../client/src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /<Route index element={<Navigate to="\/kiosk" replace \/>} \/>/);
  assert.doesNotMatch(app, /ChoosePage/);
});
