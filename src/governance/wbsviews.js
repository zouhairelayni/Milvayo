// /src/governance/wbsviews.js
// WBS diagrams. Each layout turns the WBS tree into a plain "scene" (rects, paths, text), so the same
// drawing is shown on screen with react-native-svg and exported as a standalone SVG file.

import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { font, useTheme } from '../ui/theme/theme';

export const BRANCH = ['#E0512D', '#3B6FE0', '#2F9E6B', '#D89614', '#8E5CD6', '#14A3B8'];
const branchColor = (n) => (n.branch < 0 ? 'ink' : BRANCH[n.branch % BRANCH.length]);

const clip = (s, max) => (s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s);

// Greedy word wrap into at most maxLines lines of max characters.
function wrap(str, max, maxLines) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= max) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = clip(w, max);
    }
  });
  if (cur) lines.push(cur);
  if (!lines.length) return [''];
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    keep[maxLines - 1] = clip(`${keep[maxLines - 1]} …`, max);
    return keep;
  }
  return lines;
}

const rect = (x, y, w, h, fill, stroke, r = 8, sw = 1.5) => ({ t: 'rect', x, y, w, h, r, fill, stroke, sw });
const path = (d, stroke, sw = 1.5) => ({ t: 'path', d, stroke, sw });
const label = (x, y, s, size, fill, weight = '400', anchor = 'middle', op = 1) => ({ t: 'text', x, y, s, size, fill, weight, anchor, op });

// ---- Tree chart ---------------------------------------------------------------------------------

export function treeScene(tree, dir = 'down') {
  const down = dir === 'down';
  const W = down ? 140 : 210;
  const H = down ? 58 : 34;
  const GX = down ? 14 : 40;
  const GY = down ? 38 : 10;
  const P = 16;
  const pos = new Map();
  let leaves = 0;
  let maxDepth = 0;
  const walk = (n, d) => {
    maxDepth = Math.max(maxDepth, d);
    if (!n.children.length) {
      pos.set(n.id, { d, slot: leaves++ });
      return;
    }
    n.children.forEach((ch) => walk(ch, d + 1));
    pos.set(n.id, { d, slot: (pos.get(n.children[0].id).slot + pos.get(n.children[n.children.length - 1].id).slot) / 2 });
  };
  walk(tree, 0);
  const at = (n) => {
    const p = pos.get(n.id);
    return down ? { x: P + p.slot * (W + GX), y: P + p.d * (H + GY) } : { x: P + p.d * (W + GX), y: P + p.slot * (H + GY) };
  };
  const items = [];
  const nodes = [];
  const visit = (n) => {
    nodes.push(n);
    n.children.forEach(visit);
  };
  visit(tree);

  nodes.forEach((n) => {
    const a = at(n);
    n.children.forEach((ch) => {
      const b = at(ch);
      const d = down
        ? `M ${a.x + W / 2} ${a.y + H} V ${a.y + H + GY / 2} H ${b.x + W / 2} V ${b.y}`
        : `M ${a.x + W} ${a.y + H / 2} H ${a.x + W + GX / 2} V ${b.y + H / 2} H ${b.x}`;
      items.push(path(d, branchColor(ch), 1.6));
    });
  });
  nodes.forEach((n) => {
    const { x, y } = at(n);
    const col = branchColor(n);
    const root = n.level === 0;
    const solid = root || n.level === 1;
    const fill = root ? 'ink' : n.level === 1 ? col : 'surface';
    const ink = root ? 'bg' : n.level === 1 ? '#FFFFFF' : 'ink';
    items.push(rect(x, y, W, H, fill, root ? 'ink' : col));
    if (down) {
      const head = `${n.code || 'Project'}${n.hours ? ` · ${n.hours}h` : ''}`;
      items.push(label(x + W / 2, y + 16, head, 10, ink, '500', 'middle', solid ? 0.8 : 0.6));
      wrap(n.name, Math.floor((W - 14) / 6.2), 2).forEach((ln, i) => items.push(label(x + W / 2, y + 32 + i * 14, ln, 11.5, ink, '600')));
    } else {
      const txt = n.code ? `${n.code}  ${n.name}` : n.name;
      items.push(label(x + 10, y + H / 2 + 4, clip(txt, Math.floor((W - 20) / 6.4)), 11.5, ink, solid ? '600' : '500', 'start'));
    }
  });
  return {
    width: down ? P * 2 + leaves * (W + GX) - GX : P * 2 + (maxDepth + 1) * (W + GX) - GX,
    height: down ? P * 2 + (maxDepth + 1) * (H + GY) - GY : P * 2 + leaves * (H + GY) - GY,
    items,
  };
}

// ---- Fishbone (Ishikawa) ------------------------------------------------------------------------
// The project is the head. Level 1 elements are the major bones, alternating above and below the spine.
// Everything under a major bone becomes a twig; deeper levels get longer arms.

export function fishboneScene(tree) {
  const items = [];
  const cats = tree.children;
  const rowH = 24;
  const slant = 64;
  const labelH = 30;
  const rowsOf = cats.map((cat) => {
    const out = [];
    const walk = (n, l) => n.children.forEach((ch) => { out.push({ n: ch, l }); walk(ch, l + 1); });
    walk(cat, 2);
    return out;
  });
  const text = (r) => clip(`${r.n.code} ${r.n.name}`, 34);
  const twigW = (r) => text(r).length * 6.1 + (r.l - 2) * 12;
  const maxRows = Math.max(2, ...rowsOf.map((r) => r.length));
  const H = maxRows * rowH + 24;
  const mid = H + labelH + 12;

  let cursor = 24;
  for (let k = 0; k < Math.ceil(cats.length / 2); k++) {
    const group = [cats[2 * k], cats[2 * k + 1]].filter(Boolean).map((cat, j) => ({ cat, idx: 2 * k + j, rows: rowsOf[2 * k + j], sign: j === 0 ? -1 : 1 }));
    const textW = Math.max(60, ...group.flatMap((g) => g.rows.map(twigW)));
    const labelW = Math.max(...group.map((g) => Math.max(96, clip(g.cat.name, 22).length * 7.8 + 30)));
    const xTop = cursor + Math.max(textW + 40, labelW / 2 + 8);
    group.forEach((g) => {
      const col = BRANCH[g.idx % BRANCH.length];
      const y = (u) => mid + g.sign * u;
      items.push(path(`M ${xTop} ${y(H)} L ${xTop + slant} ${y(0)}`, col, 2.4));
      const ly = g.sign < 0 ? mid - H - labelH : mid + H;
      items.push(rect(xTop - labelW / 2, ly, labelW, labelH, col, col));
      items.push(label(xTop, ly + labelH / 2 + 4, clip(`${g.cat.code} ${g.cat.name}`, 22), 12, '#FFFFFF', '700'));
      g.rows.forEach((r, i) => {
        // Above the spine rows run from the far end in; below it they read from the spine outward.
        const slot = g.sign < 0 ? i : g.rows.length - 1 - i;
        const u = H - 12 - rowH / 2 - slot * rowH;
        const xb = xTop + slant * (1 - u / H);
        const arm = 14 + (r.l - 2) * 12;
        items.push(path(`M ${xb - arm} ${y(u)} L ${xb} ${y(u)}`, col, 1.5));
        items.push(label(xb - arm - 4, y(u) + 4, text(r), r.l === 2 ? 11 : 10.5, r.l === 2 ? 'ink' : 'muted', r.l === 2 ? '600' : '400', 'end'));
      });
    });
    cursor = Math.max(xTop + slant + 28, xTop + labelW / 2 + 6);
  }
  const endX = cursor + 16;
  items.unshift(path(`M 12 ${mid} H ${endX}`, 'ink', 3.2));
  items.push(rect(endX, mid - 34, 156, 68, 'ink', 'ink', 12));
  wrap(tree.name, 20, 3).forEach((ln, i, a) => items.push(label(endX + 78, mid + 4 - ((a.length - 1) * 14) / 2 + i * 14, ln, 12.5, 'bg', '700')));
  return { width: endX + 156 + 24, height: mid * 2, items };
}

// ---- Mind map -----------------------------------------------------------------------------------
// The project sits in the middle. Level 1 branches are split across the right and left so both
// sides carry a similar number of leaves; every deeper level opens outward in its own column.

export function mindScene(tree) {
  const ROW = 34;
  const GAP = 44;
  const PAD = 20;
  const pill = (n) => (n.level === 0 ? 132 : Math.max(56, clip(n.name, 26).length * 6.4 + 24));
  const leafCount = (n) => (n.children.length ? n.children.reduce((a, ch) => a + leafCount(ch), 0) : 1);

  // Split the branches: walk in order and give the first half of the leaves to the right.
  const total = tree.children.reduce((a, ch) => a + leafCount(ch), 0);
  const right = [];
  const left = [];
  let acc = 0;
  tree.children.forEach((ch) => {
    (acc < total / 2 ? right : left).push(ch);
    acc += leafCount(ch);
  });

  // Column width per depth, shared by both sides so the map stays symmetric.
  const colW = [];
  const measure = (n) => {
    colW[n.level] = Math.max(colW[n.level] || 0, pill(n));
    n.children.forEach(measure);
  };
  tree.children.forEach(measure);
  const maxD = colW.length - 1;
  const reach = [0];
  for (let d = 1; d <= maxD; d++) reach[d] = reach[d - 1] + (d === 1 ? 0 : colW[d - 1] + GAP);
  const rootW = pill(tree);
  const span = maxD > 0 ? reach[maxD] + colW[maxD] : 0;
  const ext = span + (maxD > 0 ? GAP + rootW / 2 : 0);
  const width = PAD * 2 + ext * 2 + (maxD > 0 ? 0 : rootW);
  const cx = width / 2;

  const leavesR = right.reduce((a, ch) => a + leafCount(ch), 0);
  const leavesL = left.reduce((a, ch) => a + leafCount(ch), 0);
  const height = PAD * 2 + Math.max(1, leavesR, leavesL) * ROW;
  const cy = height / 2;

  const items = [];
  const boxes = [];
  const lay = (n, side, slotRef, top) => {
    const w = pill(n);
    const x = side > 0 ? cx + rootW / 2 + GAP + reach[n.level] : cx - rootW / 2 - GAP - reach[n.level] - w;
    let y;
    const kids = n.children.map((ch) => lay(ch, side, slotRef, top));
    if (kids.length) y = (kids[0].y + kids[kids.length - 1].y) / 2;
    else y = top + (slotRef.i++ + 0.5) * ROW;
    const box = { n, x, y, w, side, kids };
    boxes.push(box);
    return box;
  };
  const roots = [];
  [[right, 1, leavesR], [left, -1, leavesL]].forEach(([group, side, leaves]) => {
    const ref = { i: 0 };
    const top = cy - (leaves * ROW) / 2;
    group.forEach((ch) => roots.push(lay(ch, side, ref, top)));
  });

  const rootBox = { x: cx - rootW / 2, y: cy, w: rootW };
  const edge = (x1, y1, x2, y2, col) => {
    const m = (x1 + x2) / 2;
    items.push(path(`M ${x1} ${y1} C ${m} ${y1}, ${m} ${y2}, ${x2} ${y2}`, col, 1.8));
  };
  roots.forEach((r) => edge(r.side > 0 ? rootBox.x + rootW : rootBox.x, cy, r.side > 0 ? r.x : r.x + r.w, r.y, branchColor(r.n)));
  boxes.forEach((b) => b.kids.forEach((k) => edge(b.side > 0 ? b.x + b.w : b.x, b.y, k.side > 0 ? k.x : k.x + k.w, k.y, branchColor(k.n))));

  items.push(rect(rootBox.x, cy - 22, rootW, 44, 'ink', 'ink', 22));
  items.push(label(cx, cy + 4, clip(tree.name, 22), 13, 'bg', '700'));
  boxes.forEach((b) => {
    const col = branchColor(b.n);
    const l1 = b.n.level === 1;
    items.push(rect(b.x, b.y - 13, b.w, 26, l1 ? col : 'surface', col, 13));
    items.push(label(b.x + b.w / 2, b.y + 4, clip(b.n.name, 26), l1 ? 11.5 : 11, l1 ? '#FFFFFF' : 'ink', l1 ? '700' : '500'));
  });
  return { width, height, items };
}

export const sceneFor = (kind, tree, dir) => (kind === 'tree' ? treeScene(tree, dir) : kind === 'fishbone' ? fishboneScene(tree) : mindScene(tree));

// ---- rendering ----------------------------------------------------------------------------------

export function Scene({ scene, scale = 1 }) {
  const { c } = useTheme();
  const k = (v) => (v && c[v]) || v;
  return (
    <Svg width={scene.width * scale} height={scene.height * scale} viewBox={`0 0 ${scene.width} ${scene.height}`}>
      {scene.items.map((it, i) => {
        if (it.t === 'rect') return <Rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} rx={it.r} fill={k(it.fill)} stroke={k(it.stroke)} strokeWidth={it.sw} />;
        if (it.t === 'path') return <Path key={i} d={it.d} stroke={k(it.stroke)} strokeWidth={it.sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        return (
          <SvgText key={i} x={it.x} y={it.y} fontSize={it.size} fontWeight={it.weight} fill={k(it.fill)} textAnchor={it.anchor} opacity={it.op} fontFamily={font}>
            {it.s}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A standalone SVG file of the scene, painted with the colours of the theme in use.
export function sceneToSvg(scene, c) {
  const k = (v) => (v && c[v]) || v;
  const body = scene.items
    .map((it) => {
      if (it.t === 'rect') return `<rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="${it.r}" fill="${k(it.fill)}" stroke="${k(it.stroke)}" stroke-width="${it.sw}"/>`;
      if (it.t === 'path') return `<path d="${it.d}" fill="none" stroke="${k(it.stroke)}" stroke-width="${it.sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
      return `<text x="${it.x}" y="${it.y}" font-size="${it.size}" font-weight="${it.weight}" fill="${k(it.fill)}" text-anchor="${it.anchor}" opacity="${it.op}">${esc(it.s)}</text>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" font-family="Inter, Segoe UI, system-ui, sans-serif">\n<rect width="100%" height="100%" fill="${c.bg}"/>\n${body}\n</svg>\n`;
}
