import { createContext, useContext, useState } from 'react';
import { track } from '../api/analytics.js';

const FontContext = createContext(null);
const sizes = ['normal', 'large', 'xlarge'];
export function FontSizeProvider({ children }) {
  const [fontSize, setFontState] = useState('normal');
  const [visionMode, setVisionMode] = useState(false);
  const setFontSize = (value, silent = false) => { setFontState(value); if (!silent) track('FONT_SIZE_CHANGE', { metadata: { size: value } }); };
  const cycleFontSize = () => setFontSize(sizes[(sizes.indexOf(fontSize) + 1) % sizes.length]);
  const toggleVisionMode = () => {
    const enabled = !visionMode;
    setVisionMode(enabled);
    setFontState(enabled ? 'xlarge' : 'normal');
    track('FONT_SIZE_CHANGE', { metadata: { size: enabled ? 'vision-mode' : 'normal' } });
  };
  const resetFontSize = () => { setVisionMode(false); setFontSize('normal', true); };
  const value = { fontSize, setFontSize, cycleFontSize, visionMode, toggleVisionMode, resetFontSize };
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}
export const useFontSize = () => useContext(FontContext);
