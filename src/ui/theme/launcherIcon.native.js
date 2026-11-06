// /src/ui/theme/launcherIcon.native.js
// Native launcher icons are built into APK/IPA by expo-alternate-app-icons.
// This file deliberately does not import the native module at module-evaluation time:
// Expo Go cannot load it and must keep running without a native icon switch.
import { Platform } from 'react-native';
import { iconChoice } from './iconName.cjs';
let queue = Promise.resolve();
let latestRequested = null;
export function syncLauncherIcon(accent, mode, flush) {
  const desired = iconChoice(accent, mode).nativeName;
  latestRequested = desired;
  queue = queue.catch(() => {}).then(async () => {
    if (latestRequested !== desired) return false; // coalesce quick preference changes
    let plugin;
    try { plugin = require('expo-alternate-app-icons'); }
    catch (_) { return false; } // Expo Go: no native module
    try {
      // A confirmed alias change may terminate the Activity: refuse it until pending data is durable.
      if (flush && !(await flush())) return false;
      if (!plugin.supportsAlternateIcons) return false;
      const current = plugin.getAppIconName();
      if (Platform.OS !== 'android' && (current || null) === desired) return true;
      await plugin.setAlternateAppIcon(desired);
      return true;
    } catch (error) {
      console.warn('[Milvayo] Launcher icon update was not applied:', error?.message || error);
      return false;
    }
  });
  return queue;
}
