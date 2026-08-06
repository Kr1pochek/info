import { CheckCircle2, X, XCircle } from 'lucide-react';
export default function Toast({ message, type = 'success', onClose }) { if (!message) return null; return <div className={`toast toast--${type}`} role="status">{type === 'success' ? <CheckCircle2 /> : <XCircle />}<span>{message}</span><button onClick={onClose} aria-label="Закрыть"><X size={18} /></button></div>; }
