# Milvayo 0.7.12 — Projects diagram performance and preview

Implemented in the main source, as subsequently authorized by the owner. Package, lockfile and Expo version are 0.7.12; Android versionCode 82 / iOS buildNumber 82. No dependency or storage migration. The owner authorized committing and pushing only to `work`, overriding the brief's original no-publication restriction. No merge to `main`, APK build, prebuild, Gradle, EAS, Playwright or agent development-server restart.

## Confirmed source causes

The original component already generated only the selected layout. Executing the 0.7.11 source from checkpoint `074a734` with deterministic memo hooks produces Outline → Tree → Fishbone → Tree calculation counts of `{0,0,0}` → `{1,0,0}` → `{1,1,0}` → `{2,1,0}`. It did not create export files during normal rendering. The suspicion that all three were calculated at once is therefore not supported. Evidence: `baseline-lifecycle.json`.

The repeated work came from a single-entry `useMemo`: switching types discarded the previous scene; unmounting discarded both scene and JSX memo values. The renderer then recreated every SVG primitive. A 500-element fixture produces 1,999 Tree, 1,006 Fishbone and 1,499 Mind map primitives. Baseline host median layout / JSX generation costs were 4.28 / 24.08 ms, 1.71 / 11.53 ms and 2.87 / 16.63 ms respectively. These are isolated Node stages, not Android commit times.

Native sizing was another concrete problem: the SVG view used the entire scene dimensions inside a transformed stage. Installed `react-native-svg` Android source creates its bitmap at native view size. At density 3, the fixture dimensions imply approximately 1.05 GB / 301 MB / 460 MB of RGBA pixels respectively, before other buffers. This is a source-based estimate, not a measured allocation or proof of the exact device stall. The new camera uses a viewport-sized SVG and updates native viewBox fields on the UI runtime. A 390 × 440 viewport implies 6.18 MB at density 3; a 390 × 700 preview implies 9.83 MB. Native redraw/frame pacing still requires device verification.

## Cache, isolation and invalidation

`src/governance/diagramCache.cjs` supplies an in-memory least-recently-used cache bounded to **12 entries / 8 MiB estimated cost**, shared by hierarchy and layout records. Keys include workspace ID, project ID, diagram type, full semantic revision and relevant layout direction. Full keys avoid hash collisions. Immutable-input WeakMap revisions avoid repeated signature construction; semantically identical clones also reuse geometry. Oversize values are used only by the active view and are not retained. Eviction never changes project data.

The hierarchy projection retains only IDs, parent relationships, displayed names and hours, not owner/description text. Separate bounded view state remembers diagram, direction, zoom and completed pan pose for up to 12 project contexts. UI state is not persisted into backups. `PmWbs` is keyed by project ID to prevent component-state crossover.

- Names, sibling order, parents, IDs and project/root title affect geometry and invalidate the relevant result on its next selection.
- Leaf hours affect rolled-up hours displayed in top-down Tree; Fishbone, Mind map and left-to-right Tree do not rebuild solely for hours. Non-leaf own hours are not included because their displayed totals come from children.
- Task edits, budgets, WBS owners and descriptions do not affect these diagrams. WBS is a separate explicit outline, not a task-title inference. Inspector and CSV read fresh metadata, so excluding it from geometry keys does not display stale descriptions.
- `wbsviews.js` keeps one theme-painted primitive array per cached scene in a WeakMap and memoizes the Scene component. Evicted scenes can be collected. Current event callbacks are applied outside the cached primitives, avoiding stale component handlers. Theme colors used by the scene invalidate paint output without rebuilding layout.
- Only the selected diagram is mounted. Expanding suspends the embedded canvas and uses the same scene in the preview; closing restores its saved pose. PNG adds a small source thumbnail only during explicit export preparation.

`diagram/<type>/layout` work counts identify real layout calculations; lookup timings and cache actions distinguish hits. `diagram/svg-build` counts actual primitive-array generation. Existing commit probes now include `projects/wbs` and `projects/wbs/svg`. These production probes count committed renders and estimate elapsed render-to-commit time; they are not native FPS or React CPU profiling. Native gestures perform no per-frame React updates or JS reporting.

## Measurements

See `cache-benchmark.json` for the final 500-element host run. Its first-open/reopen/edit table is generated below from the saved results. It includes hierarchy/cache lookup and JSX preparation; it excludes native mount, React reconciliation to native views, GPU work and device timing. The baseline warmed microbenchmarks above measure different stages and must not be presented as a controlled before/after Android benchmark.

| Diagram | First request (host ms) | Cached reopen median (host ms) | Relevant title edit (host ms) |
| --- | ---: | ---: | ---: |
| tree | 73.334 | 0.170 | 86.801 |
| fishbone | 31.153 | 0.147 | 32.466 |
| mind | 41.379 | 0.148 | 44.342 |

Final host heap after explicit GC: 27,401,784 bytes versus 15,313,888 before retained diagrams. Estimated cache cost: 8,282,156 / 8,388,608 bytes, 5 entries. 99 direct Scene-function requests produced 6 primitive arrays; the rest reused paint output. Unrelated edits left layout counts at 1 per type and paint generations at 3. These figures do not measure native heap or native commits.


The unchanged-revisit fixture performs 30 rounds per type. Before relevant edits, each layout is calculated once and paint generated three times total. Cloning the data with changed owner/description values leaves calculation and paint-generation counts unchanged. Editing one WBS title causes exactly one new calculation per type when selected. Cache cost, evictions, direct Scene-function invocation count and post-GC host heap values are in the JSON. Direct host function calls are not claimed as measured Android React commits. The byte budget is an estimate for cache retention, not a hard bound on total process memory; native buffers and temporary exports are separate.

## Preview, export and design

Impeccable Operate/polish and the bundled Unslop standard preserved the incumbent neutral chrome, branch semantics, type and shared controls. The before audit and five-line product direction are in `PLAN.md`; the scoped Ponytail findings are in `AUDIT.md`. Unslop is by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0. UI/UX Pro Max's verified gesture/drag-alternative searches informed native recognition, stable handlers and menu pan alternatives. Expo animation, Software Mansion SVG/gesture guidance and Callstack profiling guidance informed the bounded native camera, worklets, memoization and measurements. No named skill was substituted.

The compact Expand control opens a full-screen safe-area canvas. Floating Fit/100%-reset/minus/plus controls stay within measured space; top controls provide pan alternatives, export and Close. Native pinch/pan uses shared values and an animated native SVG camera. Web preserves the existing static-child transform path and adds full-screen wheel/trackpad zoom; Shift-wheel pans. The original embedded scroll handoff remains. Native modal fade and the existing short, reduced-motion-aware Reveal preserve spatial context without decorative motion. Inner sheets dismiss before the preview through standard back-layer registration order. Node inspection shows the full WBS name, owner, hours and current description, with no invented task association.

SVG and PNG use cached geometry; no SVG/CSV/image file is generated during ordinary screen rendering. SVG retains editable paths/text, full dimensions and escaped full-name metadata. CSV traverses current WBS data only when requested. PNG rasterizes the entire viewBox, not the current camera, at requested 2×/4× with theme background or transparency. Actual dimensions are shown before export; large images reduce to the explicit platform pixel/side budget. SVG remains the unrestricted vector option.

Web uses the actual SVG-to-image/canvas PNG adapter and downloads the result. Native waits for a bounded, layout-ready source thumbnail, captures the complete scene with explicit target dimensions, validates PNG signature/IHDR dimensions, writes base64 directly through existing Expo File APIs, then opens native sharing. Cancellation, duplicate taps, errors, late callbacks and capture timeout retain safe context. A dedicated cache directory retires older PNG files after successful sharing, including files from previous sessions; the latest three remain available to recipients.

## Files

| Area | Principal production files |
| --- | --- |
| Calculation/output cache | `src/governance/diagramCache.cjs`, `diagramScene.cjs`, `wbsviews.js` |
| Bounded native vector camera | `src/governance/DiagramSvg.js` / `.native.js`; `src/gestures/DiagramViewport.js`, `DiagramGesture.js` / `.native.js`, `diagramZoom.cjs` |
| Projects integration | `src/screens/governance/pm/PmWbs.js`, `src/screens/governance/Projects.js` |
| Full-screen and exports | `src/governance/DiagramPreview.js`, `DiagramExports.js`, `diagramExport.cjs`, `diagramPng.js` / `.native.js` |
| Delivery | package/lock/Expo versions, README, DESIGN, cumulative changelog, usage guide, new regression tests and QA helpers/evidence |

No changes to Timeline's gesture files or `src/timeline/`, the model, sprint lifecycle, backup format, launcher icons, cold-start branding or five-card Board policy.

## Validation and limits

| Check | Result |
| --- | --- |
| Full `npm test` | **Pass — 875 tests, 0 failures/skips/cancellations.** |
| Final preview/Back checks | **Pass — 15 tests**, including standard last-opened layer ordering. |
| Final folder/import/JSX source checks | **Pass — 6 tests.** |
| Source/worklet validation | **Pass — 214 sources parsed; 27 native files and 2 shared worklet modules transformed**, including the SVG camera worklet. No native build. |
| Expo compatibility | **Pass with offline limitation:** dependencies are up to date; Expo warns offline validation is unreliable. No dependency changes. |
| Static visual review | **Pass within fixture limits — 11 screenshots** at 320/390/1440, plus exported diagram images. |
| Real Chromium PNG adapter | **Pass — 6 checks**: each diagram at 2× opaque / 4× transparent; actual PNG IHDR dimensions and corner alpha verified. |
| Physical Android/iOS, live Expo Go/Web/Fast Refresh, native FPS/memory/file destinations | **Not run by the agent.** Owner acceptance pending. |


Static screenshots are actual JSX projected through the existing RN Web source renderer, with inert effects/handlers, a static viewport fit and modal content projected in place. They are not a running Expo app. Visual review at 320, 390 and 1440 includes all three previews, embedded Tree and exports. Review found and corrected export options pushing CSV below the initial view and a fixture width overestimate. Real Chromium PNG adapter checks separately verify complete image dimensions and opaque/transparent corner alpha. Native export and gesture tests mock the platform APIs; they do not certify Android file recipients or physical frame pacing.

User Android acceptance remains required: unchanged revisit latency, repeated pinch/pan/third-finger changes, camera label rendering and native bitmap behavior, rotation/safe areas, Back layering, close/embedded-pose retention, background/resume, 2×/4× Save/Share and large-image limits. Verify the unchanged Timeline gesture workflow as well. Compare actual device work/commit diagnostics; no crash-free, no-lag or native FPS claim is made from source evidence. The owner's existing Metro process was left running.

Update/rollback and acceptance steps: [usage guide](../../instructions/release-0712.md). Preserve app storage, signing material, newer local edits and owner ZIP changes. No data conversion needs reversing.
