import { AlertCircle, LoaderCircle, RotateCcw } from 'lucide-react';

export function LoadingState({ text = 'Загрузка…' }) {
  return <div className="state-panel" role="status"><LoaderCircle className="spin" size={42} /><p>{text}</p></div>;
}
export function EmptyState({ text }) {
  return <div className="state-panel"><AlertCircle size={42} /><p>{text}</p></div>;
}
export function ErrorState({ title, text, onRetry, retryText = 'Повторить' }) {
  return <div className="state-panel state-panel--error" role="alert"><AlertCircle size={46} /><h2>{title}</h2><p>{text}</p>{onRetry && <button className="button button--primary" onClick={onRetry}><RotateCcw size={22} />{retryText}</button>}</div>;
}
