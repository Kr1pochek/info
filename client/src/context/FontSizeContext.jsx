import { createContext, useContext, useState } from 'react';

const FontContext = createContext(null);
const sizes = ['normal', 'large', 'xlarge'];
export function FontSizeProvider({ children }) {
  const [fontSize, setFontState] = useState('normal');
  const [visionMode, setVisionMode] = useState(false);
  const setFontSize = (value) => { setFontState(value); };
  const cycleFontSize = () => {
    const next = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
    setFontSize(next);
    return next;
  };
  const toggleVisionMode = () => {
    const enabled = !visionMode;
    setVisionMode(enabled);
    setFontState(enabled ? 'xlarge' : 'normal');
    return enabled;
  };
  const resetFontSize = () => { setVisionMode(false); setFontSize('normal'); };
  const value = { fontSize, setFontSize, cycleFontSize, visionMode, toggleVisionMode, resetFontSize };
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}
export const useFontSize = () => useContext(FontContext);
