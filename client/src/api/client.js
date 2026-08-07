import axios from 'axios';

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;
  const networkUrl = `${window.location.protocol}//${window.location.hostname}:4000/api`;
  if (!configuredUrl) return networkUrl;

  try {
    const url = new URL(configuredUrl);
    const pageIsNetworkHost = !['localhost', '127.0.0.1'].includes(window.location.hostname);
    const apiIsLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname);
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

api.interceptors.response.use((response) => response, async (error) => {
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
  return Promise.reject(error);
});

export function apiMessage(error, fallback = 'Не удалось выполнить операцию') {
  return error.response?.data?.error?.message || (error.code === 'ECONNABORTED' ? 'Сервер не ответил вовремя' : fallback);
}

export default api;
