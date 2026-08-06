import { useEffect, useState } from 'react';
import api, { apiMessage } from '../api/client.js';
import { track } from '../api/analytics.js';

export function useServiceSearch(query, language) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); setError(''); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await api.get('/services/search', { params: { q: q.slice(0, 80), lang: language }, signal: controller.signal });
        setResults(response.data.data); track('SEARCH', { searchQuery: q.slice(0, 80), metadata: { language, results: response.data.data.length } });
      } catch (err) { if (err.name !== 'CanceledError') setError(apiMessage(err)); }
      finally { setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, language]);
  return { results, loading, error };
}
