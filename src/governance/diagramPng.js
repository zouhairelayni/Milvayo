// /src/governance/diagramPng.js
import { sceneToSvg } from './diagramScene.cjs';
export const needsSvgCapture = false;

// Export the entire viewBox into an explicitly bounded bitmap, never a viewport screenshot.
export async function rasterizeDiagram({ scene, colors, plan, transparent, signal, isCurrent = () => true }) {
  await document.fonts?.ready;
  if (!isCurrent() || signal?.aborted) throw Error('Export cancelled');
  const svg = sceneToSvg(scene, colors, { transparent });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const canvas = document.createElement('canvas');
  let cancelImage;
  const image = new Image();
  try {
    await new Promise((resolve, reject) => {
      cancelImage = () => { image.src = ''; reject(Error('Export cancelled')); };
      signal?.addEventListener('abort', cancelImage, { once: true });
      image.onload = resolve; image.onerror = () => reject(Error('The diagram could not be rendered. Try SVG export.')); image.src = url;
    });
    if (!isCurrent()) throw Error('Export cancelled');
    canvas.width = plan.width; canvas.height = plan.height;
    const context = canvas.getContext('2d');
    if (!context) throw Error('PNG rendering is unavailable. Export SVG instead.');
    context.drawImage(image, 0, 0, plan.width, plan.height);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('PNG encoding failed. Try SVG export.')), 'image/png'));
  } finally { signal?.removeEventListener('abort', cancelImage); image.onload = image.onerror = null; URL.revokeObjectURL(url); canvas.width = canvas.height = 0; }
}

export async function saveDiagramPng(name, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try { anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); }
  finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
}
