// /src/ui/theme/theme.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {ACCENTS,DEFAULT_ACCENT,STORAGE_KEY,contrastInk}=require('./theme.cjs');
export {ACCENTS};

// Warm paper and graphite. One vermilion accent. Status colours are shared by both modes.
export const LIGHT = {
  mode: 'light',
  bg: '#F7F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE9',
  ink: '#24231F',
  muted: '#69655E',
  faint: '#9E998F',
  line: '#E5E2DC',
  accent: '#C24328',
  accentInk: '#FFFFFF',
};

export const DARK = {
  mode: 'dark',
  bg: '#111315',
  surface: '#1B1D1F',
  surfaceAlt: '#25272A',
  ink: '#F2F0EA',
  muted: '#ACA8A0',
  faint: '#77746F',
  line: '#343638',
  accent: '#FF7A55',
  accentInk: '#170B06',
};

export const STATUS_COLOR = {
  Backlog: '#8C8577',
  'In progress': '#3B6FE0',
  Validation: '#D89614',
  Done: '#2F9E6B',
};

export const PRIORITY_COLOR = {
  Low: '#8C8577',
  Medium: '#3B6FE0',
  High: '#D89614',
  Critical: '#E0512D',
};

export const font = Platform.select({
  web: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
});

export const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: '"Iowan Old Style", Georgia, serif',
  default: 'serif',
});

export const radius = { sm: 9, md: 14, lg: 20, pill: 999 };

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [pref, changeMode] = useState('system');
  const [accentPref, changeAccent] = useState(DEFAULT_ACCENT);
  useEffect(() => { let active=true; Promise.all([AsyncStorage.getItem('niyarvo-projects-appearance-v1'),AsyncStorage.getItem(STORAGE_KEY)]).then(([m,a])=>{if(!active)return;if(['system','light','dark'].includes(m))changeMode(m);if(ACCENTS.some(c=>c.id===a))changeAccent(a);}).catch(()=>{});return()=>{active=false}; }, []);
  const setPref = (value) => {changeMode(value);AsyncStorage.setItem('niyarvo-projects-appearance-v1',value).catch(()=>{});};
  const setAccent = (value) => {if(!ACCENTS.some(a=>a.id===value))return;changeAccent(value);AsyncStorage.setItem(STORAGE_KEY,value).catch(()=>{});};
  const mode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  const value = useMemo(
    () => {
      const base = mode === 'dark' ? DARK : LIGHT;
      const chosen = ACCENTS.find(a => a.id === accentPref);
      // Preserve the original vermilion Orange rather than replacing the brand color.
      const accent = accentPref === 'Orange' ? base.accent : chosen?.hex || base.accent;
      return {pref,setPref,mode,accentPref,setAccent,c:{...base,accent,accentInk:contrastInk(accent)}};
    },
    [pref, mode, accentPref]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
