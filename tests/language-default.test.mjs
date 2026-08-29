import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Kazakh is the initial and reset language throughout the client', async () => {
  const context = await readFile(new URL('../client/src/context/LanguageContext.jsx', import.meta.url), 'utf8');
  assert.match(context, /useState\('kz'\)/);
  assert.match(context, /setLanguage\('kz', true\)/);
});

test('the service chooser has Kazakh copy and a manual language switch', async () => {
  const page = await readFile(new URL('../client/src/pages/portal/ChoosePage.jsx', import.meta.url), 'utf8');
  assert.match(page, /Қажетті сервисті таңдаңыз/);
  assert.match(page, /nameKz/);
  assert.match(page, /choose-language-switch/);
});
