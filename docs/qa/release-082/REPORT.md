# Milvayo 0.8.2 — Canvas UX 2.1

Prepared in place on `work`, based on local checkpoint `0676538`. No commit, push, merge, deployment or data migration. The existing handoff/ZIP additions and deletions are outside this patch.

## Composition and scope

Canvas now uses one navigation row with history, one primary dock and a selection-anchored action strip. The workspace no longer contains a separate floating Undo/Redo panel or a permanent color row. Selecting an object exposes direct editing/source, color/layout, duplicate, Fit selection and properties actions. The color palette replaces the action strip while open. Brush controls appear only in Draw/Eraser mode.

The implementation preserves the existing themes, accent, SVG engine, canonical source isolation, model limits, cache, storage and import format. No dependency, Metro, Timeline, sprint lifecycle or startup animation changes. Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, remains the bundled review standard; its attribution is preserved. The installed design skills informed complete-screen hierarchy and controlled surfaces; the RN gesture/performance skills informed direct shared-value overlay positioning and virtualized browsing.

| Area | Before | After |
| --- | --- | --- |
| Navigation/history | Separate floating 112×58 history container | Direct history buttons inside compact navigation row |
| Selection | Approximately 110-high action/color panel above dock | One 58-high strip near selection; palette replaces its contents |
| Dock | Primary controls competing with persistent formatting | Five direct tools; 58-high visual group, excluding safe area |
| Add | Three vertical groups in every orientation | Compact portrait groups; landscape Diagrams/Project share a row, with all actions visible at 844×390 |
| Editing | Camera moved to readable editing pose | Bounded on-canvas input; camera remains unchanged |
| Insertion | Automatic reframing after insertion | Insert at visible world position; preserve existing camera |
| Browsing | Capped objects / all connection rows mounted | Searchable complete results through FlatList, initial batch 8 |

Before: [selected Canvas, 0.8.1](screenshots/before-selected-390.png). After: [selected Canvas, 0.8.2](screenshots/selected-390-dark.png), [compact Add](screenshots/add-390-dark.png), [landscape Add](screenshots/add-844-dark.png). These are static source projections, not screenshots from the physical Android app.

Changed components: CanvasEditor, header integration in Bars, CanvasToolbar, CanvasContextToolbar, CanvasAddMenu, CanvasInlineEditor and CanvasMenuRow. New components: CanvasHeader, CanvasPopover, CanvasBrushPalette and CanvasItemList. Platform camera/selection-overlay modules and pure presentation geometry connect controls to the existing gesture surface. Surface changes update only presentation positioning and native responder cancellation configuration. Diagnostic classification records the warning category without touch coordinates or log suppression.

## Every former sheet reviewed

| Entry | Treatment in 0.8.2 |
| --- | --- |
| Canvas tools | Compact six-action overflow grid |
| Selection actions | Direct selection strip; compact overflow for clipboard/group/delete/properties |
| Drawing tools | Expandable brush/eraser/width/ink rail; no drawing sheet |
| Appearance | On-demand selection swatches; compact popover for stroke/style |
| Arrange and resize | Compact grid plus direct move/resize controls |
| Canvas view | Compact Fit/zoom/reset grid with optional directional pan |
| Connector | Selection strip, then compact label/style/delete popover |
| Diagram node | Compact edit/add-child/delete popover |
| Objects and selection | Searchable virtualized inspector, no 100-object cutoff |
| Connections | Searchable virtualized inspector |
| Canvas comments | Content-sized composer/thread inspector; selected-object anchoring retained |
| Canvas options | Short board-settings inspector, title and explicit unavailable sharing |
| Project sources | Search, kind filter, live/snapshot choice and virtualized results retained |
| Project diagram / detailed diagram layout | Content-aware inspector for source/layout/branch operations |
| Export Canvas | Inspector retaining labeled formats, complete-bounds export and feedback |

Routine popovers close outside or with Back without clearing selection or changing the camera. Complex inspectors retain the shared Sheet keyboard avoidance and constrained scrolling. Keyboard, safe-area and accessibility behavior still require physical verification.

## Complete-screen visual review

[Screenshot coverage](screenshots/coverage.json) records 32 dimension-verified headless Chromium captures, plus the retained before image. [Gallery](gallery.html) links every capture. [Source manifest](source-review/manifest.json) records fixture dimensions and scope.

| Required state | Evidence and review |
| --- | --- |
| Empty | [Dark](screenshots/blank-dark.png), [light](screenshots/blank-light.png): navigation/dock only, no contextual surfaces |
| Populated, no selection | [390](screenshots/workspace-390-dark.png): workspace dominates; no floating history |
| Selected sticky note | [360](screenshots/selected-360-dark.png), [390](screenshots/selected-390-dark.png), [430](screenshots/selected-430-dark.png): one strip below note, selection unobscured |
| Selected linked diagram | [Linked WBS](screenshots/linked-wbs-dark.png): readable root/children and source/layout actions |
| Drawing | [Dark](screenshots/drawing-dark.png), [light](screenshots/drawing-light.png): one compact brush rail above primary dock |
| Add | [Portrait](screenshots/add-390-dark.png), [landscape](screenshots/add-844-dark.png): grouped actions, one active dock control |
| Appearance | [Color](screenshots/menu-color.png): swatches replace actions; no permanent second row |
| Project sources | [Picker](screenshots/menu-source.png): search/filter above bounded virtualized results |
| Advanced properties | [Inspector](screenshots/menu-inspect.png): scrollable detailed controls, canvas visible above |
| Secondary controls | [Tools](screenshots/menu-tools.png), [arrange](screenshots/menu-arrange.png), [view](screenshots/menu-view.png), [board](screenshots/menu-board.png): bounded compact surfaces |
| Inline edit | [Editor](screenshots/inline-note.png): text input on object; no camera reframe |
| Landscape / desktop | [Landscape](screenshots/selected-844-dark.png), [desktop](screenshots/selected-1440-dark.png): compact chrome, context stays beside note |
| Light / larger-font policy | [Light selection](screenshots/selected-390-light.png), [caption policy](screenshots/selected-large-font.png): theme preserved; tool captions hide at larger font scale, labels remain accessible |

Reviewed complete compositions for overlap, hierarchy, clipping, spacing and unnecessary surfaces. Fixed the observed landscape Add clipping by arranging its groups across two rows. No reviewed selection strip covers the selected note/diagram; a strip falls back above the dock when viewport space is insufficient. Large source/properties lists intentionally scroll. The caption-policy fixture simulates the font-scale branch; it does not reproduce Android font metrics or TalkBack.

Capture method: actual JSX rendered through RN Web with fixture data, inert effects, simulated measured workspace and adapted modal placement. Headless screenshots involve no scripted interaction, Expo session, graphical browser or native app. They validate composition only. No emulator, build, Gradle, EAS, Playwright or Selenium was used.

## Functional verification

| Workflow | Automated evidence / result |
| --- | --- |
| Select; two-action Add note; direct mode switches | Editor callback integration executes insertion and actual mode changes — Pass |
| Text edit, cancel, selection-change commit | Actual board content/revision assertions; history and backup round trip — Pass |
| Shapes/frames/diagrams, grouping, lock/layer/ungroup | Model and connected editor-handler assertions — Pass |
| Move/resize, connection creation/style/label/delete | Web/native surface lifecycle harness plus editor/model tests — Pass |
| Brush/erase, width/color, undo | Actual stroke creation/removal/restoration — Pass |
| Color, duplicate, copy/paste | Board mutations checked, including pending clipboard IO concurrent with edit — Pass |
| Live/snapshot sources and independent diagrams | Canonical source content remains unchanged; layout/capture assertions — Pass |
| Saved 18–23% viewport, edit/add/inspector/reopen | Exact pose/request assertions and persistence — Pass |
| First opening and Fit selection | Untouched default board framed; custom camera preserved; explicit Fit updates only view — Pass |
| Pan/zoom/context positioning | Focal math, clamped anchoring, direct Web DOM paint and native shared-value style tests — Pass |
| Comments/replies/resolve/rename | Actual persisted data and normalization round trip — Pass |
| Save failure/retry, backup/export, recovery | Full model/store/export suite and editor failure path — Pass |

The tests execute rules, callbacks and simulated gesture lifecycles; they do not establish physical touch acceptance. Fit uses actual object/scene bounds and retains the model's existing 5%–400% camera range. Very large boards may exceed what fits at the lower bound. A saved low zoom stays exact; explicit Fit selection is the recovery action. Insertion anchors a large diagram's root in view without shrinking all independent notes.

## Android warning correction

Reported on Android Canvas: `Cannot record touch end without a touch start`, with an unmatched third pointer. Installed RN 0.88.1 reports this when its touch-history bank has no matching start. Installed RNGH 3.3.0 Android orchestration can cancel the RN JS responder when a recognizer activates; its root helper synthesizes a cancellation. Canvas gesture content contains no JS responder controls requiring that cancellation.

Canvas pan/pinch/single/double-tap recognizers now explicitly use `cancelsJSResponder: false`, keeping the RN event stream intact while native gestures recognize. See the [official gesture configuration documentation](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-tap-gesture/). Timeline configuration is untouched. Diagnostics classify this warning as `touch-history-mismatch`; the original console warning remains visible.

Tests verify all four configurations, third-finger rebasing, no model move from a remaining finger after pinch, cancellation, and one release commit after hundreds of previews. **Physical resolution of the reported warning: Not run.** The log alone does not prove the initiating native sequence. Validate two/three-finger gestures, interrupted touches, toolbar transitions and Android Back on the affected phone before accepting this correction.

## Performance observations

[Host measurements](host-measurements.json), Node v24.21.0, one bounded run:

| Measurement | Result |
| --- | --- |
| Revisit scenes, 41 objects / 40 WBS nodes | p50 0.046 ms, p95 0.225 ms |
| Revisit scenes, 201 objects / 200 WBS nodes | p50 0.111 ms, p95 0.173 ms |
| Cached layout calculations across 30 revisits | Unchanged in both cases |
| Recolor one local object | Exactly one scene identity changes; other 40/200 retained |
| Context anchor math, 1,000 samples | p50 0.0023 ms, p95 0.0045 ms |
| Tool callback + editor hook harness, 30 samples | p50 0.441 ms, p95 1.171 ms |

These measurements exclude child rendering, React scheduling, disk, GPU and device pacing. They are not comparative speedups, native latency or FPS results. Native context positioning reads shared camera/drag values on the UI runtime. Web positioning paints the existing overlay DOM node. Neither subscribes React to continuous gesture frames. Geometry caching, scene memoization, release-only model commits and deferred autosave remain intact. Object/connection inspectors now mount bounded batches rather than every row. Native heap/leak trends, crowded-board GPU load and Android frame pacing: **Not run**.

## Gates and handoff

| Check | Result |
| --- | --- |
| `npm test` | Pass — 957 passed, 0 failed, 0 skipped; [output](full-tests.txt) |
| Full source syntax, bindings and eager worklet order | Pass — 263 modules; [audit](source-audit.json) |
| Path/import/folder rules; compiled native worklet closures | Pass — included in full suite |
| `npx expo install --check` | Pass — dependencies up to date; [output](dependency-check.txt) |
| Version synchronization | Pass — 0.8.2; Android 92 / iOS 92 |
| `git diff --check` | Pass |
| Headless source screenshot capture | Pass — 32 captures, correct dimensions |
| Live Web, Expo Go, Fast Refresh, Android IME/TalkBack/rotation/native sharing | Not run — user physical acceptance pending |
| Emulator, APK/native builds, graphical browser, heavy automation | Not run — prohibited by handoff |

The 0.8.1 live startup smoke retained an unresolved Web SVG/TourArtwork console error. This release did not re-test live startup or diagnose that separate issue; source screenshots do not clear it. Agent screenshot processes exited; no agent server was started. The existing user Termux Expo process was preserved. Follow [the phone verification and reversible-update guide](../../instructions/release-082.md). No Firebase/security/remote-release claims are introduced.
