import { Delete as DeleteIcon, Space, X } from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

const COMMON_ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
];

const KAZAKH_ROW = ['ә', 'і', 'ң', 'ғ', 'ү', 'ұ', 'қ', 'ө', 'һ'];

const LABELS = {
  ru: { title: 'Экранная клавиатура', clear: 'Очистить', space: 'Пробел', backspace: 'Удалить', close: 'Готово' },
  kz: { title: 'Экрандық пернетақта', clear: 'Тазарту', space: 'Бос орын', backspace: 'Өшіру', close: 'Дайын' },
};

export default function VirtualKeyboard({ value, onChange, onClose }) {
  const { language } = useLanguage();
  const labels = LABELS[language];
  const rows = language === 'kz' ? [KAZAKH_ROW, ...COMMON_ROWS] : COMMON_ROWS;

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const addCharacter = (character) => {
    if (value.length < 80) onChange(`${value}${character}`);
  };

  const keepInputFocused = (event) => event.preventDefault();

  return <div className="virtual-keyboard-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="virtual-keyboard" role="dialog" aria-modal="true" aria-label={labels.title}>
      <header className="virtual-keyboard__header">
        <strong>{labels.title}</strong>
        <button type="button" onPointerDown={keepInputFocused} onClick={onClose} aria-label={labels.close}><X /></button>
      </header>
      <div className="virtual-keyboard__keys">
        {rows.map((row, rowIndex) => <div className="virtual-keyboard__row" key={rowIndex}>
          {row.map((character) => <button type="button" className="virtual-keyboard__key" key={character} onPointerDown={keepInputFocused} onClick={() => addCharacter(character)}>{character}</button>)}
        </div>)}
      </div>
      <div className="virtual-keyboard__actions">
        <button type="button" onPointerDown={keepInputFocused} onClick={() => onChange('')}><X size={22} />{labels.clear}</button>
        <button type="button" className="virtual-keyboard__space" onPointerDown={keepInputFocused} onClick={() => addCharacter(' ')}><Space size={23} />{labels.space}</button>
        <button type="button" onPointerDown={keepInputFocused} onClick={() => onChange(value.slice(0, -1))}><DeleteIcon size={23} />{labels.backspace}</button>
        <button type="button" className="virtual-keyboard__done" onPointerDown={keepInputFocused} onClick={onClose}>{labels.close}</button>
      </div>
    </section>
  </div>;
}
