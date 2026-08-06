import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  timeout: 10000,
});

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
