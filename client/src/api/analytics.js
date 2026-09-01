import api from './client.js';

const SESSION_KEY = 'dgd-kiosk-analytics-session';
const QUEUE_KEY = 'dgd-kiosk-analytics-queue';
const MAX_QUEUED_EVENTS = 500;

let memorySessionId = null;
let memoryQueue = [];
let flushPromise = null;

function createId(prefix = '') {
  if (globalThis.crypto?.randomUUID) return `${prefix}${globalThis.crypto.randomUUID()}`;

  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

function readSessionId() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
  } catch {
    // Some kiosk browser policies disable web storage; memory is sufficient
    // for the current page lifetime in that case.
  }
  return memorySessionId;
}

function writeSessionId(value) {
  memorySessionId = value;
  try { sessionStorage.setItem(SESSION_KEY, value); } catch { /* See readSessionId. */ }
  return value;
}

function currentSessionId() {
  return readSessionId() || writeSessionId(createId());
}

function renewSession() {
  return writeSessionId(createId());
}

function readQueue() {
  try {
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return memoryQueue;
  }
}

function writeQueue(value) {
  memoryQueue = value;
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(value)); } catch { /* Keep the memory fallback. */ }
}

function removeQueuedEvent(eventId) {
  writeQueue(readQueue().filter((item) => item.eventId !== eventId));
}

export function flushAnalyticsQueue() {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    while (true) {
      const event = readQueue()[0];
      if (!event) break;
      try {
        await api.post('/analytics/events', event);
        removeQueuedEvent(event.eventId);
      } catch (error) {
        const status = error.response?.status;
        if (status >= 400 && status < 500 && ![408, 429].includes(status)) {
          removeQueuedEvent(event.eventId);
          continue;
        }
        break;
      }
    }
  })().finally(() => { flushPromise = null; });
  return flushPromise;
}

export function track(eventType, payload = {}) {
  const metadata = {
    path: globalThis.location?.pathname || '/kiosk',
    ...(payload.metadata || {}),
  };
  const event = {
    ...payload,
    metadata,
    eventId: createId('event-'),
    eventType,
    sessionId: currentSessionId(),
    occurredAt: new Date().toISOString(),
  };
  const queue = [...readQueue(), event].slice(-MAX_QUEUED_EVENTS);
  writeQueue(queue);
  void flushAnalyticsQueue();
  return event.eventId;
}

export function endSession(eventType, payload = {}) {
  const eventId = track(eventType, payload);
  renewSession();
  if (globalThis.window) window.dispatchEvent(new Event('dgd-kiosk-session-ended'));
  return eventId;
}

if (globalThis.window) {
  window.addEventListener('online', () => { void flushAnalyticsQueue(); });
  queueMicrotask(() => { void flushAnalyticsQueue(); });
}
