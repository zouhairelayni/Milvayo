# Scoped Ponytail audit — Projects diagrams

What this repo does: Milvayo is a local-first project workspace. This audit follows its WBS outline through Tree/Fishbone/Mind map rendering, gestures, project switching and file export, assuming up to the model's 500 WBS elements and 40 hierarchy levels. It does not infer WBS links from project tasks.

## Must fix

1. **Native diagrams can request enormous bitmaps.** The SVG is sized to the whole scene inside a transformed stage. In the 500-element fixture, Tree is 61,618 × 474 logical units; the installed Android SVG renderer creates its drawing bitmap at native view size. Density 3 implies about 1.05 GB of RGBA pixels, before other buffers. This is a source estimate, not an observed allocation. Fix with a viewport-sized native canvas and UI-thread viewBox camera; retain the original Timeline implementation.

2. **Revisiting a diagram repeats layout and JSX generation.** The original `useMemo` retains only the previous selected scene. Executing the original component shows Tree → Fishbone → Tree calculates Tree twice. Returning after unmount loses those memo values too. Fix with a bounded workspace/project/relevant-data/layout cache and reusable primitive output. Keep only the active native scene mounted.

## Should fix

3. **Export and inspection need a separate lifecycle.** A transformed viewport is not the complete image, and full-size native image surfaces risk the same bitmap problem. Build exports only on explicit request, from cached geometry, with validated dimensions, a raster budget, cancellation and a layout-ready bounded source. CSV and inspection must read fresh owner/description data even though those fields do not affect geometry.

4. **The diagram needs dedicated exploration space.** The embedded area is limited to 440 units and has no full-screen context. Use a compact Expand control, safe-area full-screen canvas, small zoom/fit/reset controls, pan alternatives and the existing sheets for inspection/export. Preserve embedded position on close.

Verified non-findings: the original component already calculates only the selected visualization, not all three. Normal rendering did not create export files. WBS is an explicit governance hierarchy, so unrelated task edits must not invalidate its vectors.

Verdict: address bitmap size and discarded calculation/output first, then add the preview and bounded export lifecycle. Implementation and evidence are in `ENGINEERING-REPORT.md`.

Lean: no additional dependencies; split existing mathematical geometry from rendering instead of adding a new diagram framework. Not checked: physical-device CPU/GPU/FPS, Android/iOS file destinations, unrelated backend or Firebase security. User performs Android acceptance.

Design review also applies bundled Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0, as an incumbent review standard. Before audit and product direction: `PLAN.md`.
