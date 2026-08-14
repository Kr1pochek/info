import { useEffect, useState } from 'react';
import api, { apiMessage } from '../api/client.js';
import { track } from '../api/analytics.js';
import { findSearchSuggestions } from '../utils/searchSuggestions.js';

export function useServiceSearch(query, language) {
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSuggestions([]); setLoading(false); setError(''); return undefined; }
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await api.get('/services/search', { params: { q: q.slice(0, 80), lang: language }, signal: controller.signal });
        if (!active) return;
        const nextResults = response.data.data;
        let nextSuggestions = [];
        if (!nextResults.length) {
          try {
            const candidatesResponse = await api.get('/services', { params: { limit: 100 }, signal: controller.signal });
            if (!active) return;
            nextSuggestions = findSearchSuggestions(q, candidatesResponse.data.data, {
              getLabel: (item) => item[language === 'kz' ? 'titleKz' : 'titleRu'],
              getSearchText: (item) => [item.titleRu, item.titleKz, item.category?.titleRu, item.category?.titleKz],
            });
          } catch (suggestionError) {
            if (suggestionError.name === 'CanceledError') throw suggestionError;
          }
        }
        setResults(nextResults); setSuggestions(nextSuggestions);
        track('SEARCH', { searchQuery: q.slice(0, 80), metadata: { language, results: nextResults.length, suggestions: nextSuggestions.length } });
      } catch (err) { if (active && err.name !== 'CanceledError') { setSuggestions([]); setError(apiMessage(err)); } }
      finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, language]);
  return { results, suggestions, loading, error };
}
