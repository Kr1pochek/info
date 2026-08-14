import { AlertCircle, LoaderCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { translateAdminText } from '../../utils/adminLocalization.js';

export function LoadingState({ text = 'Загрузка…' }) {
  const { language } = useLanguage();
  return <div className="state-panel" role="status"><LoaderCircle className="spin" size={42} /><p>{translateAdminText(text, language)}</p></div>;
}
export function EmptyState({ text }) {
  const { language } = useLanguage();
  return <div className="state-panel"><AlertCircle size={42} /><p>{translateAdminText(text, language)}</p></div>;
}
export function ErrorState({ title, text, onRetry, retryText = 'Повторить' }) {
  const { language } = useLanguage();
  return <div className="state-panel state-panel--error" role="alert"><AlertCircle size={46} /><h2>{translateAdminText(title, language)}</h2><p>{translateAdminText(text, language)}</p>{onRetry && <button className="button button--primary" onClick={onRetry}><RotateCcw size={22} />{translateAdminText(retryText, language)}</button>}</div>;
}
