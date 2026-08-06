import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { apiMessage } from '../api/client.js';

const SettingsContext = createContext(null);
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/settings/public'); setSettings(response.data.data); }
    catch (err) { setError(apiMessage(err, 'Сервис временно недоступен.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <SettingsContext.Provider value={{ settings, loading, error, reload: load }}>{children}</SettingsContext.Provider>;
}
export const useSettings = () => useContext(SettingsContext);
