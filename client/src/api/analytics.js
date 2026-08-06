import api from './client.js';

const sessionId = crypto.randomUUID();
export function track(eventType, payload = {}) {
  return api.post('/analytics/events', { eventType, sessionId, ...payload }).catch(() => null);
}
