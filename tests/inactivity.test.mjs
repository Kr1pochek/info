import assert from 'node:assert/strict';
import { test } from 'node:test';
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
});
