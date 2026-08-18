import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const attemptedAdminBootstrap = useRef(false);
  const adopt = useCallback((data) => { setAccessToken(data.accessToken); setUser(data.user); }, []);
  useEffect(() => {
    if (pathname.startsWith('/admin') && !attemptedAdminBootstrap.current) {
      attemptedAdminBootstrap.current = true;
      setReady(false);
      api.post('/auth/refresh').then((response) => adopt(response.data.data)).catch(() => { setAccessToken(null); setUser(null); }).finally(() => setReady(true));
    } else if (!pathname.startsWith('/admin')) {
      setReady(true);
    }
  }, [adopt, pathname]);
  useEffect(() => {
    const refreshed = (event) => setUser(event.detail.user);
    const expired = () => setUser(null);
    window.addEventListener('dgd-auth-refresh', refreshed); window.addEventListener('dgd-auth-expired', expired);
    return () => { window.removeEventListener('dgd-auth-refresh', refreshed); window.removeEventListener('dgd-auth-expired', expired); };
  }, []);
  const login = async (credentials) => { const response = await api.post('/auth/login', credentials); adopt(response.data.data); return response.data.data.user; };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setAccessToken(null); setUser(null); } };
  const value = { user, ready, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
