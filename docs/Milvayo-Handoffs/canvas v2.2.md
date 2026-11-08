MILVAYO — CANVAS STABILITY & INTERACTION REPAIR

Codex Engineering Brief

Evidence: User's 5-minute, 42-second Android screen recording ("550385.mp4")
Repository: "~/Milvayo"
Branch: "work"
Scope: Canvas interactions, rendering, scaling, connections, editing, grouping and contextual controls.

0. Mission and Non-Negotiable Principles

The previous design passes improved Canvas visually but did not resolve serious correctness and performance defects.

Stop expanding features or applying cosmetic changes until the current interactive engine is reliable.

Preserve all canonical Milvayo project data, project artifacts, WBS diagrams, live links/snapshots, exports, undo/redo and local persistence.

The user's direct observations are the primary bug reports. Independently verify root causes through source inspection, instrumentation and testing.

The recording demonstrates repeated opening of panels for elementary actions, shifting viewport framing during editing, diagram layout changes and complex drag/select workflows.

The recording cannot independently establish native FPS, memory growth or the exact duration of position snap-back. Do not invent measurements.

---

1. P0 — Drag Snap-Back and Position State Races

Reported defect

When moving an object, it briefly returns to its previous location for approximately 10–100 ms, then jumps to the intended destination.

This produces a visible flicker and makes dragging feel unstable.

Test this with:

- Sticky notes.
- Shapes and cards.
- Frames.
- Independent diagrams.
- Project-linked diagrams.
- Grouped objects.
- Objects being edited.
- Different zoom levels.

Root-cause investigation

Inspect competing coordinate and state owners:

- Gesture-handler shared values.
- React component state.
- Canonical Canvas store.
- Memoized object transforms.
- Undo/redo history.
- Autosave and hydration.
- Stale props and closures.
- Asynchronous state snapshots.
- Delayed React commits.
- Component remounting.
- Group versus child transforms.
- World-space versus screen-space conversion.

Trace every stage of a gesture:

Gesture start → movement → release → state commit → persistence → rerender

Identify when stale coordinates temporarily overwrite the current visual position.

Required implementation

Establish one authoritative object-transform model.

- Keep gesture movement responsive throughout dragging.
- Commit the final world-space position atomically at gesture end.
- Prevent stale persistence or delayed renders from overwriting newer revisions.
- Reconcile optimistic updates using operation identity or revision numbers where appropriate.
- Calculate connector endpoints from the authoritative geometry.
- Avoid saving every drag frame.
- Do not animate objects back to stale coordinates.

Acceptance criteria

- No backward flash or teleporting.
- No post-release position correction.
- Movement remains stable at 18%, 40%, 100% and higher zoom.
- Reload preserves the final position.
- Undo reverses movement exactly once.
- Redo restores it correctly.
- Editing, grouping, panning and zooming do not cause coordinate conflicts.

---

2. P0 — Progressive Performance Degradation

Reported defect

The more objects added to Canvas, the slower the interface becomes.

Eventually, the board stalls and becomes practically unusable.

This is a release-blocking performance problem.

Do not treat it as a simple animation issue.

Benchmark scenarios

Construct repeatable representative boards containing:

Scenario| Objects
Empty| 0
Small| 25
Medium| 100
Large| 250
Stress| 500

Include mixed objects, connectors, groups and at least one complex project-linked SVG diagram.

For each scenario, measure:

- Initial rendering.
- Object selection.
- Dragging.
- Resizing.
- Panning.
- Pinch-to-zoom.
- Connection creation.
- Undo/redo.
- Autosave.
- Reopening the board.

Investigate

React rendering

- Does moving one object rerender the entire board?
- Are all SVG components reconciled on every gesture update?
- Are selection changes triggering unnecessary rerenders?
- Are store subscriptions too broad?
- Are expensive derived values recalculated repeatedly?

Computational complexity

- Hit-testing.
- Connector routing.
- Group transformations.
- Snap calculations.
- Object bounds.
- Selection geometry.
- Layout calculations.

Avoid quadratic work during continuous gestures where an indexed or incremental approach is possible.

Persistence and memory

- Full-board serialization frequency.
- Deep cloning.
- Undo-history snapshots.
- Cache growth.
- Event-listener accumulation.
- Large allocations.
- Expensive SVG geometry regeneration.
- Repeated scheduling across the JS thread.

Required improvements

Use appropriate:

- Stable object IDs.
- Selective subscriptions.
- Cached geometry.
- Dependency-aware invalidation.
- Viewport culling.
- Lightweight gesture transforms.
- Bounded caches.
- Bounded undo history.
- Debounced persistence.

Preserve connector accuracy even when objects outside the viewport are not mounted.

Do not recalculate unrelated linked diagrams.

Performance criteria

- No unusable or stalled board at 250 representative objects.
- Remain usable at 500 objects, with any limitations documented.
- Aim for 60 FPS during common gestures on capable native devices.
- Avoid full-board React rerenders for isolated object movement.
- Avoid synchronous persistence during continuous gestures.
- Report before/after measurements using identical test scenes.

Headless browser tests do not prove native Android FPS.

The user will validate native interaction smoothness in Expo Go.

---

3. P1 — Preserve S-Curve Connector Geometry

Reported defect

Connections sometimes break, disconnect or unexpectedly change their shape.

The user's selected connector type is S-curve.

It must remain S-curve unless explicitly changed.

Required implementation

Store connector routing style explicitly.

Preserve it across:

- Creation.
- Movement.
- Resizing.
- Grouping.
- Panning and zooming.
- Undo/redo.
- Persistence and reload.
- Export.

Use deterministic cubic Bézier geometry for S-curves.

Ensure connected endpoints follow their objects correctly.

Test:

- Horizontal connections.
- Vertical connections.
- Reverse-direction connections.
- Crossing paths.
- Very short connections.
- Negative coordinates.
- Extreme zoom.
- Group movement.
- Object resizing.

Do not silently switch S-curve connectors to straight or elbow geometry because of transient layout states.

If Straight, Elbow and S-curve are available, expose a compact selector with the current style clearly indicated.

Distinguish custom Canvas connectors from internal connectors belonging to imported project diagrams.

Do not force one connector algorithm onto incompatible diagram types.

Acceptance criteria

- S-curves never silently switch types.
- No detached endpoints.
- No broken or discontinuous paths.
- Smooth movement of connector endpoints.
- Correct restoration after reload and undo/redo.
- Unit tests cover path continuity and routing-style preservation.

---

4. P1 — Fix Text Editing and Object Movement

The recording shows Android keyboard interactions and viewport shifts during inline editing.

The user also reports glitches when moving an object while editing its text.

Required changes

Make editing, selecting and dragging mutually consistent.

- Editing mode must not compete with dragging gestures.
- Keyboard appearance must not modify stored object coordinates.
- Viewport adjustment should only keep the editor visible.
- Closing the keyboard must not unexpectedly reposition objects.
- Preserve cursor and text-selection behavior.
- Prevent stale text updates from overwriting newer changes.
- Avoid unnecessary Canvas rerenders on every keystroke.

Test:

- Double-tap editing.
- Save and cancel.
- Keyboard open/close.
- Rapid text changes.
- Dragging after editing.
- Editing at different zoom levels.
- Editing inside groups.

Object positions and viewport coordinates must remain stable throughout the workflow.

---

5. P1 — Grouping and Multi-Selection

Audit the complete grouping implementation.

Requirements

- Stable group IDs.
- Coherent parent and child coordinate spaces.
- Preserved child-relative positions.
- Correct group dragging.
- Correct group resizing.
- Accurate connector endpoints.
- Correct ungrouping.
- Reliable undo/redo.
- Persistence after reopening.

Multi-selection must be easy to access through a discoverable interaction.

Do not hide grouping behind several unrelated menus.

Group actions must only be enabled when valid.

Support notes, shapes, cards and compatible diagram wrappers without corrupting their internal geometry.

If nested groups are unsupported, explicitly prevent them rather than allowing silent failure.

Acceptance criteria

Grouping and ungrouping preserve the exact visual positions and relationships of all affected objects.

---

6. P1 — ONE Compact Contextual Popover

Mandatory UI decision

Remove routine screen-filling bottom sheets from Canvas.

The user wants Canvas tools, properties and settings presented in the compact rectangular popover anchored immediately above the contextual menu pill, similar to the existing small Add palette.

This is a firm design requirement.

Do not redesign the interface into another series of large panels.

Primary toolbar

Keep one compact primary dock:

Select | Add | Draw | Connect | More

A selected object should display only the relevant contextual actions.

Avoid duplicating Connect, More or equivalent actions across competing large toolbars.

Reusable popover system

Build one coordinated popover architecture for:

- Add.
- Edit.
- Appearance.
- Brush/Eraser.
- Arrange.
- Group.
- Connections.
- Comments.
- Source.
- Layout.
- Export.
- Board options.

All routine interactions should open this reusable anchored rectangular surface rather than creating a new bottom sheet.

Simple controls

Use:

- Color swatches.
- Segmented selectors.
- Compact icon grids.
- Inline toggles.
- Small contextual buttons.
- Direct Canvas editing where practical.

Large content

Project Sources and object lists may require more space.

Use the same popover system with:

- Bounded height.
- Internal scrolling.
- Search.
- Filters.
- Virtualized lists where appropriate.
- Keyboard-aware positioning.

Do not allow these panels to expand beyond the safe viewport.

Popover behavior

- No full-screen dimming overlay for routine actions.
- No nested bottom-sheet navigation.
- Position above the relevant toolbar.
- Keep important Canvas content visible.
- Adjust position in landscape and desktop layouts.
- Preserve selection while navigating popover sections.
- Closing the popover must preserve viewport and selection.
- No accidental zoom reset.
- No tool-state reset unless explicitly requested.

Functional audit

Every visible action must be audited.

Identify:

- Duplicate buttons.
- Unwired actions.
- Empty handlers.
- Inaccessible tools.
- Enabled controls that do nothing.
- Incorrect disabled states.
- Redundant navigation.
- Hidden functionality.

Preserve all working features while consolidating their entry points.

---

7. Mandatory Skills

Before implementation, discover and actively apply the available skills:

Skill| Focus
Impeccable| Premium visual consistency and interaction polish
Ponytail Audit| Architecture, redundant code, excessive rendering
React Animations / Reanimated| Gestures, transforms and smooth transitions
React Native Performance| Render costs, scaling, memory and JS-thread efficiency
UI UX Pro Max| Mobile usability and discoverability
Taste / Frontend Design| Cohesive composition and visual direction
Unslop| Eliminate generic UI patterns and unnecessary complexity
Code Review / Refactoring| Reliability, code organization and regression prevention

If an exact skill is unavailable, use the closest suitable equivalent.

Do not merely list skills as consulted. Apply their findings.

---

8. Implementation Order

Follow this order:

1. Reproduce and instrument the reported defects.
2. Repair drag snap-back and position-state conflicts.
3. Resolve progressive performance degradation.
4. Stabilize S-curve connections.
5. Fix inline editing and grouping.
6. Consolidate controls into the compact anchored popover.
7. Conduct functional, performance and visual regression audits.

Do not start another broad visual redesign before the underlying correctness defects are resolved.

---

9. Strict Execution Constraints

Work in "~/Milvayo" on branch "work".

Inspect Git status before editing.

Preserve "main" and exclude unrelated nested repositories.

Do not run:

- Expo Go.
- Android emulator.
- APK builds.
- Gradle.
- EAS.
- Graphical Chrome or Chromium.
- Playwright.
- Selenium.
- Heavy browser automation.

Use only:

- Static analysis.
- Lightweight automated tests.
- Headless Chromium screenshots where necessary.
- Short-lived local servers when required.

Terminate temporary processes after validation.

The user will test native gestures and performance on the physical Android device.

Do not claim native FPS or memory improvements without measurements.

Do not commit or push before explicit user approval.

---

10. Verification Matrix

Workflow| Acceptance criteria
Object dragging| No snap-back or position flicker at different zoom levels
Large boards| 250 objects remain usable; 500-object stress behavior documented
S-curve connectors| Shape and endpoints preserved during all transforms
Text editing| No position conflicts, focus glitches or unwanted viewport jumps
Grouping| Reliable multi-select, group, move, resize and ungroup
Popovers| Routine tools use the same compact anchored surface
Tool controls| No dead, duplicated or misleading actions
Persistence| All changes survive reopening
Undo/redo| Correct state restoration
Project data| No accidental modification of canonical project records
Cross-platform| Headless visual checks plus user-led native testing

---

11. Required Deliverables

A. Root-cause report

Identify confirmed causes for:

- Snap-back.
- Progressive lag.
- Connector instability.
- Text editing glitches.
- Grouping failures.

Separate confirmed findings from hypotheses and untested native behavior.

B. Before/after performance table

Measure representative scenes at:

0 / 25 / 100 / 250 / 500 objects

Include:

- React render counts.
- Render/commit timings.
- Gesture-related JS work.
- Hit-testing.
- Persistence.
- Reopen performance.

Clearly label any measurements not available.

C. Functional control audit

Control| Expected behavior| Current finding| Fix| Test

Include all existing Canvas actions, particularly unwired and duplicated controls.

D. Source-code changes

Implement confirmed P0 and P1 fixes.

Add focused regression tests for the modified behavior.

E. Visual validation

Capture lightweight headless screenshots of:

- No-selection state.
- Selected object.
- Compact contextual popover.
- Connector style selector.
- Drawing controls.
- Multi-selection and grouping.
- Project source search.
- Portrait.
- Landscape.
- Desktop.

Do not claim that headless visual tests verify Android touch smoothness.

F. Regression summary

Confirm preservation of:

- Project-linked diagrams.
- Canonical project data.
- WBS.
- Local board persistence.
- Comments.
- Exports.
- Undo/redo.
- Existing drawing tools.

G. User handoff

Deliver a concise report covering:

1. Files modified.
2. Confirmed root causes.
3. Bugs fixed.
4. Performance improvements.
5. Tests executed and results.
6. Remaining limitations.
7. Physical Expo Go tests required.
8. Git status.

Do not commit or push until the user confirms successful testing.

---

DEFINITION OF DONE

Canvas must remain responsive as its content grows.

Objects must move without snapping backward or teleporting.

S-curve connections must remain connected and retain their selected routing style.

Text editing must not interfere with object positioning.

Grouping and multi-selection must behave reliably.

Every tool must be reachable, correctly wired and appropriately grouped.

All routine Canvas controls must use one compact rectangular contextual popover—not separate bottom sheets or screen-filling inspectors.

The final result must be evaluated for both correctness and responsiveness.

Stability and performance take priority over cosmetic polish. Do not declare completion merely because the interface looks better.