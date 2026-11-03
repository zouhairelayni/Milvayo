// /src/ui/layoutMode.cjs
'use strict';

// React Native Web reports CSS layout pixels, not screenshot/image pixels.
// A landscape phone browser in "Desktop site" mode can have a 320–879px viewport.
const WEB_DESKTOP_MIN = 320;
const NATIVE_DESKTOP_MIN = 900;
function isDesktopLayout(width, platform, preference = 'auto') {
  if (platform === 'web' && preference === 'desktop') return true;
  if (platform === 'web' && preference === 'mobile') return false;
  return Number.isFinite(width) && width >= (platform === 'web' ? WEB_DESKTOP_MIN : NATIVE_DESKTOP_MIN);
}
module.exports = { WEB_DESKTOP_MIN, NATIVE_DESKTOP_MIN, isDesktopLayout };
