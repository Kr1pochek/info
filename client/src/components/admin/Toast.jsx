import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useAdminI18n } from '../../utils/adminLocalization.js';
export default function Toast({ message, messageKz, type = 'success', onClose }) { const { tr } = useAdminI18n(); if (!message) return null; return <div className={`toast toast--${type}`} role="status">{type === 'success' ? <CheckCircle2 /> : <XCircle />}<span>{tr(message, messageKz)}</span><button onClick={onClose} aria-label={tr('Закрыть')}><X size={18} /></button></div>; }
