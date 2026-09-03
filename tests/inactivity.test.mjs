import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { isDeliberateKioskActivity, kioskActivityEvents, shouldUseKioskInactivityTimer } from '../client/src/utils/kioskActivity.js';

test('kiosk inactivity timer starts only after deliberate user input', () => {
  for (const type of kioskActivityEvents) assert.equal(isDeliberateKioskActivity({ type, isTrusted: true }), true, type);
});

test('automatic layout events and scripted events do not start the kiosk session timer', () => {
  for (const type of ['mousemove', 'mousedown', 'scroll', 'resize']) {
    assert.equal(isDeliberateKioskActivity({ type, isTrusted: true }), false, type);
  }
  assert.equal(isDeliberateKioskActivity({ type: 'pointerdown', isTrusted: false }), false, 'scripted pointer event');
});

test('kiosk return timer is disabled on standalone information pages', () => {
  assert.equal(shouldUseKioskInactivityTimer('/kiosk'), true);
  assert.equal(shouldUseKioskInactivityTimer('/services'), true);
  assert.equal(shouldUseKioskInactivityTimer('/service/example'), true);
  assert.equal(shouldUseKioskInactivityTimer('/information/reception-schedule'), false);
  assert.equal(shouldUseKioskInactivityTimer('/information/ethics-fire-safety'), false);
  assert.equal(shouldUseKioskInactivityTimer('/qr-tavojnya'), false);
});

test('interactive news warns before returning to the broadcast', async () => {
  const layout = await readFile(new URL('../client/src/layouts/NewsLayout.jsx', import.meta.url), 'utf8');
  assert.match(layout, /warningSeconds/);
  assert.match(layout, /news-session-title/);
  assert.match(layout, /Хотите продолжить читать новости\?/);
  assert.match(layout, /Вернуться к эфиру/);
});

test('news screen has manual slide controls and no administrator link', async () => {
  const [layout, list] = await Promise.all([
    readFile(new URL('../client/src/layouts/NewsLayout.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/news/NewsListPage.jsx', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(layout, /to="\/admin\/login"/);
  assert.match(layout, /\{copy\.administration\}<\/span>/);
  assert.match(list, /broadcast-slide-controls/);
  assert.match(list, /Предыдущий слайд/);
  assert.match(list, /Следующий слайд/);
});

test('important news dismissal lasts only for the current news session', async () => {
  const [layout, broadcast, interactive] = await Promise.all([
    readFile(new URL('../client/src/layouts/NewsLayout.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/news/NewsListPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/news/InteractiveNewsFeed.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(layout, /dismissedPrioritySignature/);
  assert.match(layout, /resetPriorityDismissal\(\); setInteractive\(false\)/);
  for (const source of [broadcast, interactive]) assert.match(source, /dismissPriority\(prioritySignature\)/);
  assert.doesNotMatch(broadcast, /14 \* 1000/);
  assert.doesNotMatch(interactive, /PRIORITY_REPEAT_MS/);
});
