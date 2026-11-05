// /src/ui/theme/launcherIcon.native.js
// Native launcher icons are built into APK/IPA by expo-alternate-app-icons.
// This file deliberately does not import the native module at module-evaluation time:
// Expo Go cannot load it and must keep running without a native icon switch.
import { iconChoice } from './iconName.cjs';
let queue = Promise.resolve();
let latestRequested = null;
export function syncLauncherIcon(accent, mode) {
  const desired = iconChoice(accent, mode).nativeName;
  latestRequested = desired;
  queue = queue.catch(() => {}).then(async () => {
    if (latestRequested !== desired) return false; // coalesce quick preference changes
    let plugin;
    try { plugin = require('expo-alternate-app-icons'); }
    catch (_) { return false; } // Expo Go: no native module
    try {
      if (!plugin.supportsAlternateIcons) return false;
      const current = plugin.getAppIconName();
      if ((current || null) === desired) return true;
      await plugin.setAlternateAppIcon(desired);
      return true;
    } catch (error) {
      console.warn('[Milvayo] Launcher icon update was not applied:', error?.message || error);
      return false;
    }
  });
  return queue;
}
