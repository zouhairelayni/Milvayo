// /src/ui/theme/theme.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {ACCENTS,DEFAULT_ACCENT,STORAGE_KEY,palette}=require('./theme.cjs');
export {ACCENTS};

// Appearance surfaces come from the selected RIVNA accent; semantic status colors remain independent.
export const LIGHT = palette(DEFAULT_ACCENT, 'light');
export const DARK = palette(DEFAULT_ACCENT, 'dark');
export const AMOLED = palette(DEFAULT_ACCENT, 'amoled');

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
  useEffect(() => { let active=true; Promise.all([AsyncStorage.getItem('niyarvo-projects-appearance-v1'),AsyncStorage.getItem(STORAGE_KEY)]).then(([m,a])=>{if(!active)return;if(['system','light','dark','amoled'].includes(m))changeMode(m);if(ACCENTS.some(c=>c.id===a))changeAccent(a);}).catch(()=>{});return()=>{active=false}; }, []);
  const setPref = (value) => {changeMode(value);AsyncStorage.setItem('niyarvo-projects-appearance-v1',value).catch(()=>{});};
  const setAccent = (value) => {if(!ACCENTS.some(a=>a.id===value))return;changeAccent(value);AsyncStorage.setItem(STORAGE_KEY,value).catch(()=>{});};
  const mode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  const value = useMemo(
    () => {
      return {pref,setPref,mode,accentPref,setAccent,c:palette(accentPref, mode)};
    },
    [pref, mode, accentPref]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
