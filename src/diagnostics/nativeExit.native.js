// /src/diagnostics/nativeExit.native.js
import { Platform } from 'react-native';
export async function readNativeExit() {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 30) return null;
  try {
    const { requireOptionalNativeModule } = require('expo');
    const native = requireOptionalNativeModule('ExpoAlternateAppIcons');
    const exit = await native?.getPreviousProcessExit?.();
    return exit && Number.isFinite(exit.timestamp) && exit.timestamp > 0 && Number.isInteger(exit.reason)
      ? { timestamp: exit.timestamp, reason: exit.reason } : null;
  } catch { return null; } // Expo Go, older builds and unavailable OS history remain supported.
}
