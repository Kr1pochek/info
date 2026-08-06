import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const adopt = useCallback((data) => { setAccessToken(data.accessToken); setUser(data.user); }, []);
  useEffect(() => {
    api.post('/auth/refresh').then((response) => adopt(response.data.data)).catch(() => { setAccessToken(null); setUser(null); }).finally(() => setReady(true));
    const refreshed = (event) => setUser(event.detail.user);
    const expired = () => setUser(null);
    window.addEventListener('dgd-auth-refresh', refreshed); window.addEventListener('dgd-auth-expired', expired);
    return () => { window.removeEventListener('dgd-auth-refresh', refreshed); window.removeEventListener('dgd-auth-expired', expired); };
  }, [adopt]);
  const login = async (credentials) => { const response = await api.post('/auth/login', credentials); adopt(response.data.data); return response.data.data.user; };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setAccessToken(null); setUser(null); } };
  const value = { user, ready, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
