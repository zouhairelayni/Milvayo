// /src/ui/uiBase.js
import { createContext, useCallback, useContext, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { isDesktopLayout } from './layoutMode.cjs';
import { font, radius, serif, useTheme } from './theme/theme';

// Browser layout preference is purely visual; no workspace or task data is touched.
const LayoutContext = createContext({ preference: 'auto', setPreference: () => {} });
const STORAGE_KEY = 'niyarvo-projects:web-layout';

export function LayoutProvider({ children }) {
  const [preference, setValue] = useState(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return 'auto';
    try { return window.localStorage.getItem(STORAGE_KEY) === 'desktop' ? 'desktop' : 'auto'; }
    catch { return 'auto'; }
  });
  const setPreference = useCallback((next) => {
    const value = next === 'desktop' && Platform.OS === 'web' ? 'desktop' : 'auto';
    setValue(value);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (value === 'auto') window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, value);
      } catch { /* Private browsing may block storage; the current session still works. */ }
    }
  }, []);
  return <LayoutContext.Provider value={{ preference, setPreference }}>{children}</LayoutContext.Provider>;
}

export const useLayoutPreference = () => useContext(LayoutContext);
export const useWide = () => {
  const { width } = useWindowDimensions();
  const { preference } = useLayoutPreference();
  return isDesktopLayout(width, Platform.OS, preference);
};

export function T({ children, size = 14, weight = '400', color, muted, serifFace, upper, center, numberOfLines, style, pointerEvents }) {
  const { c } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      pointerEvents={pointerEvents}
      style={[
        {
          fontFamily: serifFace ? serif : font,
          fontSize: size,
          fontWeight: weight,
          color: color || (muted ? c.muted : c.ink),
          letterSpacing: upper ? 1 : size >= 20 ? -0.4 : 0,
          textTransform: upper ? 'uppercase' : 'none',
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress, pad = 16 }) {
  const { c } = useTheme();
  const body = (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: pad }, style]}>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Pill({ label, color }) {
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: color + '22' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <T size={11} weight="600" color={color}>{label}</T>
    </View>
  );
}

const HUES = ['#E0512D', '#3B6FE0', '#2F9E6B', '#D89614', '#8E5CD6', '#14A3B8'];
const hash = (s) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

export function Avatar({ name = '?', size = 24 }) {
  const initials = name.split(' ').map((p) => p[0] || '').slice(0, 2).join('').toUpperCase();
  const hue = HUES[hash(name) % HUES.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hue + '26', borderWidth: 1, borderColor: hue + '55', alignItems: 'center', justifyContent: 'center' }}>
      <T size={Math.round(size * 0.36)} weight="700" color={hue}>{initials}</T>
    </View>
  );
}

export function Bar({ value = 0, color, height = 6, track }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track || c.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color || c.accent }} />
    </View>
  );
}
