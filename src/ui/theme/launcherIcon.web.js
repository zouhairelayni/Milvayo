// /src/ui/theme/launcherIcon.web.js
// Browsers can update their tab icon and install manifest. They cannot reliably
// replace the home-screen icon of an *already installed* PWA; reinstall for that.
import { iconChoice } from './iconName.cjs';
const { palette } = require('./theme.cjs');
function getLink(rel) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) { link = document.createElement('link'); link.rel = rel; document.head.appendChild(link); }
  return link;
}
export function syncLauncherIcon(accent, mode) {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const choice = iconChoice(accent, mode);
  const favicon = getLink('icon');
  favicon.type = 'image/png';
  favicon.href = choice.favicon;
  getLink('manifest').href = choice.manifest;
  getLink('apple-touch-icon').href = choice.appleTouch;
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.content = palette(choice.accent, choice.mode).bg;
  return Promise.resolve(true);
}
