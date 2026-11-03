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

// NP533_MOBILE_BROWSER_MODE: Web's CSS viewport alone cannot distinguish a portrait phone from Desktop site.
function np533MobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  // Some browsers keep a mobile UA on Desktop site but expand the CSS viewport.
  if (typeof window !== 'undefined') {
    const sw = Number(window.screen && window.screen.width);
    const vw = Number(window.innerWidth);
    if (sw > 0 && sw <= 600 && vw >= 700 && vw / sw >= 1.6) return false;
  }
  const hints = navigator.userAgentData;
  if (hints && typeof hints.mobile === 'boolean') return hints.mobile;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(String(navigator.userAgent || ''));
}
const np533OriginalDesktopLayout = module.exports.isDesktopLayout;
module.exports.isDesktopLayout = function(width, platform, preference = 'auto', mobileHint) {
  if (platform === 'web' && preference !== 'desktop') {
    const mobile = typeof mobileHint === 'boolean' ? mobileHint : np533MobileBrowser();
    if (mobile) return false;
  }
  return np533OriginalDesktopLayout(width, platform, preference);
};
