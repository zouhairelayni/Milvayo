# Canvas UX 2.0 technical handoff — Milvayo 0.8.1

Implemented in place in `/mnt/Milvayo` on `work`. Canvas redesign, functional/performance investigation, global screen/architecture audit and confirmed fixes are complete at the source/test level. Physical Android acceptance remains pending. No native build, graphical browser, Expo Go, emulator, Playwright or Selenium was used. The owner subsequently authorized staging and committing 0.8.1 on `work`; this authorization does not mark physical Android acceptance as passed. No push, merge or deployment is authorized by that request.

Package, lockfile and Expo versions are 0.8.1; Android/iOS identifiers are 91. No dependency additions, storage-schema migration, Metro configuration change or automatic data import. Existing unrelated handoff/ZIP additions and deletions were preserved.

## A. Canvas design implementation

The workspace now has a persistent Select/Add/Draw/Connect/More dock, direct undo/redo, type-specific contextual actions, immediate visual swatches and a grouped anchored Add menu. Adding a note takes two actions and no longer opens an inspector. Tool switches update mode directly. Complex source, diagram, export, comment and board configuration stays in advanced inspectors.

The header retains centered navigation/title with zoom and one-tap Fit; narrow titles can use two lines. Fit selection includes grouped descendants. Saved viewports are preserved. New large diagrams use their actual root geometry and scene scale for legibility rather than fitting every branch into a tiny overview. Explicit Fit retains the existing zoom range; extremely separated content can exceed its 5% minimum and requires panning. This range was not changed through a data-contract expansion.

Surface tap/drag/resize, four connector handles, focused inline editing, native UI-thread previews and direct Web SVG transforms remain. Multi-selection now works directly on the surface, with a clear Done selecting action; the object-list alternative is retained. Text editing commits on outside tap/blur; Escape cancels on Web. Project sources have search, type filters, distinct icons and a virtualized list that keeps all matches accessible.

Existing notes/text/shapes/cards/frames, independent diagrams, WBS/task diagrams, live links/snapshots, tasks/artifacts/risks/roadmaps, grouping/arrangement/locks, connections, drawing/eraser, comments, export/backup, theme support and private local storage remain. Sharing invitations stay disabled until an authenticated backend exists.

### Before / after

| Before | After |
| --- | --- |
| Collapsed pill hides tools and mode changes open a sheet | Always-visible dock switches modes in one tap |
| Add → item → object inspector | Add → item creates/selects immediately |
| Text-only color lists | Checked visual swatches beside the selected object and in advanced controls |
| Same generic entry for notes, links, diagrams and strokes | Local Edit, linked Source, diagram Layout and stroke Width actions |
| Source list ends at 50 matches | Virtualized complete results with search and category filters |
| Large diagram can open at unreadable overview zoom | Root-based readable opening; explicit Fit remains separate |

Compare [before, 390 dark](screenshots/before-390-dark.png), [after workspace](screenshots/workspace-390-dark.png), [selected object](screenshots/selected-390-dark.png), [Add menu](screenshots/add-390-dark.png), [light theme](screenshots/selected-390-light.png), [landscape](screenshots/selected-844-dark.png) and [desktop](screenshots/workspace-1440-dark.png). [Contact sheet](screenshots/contact-sheet.html) indexes all final captures. These are actual-JSX static React Native Web projections, not physical Android or live Canvas interaction evidence.

### Design standards applied

- Bundled **Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0**: documented nine-pass before-audit, 4-unit rhythm, quiet neutral chrome, existing accent and content-led richness. Original attribution remains intact.
- **Impeccable / frontend-design**: operate-mode hierarchy, recognizable editing surfaces, minimal interruption and preservation of the existing visual language.
- **UI UX Pro Max**: 48-unit tool targets, safe-area offsets, selected/disabled states, keyboard labels and narrow-screen behavior. The fontScale=2 fixture tests the icon-caption policy; actual Android system font rendering is not simulated by the screenshot.
- **React Native performance / gesture / Expo motion guidance**: continuous previews remain off React state, existing worklet APIs remain, no decorative motion or heavy packages. Obsolete idle pill animation/timers were removed.
- **Ponytail Audit / code review**: confirmed reproductions, shared fixes, regression tests and bounded architecture changes. No suffix migration or store rewrite based on speculation.

Product direction: a visual planning workspace connected to independent project data; calm, exact, dependable; planning instruments and quiet technical workbenches; diagrams/linked work/direct editing as content moments; one chosen accent with meaningful status colors. See [PLAN.md](PLAN.md).

## B. Canvas functional audit

The complete [control matrix](CANVAS-CONTROLS.md) records previous behavior, finding, implementation and verification for every library/editor/source-placement control and dynamic control family. Domain/callback/gesture-simulation Pass results are separated from source traces and Not run hardware paths.

Confirmed fixes include concurrent clipboard paste losing an intervening edit, pending inline text on selection changes, drag multi-selection, text/frame color effects, inaccessible source matches, frame Ungroup and tied/saturated layer order. Project copy/import fixes also preserve Canvas ownership and live/snapshot semantics. Missing/foreign sources remain explicit and restricted. No empty Canvas handlers were found.

## C. Canvas performance investigation

Measurements below use Node v24.21.0 on this host. They exclude real app navigation, child component rendering, React scheduling, disk IO, GPU work and Android frame pacing. The first fixture is not a controlled cold-start comparison with the second. Full p50/p95/sample counts are in [host-measurements.json](host-measurements.json).

| Operation | Measured scope | Result |
| --- | --- | --- |
| Initial scene projection | 41 objects / 40 WBS nodes; 201 / 200 | 7.901 ms / 4.273 ms |
| Cached scene projection | 30 samples, 41 / 201 objects | p50 0.037 / 0.111 ms; p95 0.167 / 0.226 ms |
| Diagram cache | Same repeated projections | Hierarchy/Tree calculation counts unchanged |
| Change one note color | Compare canonical scene identities | Exactly 1 changed; 40 / 200 retained |
| Hit-test selection | 201-object fixture, 30 samples | p50 0.0042 ms; p95 0.0088 ms |
| Drag / resize preview math | 201-object fixture, 30 samples | p50 approximately 0.0013 / 0.0013 ms |
| Backup serialization | 41 / 201 objects, 30 samples | p50 0.042 / 0.175 ms; 10,004 / 47,892 bytes |
| Initial editor hook/callback harness | Excludes rendering child components | 0.405 ms |
| Tool switch plus editor hook/callback harness | 30 samples | p50 0.375 ms; p95 0.666 ms |
| Selection plus editor hook/callback harness | 30 samples | p50 0.395 ms; p95 1.102 ms |
| Host heap observation | One bounded benchmark run | 50,395,136 bytes; not a leak trend or native memory measure |
| Actual React commits, app first-open latency, Android FPS/native heap/AsyncStorage latency | Hardware/app profiler required | **Not run** |

Native/web gesture simulations verify hundreds of preview updates without model writes and one release transaction. Compiled-worklet tests exercise routing/resize helpers after the real Expo transform. Layout is not regenerated on every gesture update. Existing native viewport visibility, bounded scene/history caches and route projections remain. Source filtering no longer mounts a long nonvirtualized task list. The shared sheet's new list mode lets the list own scrolling.

Autosave remains transaction-based, with revision checks, a single latest-writer queue, durability feedback and explicit retry/close guards. No autosave is added to every gesture frame. Native targets such as 60 FPS remain device acceptance requirements, not inferred results.

## D. Global application audit

[GLOBAL-AUDIT.md](GLOBAL-AUDIT.md) contains the screen-by-screen report for Overview, Board, Timeline, Tasks/detail, Sprints, Releases/Testing, Projects, WBS, Portfolios, Programs, artifacts, More/Project Tools, Settings, backup/workspace persistence, startup/navigation, diagnostics and Canvas.

Three P1 failures were repaired: concurrent paste content loss, project templates with Canvas failing normalization, and duplicate-ID project imports with Canvas failing ownership validation. No additional confirmed P0/P1 defect remained in the inspected flows. Existing recovery, scheduling/dependency checks, release evidence, frozen sprint history, Timeline pinch and N-to-Board startup remain intact.

The all-source scan found no unbound identifiers, unused named imports, eager forward worklet captures or cycles in its resolved graph. Intentional empty callback candidates were traced rather than removed blindly. This bounded audit does not prove the absence of every dynamic/platform bug.

A separate host global-selector sample used 1,000 tasks × 10 projects / 20 portfolios: schedule-series median 0.1265 ms, project-view edit median 3.5436 ms, next edit recalculates one project's health rather than ten. See [global-host-performance.json](global-host-performance.json). No claimed global runtime speedup is based on these host samples.

## E. Refactoring and compatibility

New feature components: `CanvasToolbar`, shared `CanvasTool`/`CanvasToolGroup`, `CanvasContextToolbar`, `CanvasAddMenu`, `CanvasSwatches`, `CanvasSources`. Pure selection/tool/framing/source-key rules live in `src/canvas/editorTools.cjs`. Full-project Canvas rebinding, layer and ungroup invariants live in the existing Canvas domain; copy/import callers share those rules.

Removed: obsolete `CanvasPill` and its three motion/platform files, idle timer behavior, mode/blank-diagram intermediate sheets, duplicate color-row implementations and redundant Tools undo/redo entries. Existing inline editor, scene/export, menu row and UI primitives are reused. Sheet gains opt-in list-owned scrolling; its default behavior stays covered by existing tests.

Changed source groups: Canvas editor/surfaces/scene/domain; full-project template/import callers; Canvas-only header title wrapping; shared Sheet list mode; the three version manifests. Tests cover integration, grouping/layers, colors/exports, copy/import and sources. New lightweight audit/benchmark/screenshot helpers reuse installed tooling. [PATCH-FILES.txt](PATCH-FILES.txt) gives the complete file inventory, excluding pre-existing user changes.

No dependency or broad selector/store migration was introduced. No cycles required repair. `.js` with JSX is valid in the installed Expo pipeline; there is no src TypeScript or tsconfig. The global audit recommends separately scoped JSDoc/checkJs contracts for high-risk Canvas/store IDs and asynchronous results, not a suffix rename or runtime-speed TypeScript migration.

## F. Verification and delivery gates

| Check | Result |
| --- | --- |
| Baseline `npm test` | **Pass — 927 passed, 0 failed, 0 skipped** |
| Final `npm test` | **Pass — 945 passed, 0 failed, 0 skipped**; full-tests.txt |
| Focused final header/editor/tools follow-up | **Pass — 20 tests**; included in the final full suite |
| Full-source JSX/JS/CJS syntax | **Pass — 252 modules**, installed Babel parser |
| Import/path/folder/comment checks | **Pass**, included in full suite |
| Native source/worklet transform and simulated closure execution | **Pass**, included in full suite; not physical Hermes acceptance |
| `npx expo install --check` | **Pass — dependencies are up to date** |
| Static binding/worklet and architecture audits | **Pass** within documented static scope |
| `git diff --check` | **Pass** |
| Final headless source screenshots | **Pass — 20 captures**, dimensions verified; 360×800, 390×844, 844×390, 1440×900; dark/light and caption-policy fixture |
| Live Expo Web startup | **Limited smoke; not a clean runtime pass** — Metro compiled 1,279 modules and headless browser reached the first-run tour. The retained Metro log also contains a Web console error with a React Native SVG / TourArtwork stack and no explanatory message. Its cause remains unclassified; final Canvas gestures/keyboard/exports were not exercised live |
| React Native DevTools auto-install | **Fail, environment-only** — bundled aarch64 dotslash executable returned EACCES; Metro continued. No metrics were hidden or inferred from this failure |
| Expo Go, physical Android/rotation/IME/TalkBack, native sharing, device FPS/heap | **Not run** — restricted to user physical acceptance |
| Fast Refresh acceptance | **Not run** — smoke server used CI mode with reloads disabled; source checks are not runtime acceptance |
| Builds/emulator/graphical browser/Playwright/Selenium | **Not run**, as required |

The temporary Metro server and all temporary headless browsers were stopped. No build output or extra dependency was installed for screenshots. The live screenshot documents startup/tour only; the source projections document Canvas appearance only.

The screenshot review found the dock/context controls within the reviewed viewport bounds, direct swatches visible, responsive Add scrolling, readable title wrapping and both themes consistent with Milvayo. Large font and safe-area behavior still need real hardware. Extreme zoom, crowded boards and actual Android frame pacing remain acceptance risks.

Use [the phone acceptance and reversible-update guide](../../instructions/release-081.md). Back up current workspace/boards outside the project, test on Termux/Expo Go, and report acceptance before any checkpoint. There is no storage migration; restoring this patch's files is reversible, but pre-Canvas versions discard Canvas fields on save. Do not clear app data or reverse unrelated user changes.

## Local checkpoint authorization

The owner explicitly requested “stage and commit 0.8.1” after receiving this handoff. This release is recorded as a local `work` checkpoint; use Git history for its actual SHA. The 945-test result and outstanding Android/Expo Go/Fast Refresh gates remain as reported. Unrelated handoff/ZIP changes remain outside the checkpoint. No push, main merge, tag or deployment is part of this authorization.

Staging review correction: the saved Metro smoke log contains an unresolved Web SVG console error during the first-run tour, in addition to the DevTools executable permission failure. The successful tour screenshot does not establish an error-free runtime. No source change was made for an unclassified error during this commit-only request; retain it for follow-up diagnosis.
