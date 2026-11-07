// /src/governance/diagramExport.cjs
'use strict';
function pngPlan(scene, requestedScale = 2, platform = 'web') {
  if (![scene.width, scene.height].every(n => Number.isFinite(n) && n > 0)) throw Error('Invalid diagram dimensions');
  if (![2, 4].includes(requestedScale)) throw Error('Choose 2× or 4× PNG quality');
  const maxPixels = platform === 'web' ? 12 * 1024 * 1024 : 4 * 1024 * 1024;
  const maxSide = platform === 'web' ? 8192 : 4096;
  const scale = Math.min(requestedScale, maxSide / scene.width, maxSide / scene.height, Math.sqrt(maxPixels / (scene.width * scene.height)));
  const width = Math.max(1, Math.floor(scene.width * scale)), height = Math.max(1, Math.floor(scene.height * scale));
  return { width, height, scale, requestedScale, limited: scale < requestedScale, pixels: width * height, rgbaBytes: width * height * 4, maxPixels, maxSide };
}
const exportSlug = name => String(name || 'Project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
function pngDimensions(base64) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = []; let bits = 0, buffer = 0;
  for (const character of base64.slice(0, 44)) {
    const value = alphabet.indexOf(character); if (value < 0) break;
    buffer = (buffer << 6) | value; bits += 6;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >>> bits) & 255); }
  }
  if (bytes.length < 24 || bytes.slice(0, 8).join() !== '137,80,78,71,13,10,26,10' || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') throw Error('Invalid PNG header');
  const integer = at => bytes[at] * 16777216 + bytes[at + 1] * 65536 + bytes[at + 2] * 256 + bytes[at + 3];
  return { width: integer(16), height: integer(20) };
}
module.exports = { pngPlan, exportSlug, pngDimensions };
