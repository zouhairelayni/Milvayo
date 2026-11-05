# Timeline pinch zoom

Scope: Timeline date-axis zoom on the chart, with its pinned calendar following the same preview. In-place work on `work`, version 0.5.59. Preserve all task, resize, link, dependency style, scheduling, persistence and import behavior. No new dependency or migration.

Review standard: Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, plus MemoryRelay animate-expo. Product direction:
- Product: a precise workspace for independent projects, tasks, schedules and release gates
- Character: calm, exact, dependable
- World: planning instruments and quiet technical workbenches
- Moments: the Gantt diagram and its meaningful dependency/status colors
- Signature: existing selected accent, Today marker and attached dependency curves

Before-audit in required order:

| Pass | Observation and scope |
| --- | --- |
| Spacing | Existing ribbon, calendar and 54px rows work; preserve |
| Color | Status/dependency colors and neutral chrome work; preserve |
| Icons | Existing zoom presets and actions suffice; preserve |
| Copy | Help describes dragging/editing but omits pinch; add gesture guidance |
| Typography | Preserve label sizes after zoom; only the time axis changes |
| Layout | Existing single chart scroll authority drives the pinned calendar; retain it |
| Details | Keep Days/Weeks/Months, Items, First task, Today, critical path, sheets, editing and link removal |
| Visuals | Preserve bars, dependency SVG styling and viewport virtualization; prepare drawing overscan for pinch preview |
| Motion | No pinch exists. Add direct focal horizontal transform preview and commit date-axis density once at completion; no eased/decorative animation or per-frame React scheduling |

## Implementation and after-review

- Two-finger pinch changes date-axis density, preserving the date under the gesture midpoint where scroll bounds allow. Rows and final text/touch target sizes remain unchanged. Calendar and chart use the same horizontal preview transform, so bars, grids, Today and dependency curves stay together. The label column is unchanged.
- Native uses the existing RNGH 3 intercepting host, a scoped virtual pinch detector, Reanimated shared values and UI-thread transforms. JavaScript receives gesture boundaries; `onUpdate` does not call React or schedule RN work. At completion, the chart commits its new date density and applies the focal scroll through the existing chart authority/native-driven calendar offset. There is no timed, spring or decorative motion; input directly controls the preview.
- Temporary horizontal drawing overscan expands once at pinch start, within the existing canvas cap. Each gesture is limited to 1/4–4× its initial width; repeat gestures can move further, up to 136px/day and the established 8192px canvas limit. The lower density bound adapts to long spans, so very long projects can still zoom out. Extra fingers rebase without a discontinuity.
- Scrolling pauses during pinch, then resumes on completion/cancellation. Native long-press task dragging otherwise retains its original scroll ownership. Pinch is disabled while a task move/resize/link gesture is active. Task callbacks guard against pinch and residual taps/drops; zoom never invokes task updates or scheduling. Native cancellation always releases its scroll lock; Web waits for remaining fingers to lift, and removes its scoped listeners on unmount.
- Days/Weeks/Months remain available and clear custom density/preview state. Custom zoom shows no falsely selected preset; calendar tick density adapts for readable dates. First task, Today, Items, critical path, parent/scheduling sheets, task opening, moves/resizes, dependency creation/removal and schedule actions remain.
- Web uses scoped touch listeners and transforms the same chart/calendar surfaces. Ctrl+wheel/trackpad pinch is also supported; ordinary wheel/swipe scrolling passes through. Browser zoom outside the chart is unchanged.
- No dependency-line SVG styling change (the existing hash regression passes), data migration, package/dependency/configuration change, stored zoom preference, task-date rewrite, new audit event, backup-format or security change. Inclusive resize/move rules remain in `timelineEdit.cjs`.

API choices checked against installed sources and the official [pinch gesture](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-pinch-gesture/) and [shared-value](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/) references. Original project implementation; no third-party source copied.

## Verification

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Focused handlers/integration | **Pass** | Five new checks: focal/cap/long-span math; native preview/rebase/cancel; Web shared calendar/chart preview/scroll/cleanup; actual TaskBar callback suppression and later move/resize/open/link behavior; screen zoom/preset/scroll handoff without task mutation and with import round trip |
| Existing regressions | **Pass** | Focused 26-check run includes source import paths, drag retention/auto-scroll, resize semantics and zoom-aware weekend shading; prior focused 25-check run includes unchanged dependency SVG hashes and pinned calendar/ribbon |
| `npm test` | **Pass** | 747 passed, 0 failed/skipped; `timeline-pinch-tests.txt` |
| Syntax | **Pass** | 153 app source files parse, including JSX/CJS |
| Worklet compilation | **Pass** | Native pinch hook and pure zoom function transform with the installed Worklets Babel plugin; no bundle |
| `npx expo install --check` | **Pass** | Dependencies up to date |
| Metadata | **Pass** | Package/lock/Expo metadata synchronized at 0.5.59 |
| `git diff --check` | **Pass** | No whitespace errors |
| Browser/Expo Go/device/Fast Refresh | **Not run** | No connected browser/device runtime; handler tests are not runtime or performance acceptance |
| Android/Web bundles | **Not run** | User explicitly requested no bundles |

## Termux acceptance and reversible update

Changes are applied in place on `work`. No ZIP, installation or migration is required; use the established Termux Metro/Fast Refresh workflow.

1. Pinch in/out over empty chart space and task bars, first in Days and then Weeks/Months. Verify the same date stays under the fingers and the pinned calendar, Today marker, bars and dependency curves agree during preview and after release. Row heights, label text and final handle sizes should stay usable.
2. Repeat, reverse direction, add/remove a third finger, lift one finger, rotate the device and interrupt by switching apps. Check both chart edges, an empty schedule, a dense schedule and tasks spanning many years. Confirm no stuck scroll lock or accidental task opening/edit/link.
3. Choose every preset after a custom zoom, and use First task/Today/Items/critical path and the parent/scheduling sheets. Check the visible bars and dependency paths after fast horizontal/vertical scrolling. On Web, check touch pinch, trackpad/Ctrl+wheel and ordinary page/wheel scrolling.
4. After zoom, hold/move a task, resize each edge and create/remove a dependency. Confirm inclusive duration rules, the fixed opposite end, the duration-change history label and live line attachment. Back up/export/import and confirm unchanged dates/dependencies from zoom alone. Feel/performance must be checked on the user's Android hardware; no release performance claim is made here.

Rollback: reverse only the Timeline pinch hunks in `src/screens/timeline/Timeline.js`; remove both `TimelinePinch` platform files and `timelineZoom.cjs` after verifying imports; reverse the corresponding test/helper hunks. Preserve the earlier WBS gesture files, UI redesigns and all unrelated uncommitted work. No persisted data needs reversal. Restart Metro if necessary. No automatic commit, push, merge or deployment; user validates on Termux before a checkpoint.
