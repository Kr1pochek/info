import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('ethics and fire safety have a separate administrator section', async () => {
  const [app, layout, page] = await Promise.all([
    readFile(new URL('../client/src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/layouts/AdminLayout.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/admin/SafetyPage.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /path="safety"/);
  assert.match(layout, /Этика и пожарная безопасность/);
  assert.match(page, /Уполномоченный по этике/);
  assert.match(page, /Правила пожарной безопасности/);
  assert.match(page, /Добавить правило/);
});

test('administrator navigation groups can be collapsed', async () => {
  const layout = await readFile(new URL('../client/src/layouts/AdminLayout.jsx', import.meta.url), 'utf8');
  assert.match(layout, /openGroup/);
  assert.match(layout, /aria-expanded=\{isOpen\}/);
  assert.match(layout, /toggleGroup/);
});

test('kiosk renders configured fire safety rules', async () => {
  const page = await readFile(new URL('../client/src/pages/kiosk/EthicsFireSafetyPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /settings\.fireSafetyRules/);
  assert.match(page, /fireSafetyWarningKz/);
  assert.match(page, /fireSafetyWarningRu/);
});

test('fire safety video alternates with the guide instead of shrinking above it', async () => {
  const page = await readFile(new URL('../client/src/pages/kiosk/EthicsFireSafetyPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /FIRE_GUIDE_SECONDS = 15/);
  assert.match(page, /fire-panel__slide--video/);
  assert.match(page, /fire-panel__slide--guide/);
  assert.match(page, /onEnded=\{\(\) => setFireView\('guide'\)\}/);
  assert.match(page, /setTimeout\(\(\) => setFireView\('video'\)/);
});
