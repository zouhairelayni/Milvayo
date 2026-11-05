// /src/ui/theme/iconName.cjs
'use strict';
// One icon per accent + resolved appearance; the Coral/Dark primary is not an alternate.
const ACCENTS = Object.freeze(['Aqua','Mint','Lime','Amber','Orange','Coral','Pink','Fuchsia','Violet','Indigo']);
const MODES = Object.freeze(['light','dark','amoled']);
const DEFAULT_ACCENT = 'Coral';
function iconChoice(accent, mode) {
  const id = ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
  const appearance = MODES.includes(mode) ? mode : 'dark';
  const slug = `${id.toLowerCase()}-${appearance}`;
  return {
    accent: id,
    mode: appearance,
    slug,
    nativeName: id === 'Coral' && appearance === 'dark' ? null : `${id}${appearance[0].toUpperCase()}${appearance.slice(1)}`,
    manifest: `/manifests/${slug}.json?v=060-themeicons`,
    favicon: `/icons/theme/${slug}-64.png?v=060-themeicons`,
    appleTouch: `/icons/theme/${slug}-180.png?v=060-themeicons`,
  };
}
module.exports = { ACCENTS, MODES, iconChoice };
