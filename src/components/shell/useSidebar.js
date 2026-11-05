// /src/components/shell/useSidebar.js
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const layout = require('../../ui/theme/layout.cjs');

export const SIDEBAR_KEY = 'milvayo-sidebar-v1';

// Sidebar open/collapsed. Automatic until the user presses the sidebar button; the choice is remembered on the device.
export function useSidebar(bp) {
  const [pref, setPref] = useState(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SIDEBAR_KEY).then((v) => { if (active && (v === 'open' || v === 'collapsed')) setPref(v); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const toggle = useCallback(() => {
    const next = layout.toggledPref(bp, pref);
    setPref(next);
    AsyncStorage.setItem(SIDEBAR_KEY, next).catch(() => {});
  }, [bp, pref]);
  return { collapsed: layout.sidebarCollapsed(bp, pref), toggle };
}
