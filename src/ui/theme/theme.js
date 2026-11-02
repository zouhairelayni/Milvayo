// /src/ui/theme/theme.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {ACCENTS,DEFAULT_ACCENT,STORAGE_KEY}=require('./theme.cjs');
export {ACCENTS};

// Warm paper and graphite. One vermilion accent. Status colours are shared by both modes.
export const LIGHT = {
  mode: 'light',
  bg: '#F3F0E9',
  surface: '#FFFFFF',
  surfaceAlt: '#EAE5DB',
  ink: '#1B1915',
  muted: '#756E62',
  faint: '#B3AB9C',
  line: '#E2DCD0',
  accent: '#E0512D',
  accentInk: '#FFFFFF',
};

export const DARK = {
  mode: 'dark',
  bg: '#0E0D0C',
  surface: '#181614',
  surfaceAlt: '#221F1B',
  ink: '#F2EDE4',
  muted: '#978F82',
  faint: '#5C5649',
  line: '#2B2723',
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

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

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
      const hex = accent.slice(1),r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
      const luminance=(.2126*r+.7152*g+.0722*b);
      return {pref,setPref,mode,accentPref,setAccent,c:{...base,accent,accentInk:luminance>165?'#171514':'#FFFFFF'}};
    },
    [pref, mode, accentPref]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
