// /src/governance/diagramPng.native.js
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
export const needsSvgCapture = true;
const { pngDimensions } = require('./diagramExport.cjs');
let exportSerial = 0;

export function rasterizeDiagram({ svgRef, plan, signal, isCurrent = () => true }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, data) => {
      if (settled) return; settled = true;
      clearTimeout(timeout); signal?.removeEventListener('abort', cancel);
      if (error) reject(error); else resolve(data);
    };
    const cancel = () => finish(Error('Export cancelled'));
    const timeout = setTimeout(() => finish(Error('PNG capture timed out. Try SVG export.')), 12000);
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      if (signal?.aborted || !isCurrent() || !svgRef.current?.toDataURL) throw Error('Diagram capture is unavailable. Try SVG export.');
      svgRef.current.toDataURL(data => {
        if (!isCurrent()) { finish(Error('Export cancelled')); return; }
        if (typeof data !== 'string' || !data.startsWith('iVBORw0KGgo') || data.length > 32 * 1024 * 1024) { finish(Error('Invalid or oversized PNG. Try SVG export.')); return; }
        try {
          const dimensions = pngDimensions(data);
          if (dimensions.width !== plan.width || dimensions.height !== plan.height) throw Error('PNG dimensions do not match the complete diagram. Try SVG export.');
        } catch (error) { finish(error); return; }
        finish(null, data);
      }, { width: plan.width, height: plan.height });
    } catch (error) { finish(error); }
  });
}

export async function saveDiagramPng(name, base64) {
  if (!await Sharing.isAvailableAsync()) throw Error('System sharing is unavailable. Try exporting when sharing is available.');
  let file;
  try {
    const directory = new Directory(Paths.cache, 'milvayo-diagrams');
    if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
    file = new File(directory, `${Date.now()}-${++exportSerial}-${name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`);
    file.create(); file.write(base64, { encoding: 'base64' });
    await Sharing.shareAsync(file.uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Save or share Milvayo diagram' });
    // Keep the latest shared file available to Android's recipient; retire only older exports.
    // Inspect the dedicated directory so retention also works across app sessions.
    try {
      const files = directory.list().filter(item => item instanceof File).sort((a, b) => Number(b.uri === file.uri) - Number(a.uri === file.uri) || b.name.localeCompare(a.name));
      for (const old of files.slice(3)) if (old.uri !== file.uri) old.delete();
    } catch {}
  } catch (error) { try { if (file?.exists) file.delete(); } catch {} throw error; }
}
