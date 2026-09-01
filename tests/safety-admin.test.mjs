import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('ethics and fire safety are the first administrator group with two simple links', async () => {
  const [app, layout, dashboard, page] = await Promise.all([
    readFile(new URL('../client/src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/layouts/AdminLayout.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/admin/DashboardPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/admin/SafetyPage.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /path="ethics"[^]*section="ethics"/);
  assert.match(app, /path="fire-safety"[^]*section="fire"/);
  assert.match(layout, /Этика и пожарная безопасность/);
  assert.ok(layout.indexOf("id: 'safety'") < layout.indexOf("id: 'kiosk'"));
  assert.match(layout, /to: '\/admin\/ethics'/);
  assert.match(layout, /to: '\/admin\/fire-safety'/);
  assert.doesNotMatch(layout, /to: '\/admin\/safety'/);
  assert.match(dashboard, /type="safety"/);
  assert.ok(dashboard.indexOf('type="safety"') < dashboard.indexOf('type="kiosk"'));
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

test('priority news is always an overlay without placement and slide order controls', async () => {
  const page = await readFile(new URL('../client/src/pages/admin/NewsPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /!form\.isPriority && <fieldset className="news-placement-selector/);
  assert.match(page, /!form\.isPriority && form\.showInBroadcast && <label><span>\{tr\('Порядок слайда в эфире'/);
  assert.match(page, /if \(payload\.isPriority\) \{ payload\.showInBroadcast = false; payload\.sortOrder = 0; \}/);
  assert.doesNotMatch(page, /isPriority: true, showInBroadcast: true/);
});
