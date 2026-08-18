import axios from 'axios';

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;
  const developmentPort = ['5173', '5174'].includes(window.location.port);
  const networkUrl = developmentPort ? `${window.location.protocol}//${window.location.hostname}:4000/api` : `${window.location.origin}/api`;
  if (!configuredUrl) return networkUrl;

  try {
    const url = new URL(configuredUrl);
    const pageIsNetworkHost = !['localhost', '127.0.0.1'].includes(window.location.hostname);
    const apiIsLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (!developmentPort && apiIsLocalhost) return networkUrl;
    if (pageIsNetworkHost && apiIsLocalhost) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    return networkUrl;
  }

  return configuredUrl;
}

const api = axios.create({
  baseURL: resolveApiUrl(),
  withCredentials: true,
  timeout: 10000,
});

const publicCachePrefix = 'dgd-public-api:';
const publicPaths = ['/broadcast', '/categories', '/service-packages', '/services', '/search', '/news', '/settings', '/exchange-rates'];

function announceConnectivity(online, detail = {}) {
  window.dispatchEvent(new CustomEvent('dgd-connectivity', { detail: { online, ...detail } }));
}

function publicCacheKey(config) {
  const url = String(config?.url || '');
  const cacheable = String(config?.method || 'get').toLowerCase() === 'get'
    && publicPaths.some((path) => url === path || url.startsWith(`${path}/`));
  return cacheable ? `${publicCachePrefix}${url}:${JSON.stringify(config.params || {})}` : null;
}

function savePublicResponse(response) {
  const key = publicCacheKey(response.config);
  if (!key) return;
  announceConnectivity(true);
  try {
    const value = JSON.stringify({ savedAt: Date.now(), data: response.data });
    if (value.length > 750000) return;
    localStorage.setItem(key, value);
    const entries = Object.keys(localStorage).filter((item) => item.startsWith(publicCachePrefix));
    if (entries.length > 20) {
      entries.map((item) => ({ item, savedAt: JSON.parse(localStorage.getItem(item) || '{}').savedAt || 0 }))
        .sort((left, right) => left.savedAt - right.savedAt)
        .slice(0, entries.length - 20)
        .forEach(({ item }) => localStorage.removeItem(item));
    }
  } catch {
    // Кэш — резервный механизм, его недоступность не должна ломать киоск.
  }
}

function restorePublicResponse(error) {
  const key = publicCacheKey(error.config);
  if (!key || error.response) return null;
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (!cached?.data) return null;
    announceConnectivity(false, { cached: true, savedAt: cached.savedAt });
    return { data: cached.data, status: 200, statusText: 'OK (cached)', headers: {}, config: error.config, request: null, __fromCache: true };
  } catch {
    return null;
  }
}

export function assetUrl(value) {
  if (!value || /^(?:https?:|data:|blob:)/i.test(value)) return value || '';
  if (value.startsWith('/uploads/')) {
    return `${new URL(api.defaults.baseURL, window.location.origin).origin}${value}`;
  }
  return value;
}

let accessToken = null;
let refreshPromise = null;
export const setAccessToken = (token) => { accessToken = token; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use((response) => {
  savePublicResponse(response);
  return response;
}, async (error) => {
  const original = error.config;
  const protectedRequest = original?.url?.startsWith('/admin') || original?.url === '/auth/me' || original?.url === '/auth/logout';
  if (error.response?.status === 401 && protectedRequest && !original._retried && original.url !== '/auth/refresh') {
    original._retried = true;
    refreshPromise ||= api.post('/auth/refresh').then((response) => {
      setAccessToken(response.data.data.accessToken);
      window.dispatchEvent(new CustomEvent('dgd-auth-refresh', { detail: response.data.data }));
      return response.data.data.accessToken;
    }).finally(() => { refreshPromise = null; });
    try { await refreshPromise; return api(original); } catch { setAccessToken(null); window.dispatchEvent(new Event('dgd-auth-expired')); }
  }
  const cachedResponse = restorePublicResponse(error);
  if (cachedResponse) return cachedResponse;
  if (!error.response && publicCacheKey(error.config)) announceConnectivity(false, { cached: false });
  return Promise.reject(error);
});

export function apiMessage(error, fallback = 'Не удалось выполнить операцию') {
  return error.response?.data?.error?.message || (error.code === 'ECONNABORTED' ? 'Сервер не ответил вовремя' : fallback);
}

export default api;
