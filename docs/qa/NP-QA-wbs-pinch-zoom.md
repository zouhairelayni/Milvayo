# WBS diagram pinch zoom

Scope: Work breakdown → Tree (both directions), Fishbone and Mind map; compact equal summary cards; a single-row diagram toolbar; project-name text removed from Work and Projects headers. Direct edits on `work`, version 0.5.59. No data migration or new dependency.

Review standard: bundled Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, with MemoryRelay mobile-native and animate guidance. Gesture motion provides direct feedback and spatial consistency; no timed or decorative animation.

Product direction:
- Product: a precise workspace for independent projects, tasks, schedules and release gates
- Character: calm, exact, dependable
- World: planning instruments and quiet technical workbenches
- Moments: readable work breakdown diagrams and their branching structure
- Signature: existing selectable accent and meaningful branch colors

Before-audit, in required order:

| Pass | Observation and controlled scope |
| --- | --- |
| Spacing | Diagram card spacing is established; retain it. Summary cards use 20px padding/minimum 116px height and unequal hint content; reduce padding and use one size |
| Color | Theme and branch colors communicate structure; preserve them |
| Icons | Existing control set is sufficient; no new icons |
| Copy | Diagram is read only; retain Outline editing guidance and explain pinch/pan |
| Typography | Preserve SVG labels and shared controls. Header project names repeat context on Work/Projects; remove those names while retaining the menu. Compact summary values can use the existing 24px type size |
| Layout | Direction and zoom controls can wrap onto separate rows; keep one horizontally scrollable toolbar as requested |
| Details | Fit/100%/150% and direction/export actions must remain usable, including repeated preset presses |
| Visuals | All three scenes share the same SVG renderer; preserve scene geometry and original-size SVG export |
| Motion | Current viewer has horizontal scrolling and discrete zoom only; add bounded focal-point pinch and panning without rebuilding SVG nodes on each gesture frame |

## Implemented

- One viewer for all three diagrams, including both tree directions. Pinch between 25% and 400% around the fingers, with constrained panning. Scene geometry/colors and dependency styles are unchanged. The viewport is at most 440px tall, so enlarged diagrams pan inside it rather than moving the toolbar away. Fit considers both measured width and viewport height, within the existing 25% minimum/160% Fit maximum.
- Native uses the installed RNGH 3 hooks and Reanimated UI-thread translation/scale. A standalone `GestureDetector` sits inside the existing app gesture root; no virtual-detector ancestor or app-root change is required. Offset tuples contain shared numbers, matching the installed RNGH API. Only completed pinches report scale to React. Web uses scoped touch/mouse/wheel listeners and a DOM transform. SVG scene elements are memoized, so gesture frames do not rebuild their nodes. Motion is direct and tracks the input without easing, inertia or decorative transitions.
- Finger-count changes rebase the pinch. A remaining finger must lift before starting a fresh pan. Cancellation retains the last valid view, and web listeners/pointer capture are cleaned up on unmount. Single-finger vertical page scrolling remains available when the diagram fits vertically; an overflowing diagram owns panning inside its viewport. Browser page zoom outside the viewer is unchanged.
- Direction and zoom segments share one horizontal toolbar, scrolling sideways on narrow screens. Every preset press resets translation, even pressing the same preset after panning. Layout/direction changes reset the view safely. Outline editing, starter templates, CSV and original-size SVG exports remain.
- Four equal 88px summary cards with 12px padding and 24px values; two columns on phones/four on wide layouts. Labels, computed counts and rolled-up hours remain. No shared Stat component changes.
- Phone and wide headers hide project-name text throughout Work (Board/Timeline/List/Sprints) and Projects (Projects/Portfolios/Programs), as well as the previous Home behavior. The hamburger/popup/search/actions remain; project names stay in project records and the popup.
- No saved zoom state, WBS edits from gestures, model/security/scheduling/store/import-format change, dependency installation or version bump. Metadata remains synchronized at 0.5.59.

API reference checked against the installed source and [Software Mansion's pinch gesture documentation](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-pinch-gesture/). All code is original project code.

## Validation

| Check | Result | Evidence / limit |
| --- | --- | --- |
| `npm test` | **Pass** | 742 passed, 0 failed/skipped; `wbs-pinch-tests.txt` |
| Gesture/zoom behavior | **Pass** | Pure focal/clamp/no-mutation checks; native handler simulation; web listener simulation; finger-count/cancel/leftover-finger/pan/preset/trackpad/mouse/cleanup cases. These are deterministic source/handler tests, not device acceptance |
| WBS screen controls | **Pass** | Tree/Fishbone/Mind map/Outline; Top-down/Left to right; Fit/100%/150%; same-preset reset; SVG/CSV export; equal summaries; measured Fit/resize; empty templates/add-first; Outline Name/Owner/Estimated hours/Description and Add below/Add next/Up/Down/Indent/Outdent/Delete; import round trip and no mutation |
| Header regression | **Pass** | Both header layouts retain the hamburger/search and omit project-name text when requested; both app call sites wire Work/Projects suppression |
| Syntax | **Pass** | All 150 app source files parsed with Babel, including JSX/CJS |
| Native worklet compilation | **Pass** | Native gesture callbacks/derived values and zoom math transform with the installed Worklets Babel plugin; no bundle |
| `npx expo install --check` | **Pass** | Dependencies up to date |
| Metadata / whitespace | **Pass** | Version 0.5.59 synchronized; `git diff --check` |
| Web/browser, Expo Go, hardware gestures, Fast Refresh | **Not run** | No connected runtime/device in this environment |
| Android/Web bundles | **Not run** | Explicit user instruction |

## Termux acceptance and reversible update

Changes already apply in place on `work`; no ZIP/extraction/installation/migration step. Preserve all unrelated uncommitted work. Use the existing Termux Metro/Fast Refresh workflow, without requiring a desktop build.

1. Populate a WBS, then pinch in/out on Tree in both directions, Fishbone and Mind map. Verify branch lines and labels stay together, focus follows the fingers, limits are sensible and all corners can be reached by dragging.
2. Repeat the pinch, add/remove a third finger, lift one finger, cancel by switching apps and return. Start a new pan after releasing all fingers. Verify no jump, stuck gesture or blocked page scroll outside the viewport.
3. Use Fit/100%/150%, pan, and press the same preset again. Resize/rotate and switch directions/views. Confirm Fit, all toolbar controls and SVG/CSV exports remain usable. On Web, check touch pinch, trackpad pinch and mouse/wheel pan; page zoom should still work outside the viewer.
4. Verify all four summary tiles are equal and compact in phone/wide layouts, including larger font settings. Open Outline and exercise the existing edit/add/move/delete controls on disposable data; back up/export/import to confirm unchanged structure and hours.
5. Visit every Work and Projects view in phone/wide layouts. Confirm the header omits the project name, the hamburger opens project/workspace management, and switching projects still updates records correctly. Home behavior remains.

For rollback, reverse only this patch's hunks in `PmWbs.js`, `ModernApp.js` and the updated tests, then remove `DiagramViewport.js`, both `DiagramGesture` platform files, `diagramZoom.cjs`, and their new tests/helpers after confirming no remaining imports. Preserve prior redesigns and all user work; do not reset the whole working tree. No stored data needs reversal. Restart Metro if necessary. User validates on Termux before any checkpoint; no automatic commit, push, deployment or merge.
