MILVAYO — CANVAS UX 2.0 & COMPLETE APPLICATION AUDIT

Design, Performance, Reliability and Architecture Implementation Brief

Application: Milvayo — Expo React Native / Web
Working directory: "~/Milvayo"
Git branch: "work"
Primary target: Android portrait
Secondary targets: Android landscape and desktop web

Execution sequence:

1. Canvas premium UX redesign.
2. Canvas functional and performance audit.
3. Global Milvayo performance, bug and code architecture audit.
4. Implement verified fixes and validate.
5. Deliver a complete technical handoff.

Do not consider the assignment finished after redesigning Canvas. The subsequent audits and appropriate fixes are mandatory parts of this task.

---

1. Project Context

Milvayo is a cross-platform project-management application with project dashboards, Kanban, Timeline/Gantt, Tasks, Sprints, Portfolios, Programs, project artifacts, WBS diagrams and a recently introduced Canvas whiteboard.

Canvas is accessed through:

More → Project Tools → Canvas

It integrates structured project data with a flexible visual planning workspace.

Canvas currently supports:

- Infinite whiteboard, panning and zooming.
- Sticky notes, text, shapes, cards and frames.
- Independent Tree, Fishbone and Mind Map diagrams.
- Project-linked diagrams and WBS.
- Tasks, project artifacts, risk registers and roadmaps.
- Live-linked and snapshot project sources.
- Connections and freehand drawing.
- Object selection, resizing, alignment and grouping.
- Undo/redo, comments and exports.
- Local persistence and theme-aware appearance.

All existing functional capabilities and business logic must remain intact.

No real-time multiplayer is required. Sharing must remain unavailable until proper backend permissions exist.

2. Mandatory Skills

Before implementation, discover, read and actively invoke applicable skills through the available skill system.

If MemoryRelay MCP is connected, use its skill-selection capabilities. Otherwise, use installed or locally available skills.

Skill| Mandatory application
Impeccable| Visual hierarchy, design consistency, typography, spacing, premium UI details
Ponytail Audit| Code architecture, component complexity, redundancy, maintainability
Taste / Frontend Design| Distinctive design direction and visual composition
UI UX Pro Max| Interaction design, mobile usability, responsive layouts
React Animations / Motion| Gestures, transitions, Reanimated, interaction smoothness
React Native Performance| Rendering, JS-thread work, state subscriptions and memory efficiency
Unslop| Remove generic AI-generated UI patterns, unnecessary complexity and visual clutter
Code Review / Refactoring| Reliability, architecture, duplicate logic and test coverage

If a named skill is unavailable, select the closest relevant substitute.

Do not simply report which skills were consulted. Their findings must directly influence implementation.

PHASE 1 — PREMIUM CANVAS UX REDESIGN

3. Core Design Problem

The current Canvas implementation has functional breadth but insufficient interaction quality.

Observed problems include:

- Nearly every operation opens a large bottom sheet.
- Excessive whitespace in short menus.
- Repetitive settings-style presentation.
- Too many steps for simple actions.
- Color selections displayed as text-only lists.
- Object operations scattered across separate panels.
- Weak distinction between essential tools and advanced settings.
- Poor readability at low zoom levels.
- Limited contextual editing.
- Tool switching interrupts the creative workflow.

Do not apply another cosmetic styling pass to the existing menus.

Redesign the underlying interaction architecture.

Canvas should behave like a professional visual workspace, not a form-driven administrative application.

4. Interaction Architecture

Use three primary interaction surfaces.

A. Persistent primary toolbar

Create a compact, premium floating toolbar containing the most frequently used tools:

Select | Add | Draw | Connect | More

Requirements:

- One tap switches tools.
- Clearly identify the active tool.
- Do not open a bottom sheet simply to switch interaction modes.
- Keep the toolbar accessible but visually unobtrusive.
- Respect Android safe areas.
- Adapt to narrow portrait screens.
- Use recognizable icons with appropriate labels.
- Support keyboard and pointer interactions on desktop.

Provide direct undo/redo access through a suitable compact control.

B. Contextual object toolbar

When an object is selected, display relevant actions near the selected object or in a stable contextual toolbar.

For example:

Edit | Color | Duplicate | Connect | More

Requirements:

- Selection handles for resizing.
- Direct dragging for moving.
- Double-tap to edit supported text objects.
- One-tap appearance choices.
- Direct connector creation.
- Contextual alignment, grouping, duplication and deletion.
- Keep the toolbar within visible screen boundaries.
- Do not obscure the selected object unnecessarily.
- Respect zoom transformations.

The toolbar must adapt to object type.

A sticky note, linked project diagram and freehand stroke should not all display identical controls.

C. Advanced inspector

Use adaptive inspectors or bottom sheets only for operations requiring substantial configuration:

- Importing project artifacts.
- Advanced diagram properties.
- Detailed source selection.
- Export configuration.
- Board management.
- Complex formatting.

Avoid full-height sheets for five simple choices.

Use content-aware heights, compact rows, proper grouping and expandable sections.

5. Main Canvas Layout

Top bar

Use a balanced top bar with:

- Back navigation.
- Canvas title.
- Compact zoom/viewport control.
- Fit to Content.
- Advanced board actions.

Keep the title prominent without sacrificing workspace area.

Canvas surface

Preserve the active theme, subtle dot grid and smooth transforms.

Add reliable:

- Fit to Content.
- Fit Selection.
- Reset View.
- Zoom In / Zoom Out.
- Viewport restoration.

Initial framing must prioritize legibility.

Currently, large areas of the Canvas can become nearly unreadable at approximately 18% zoom.

Do not always force the same zoom level. Compute appropriate framing based on actual content bounds and viewport dimensions.

Bottom toolbar

Use a visually balanced floating dock, not oversized buttons or a full-width settings navigation bar.

The toolbar should feel like part of the creative workspace.

6. Direct Object Manipulation

Required interactions:

Action| Expected behavior
Select object| Tap
Move object| Drag
Resize object| Drag visible handles
Edit text| Double-tap
Change color| Select object, then one tap
Duplicate| Contextual action
Connect objects| Drag connector handle or use Connect mode
Multi-select| Accessible selection mode
Group objects| Contextual action
Add note| Two taps or fewer
Undo/redo| Direct access
Fit all content| One tap

Selection, editing, dragging and zooming must not conflict.

Do not require users to navigate several nested bottom sheets for ordinary interactions.

7. Appearance Controls

Replace text-only options such as Theme, Clay, Sage, Blue and Paper with actual visual swatches.

Provide:

- Visible color previews.
- A clear selected state.
- Immediate visual feedback.
- Appropriate contrast in both themes.
- Compact layout.
- Contextual controls for fill, border and text where relevant.

Color selection should be fast and obvious.

8. Add Menu and Tool Grouping

Organize Add into meaningful sections:

Create: Sticky Note, Text, Shape, Card, Frame.

Diagrams: Blank Tree, Fishbone, Mind Map.

Project Sources: WBS, Task, Risk Register, other project artifacts, Timeline Roadmap, Milestone Roadmap.

Use visually recognizable options and compact menus.

Do not produce oversized lists with identical iconography.

For project sources, add effective search, grouping and filtering.

Use virtualized lists for large task collections.

Preserve linked versus snapshot behavior.

9. Visual Design Standards

Apply the selected design skills to achieve:

- Strong but restrained visual hierarchy.
- Cohesive iconography.
- Consistent spacing and corner radii.
- Excellent light/dark theme treatment.
- Purposeful typography.
- Subtle, polished animations.
- Responsive menus and floating controls.
- Compact layouts without cramped interaction targets.
- No unnecessary borders, gradients or decorative elements.
- No generic AI-style design patterns.

Maintain accessible touch targets, readable contrast and reduced-motion behavior.

Create a reusable visual system rather than styling every panel independently.

PHASE 2 — CANVAS FUNCTIONAL & PERFORMANCE AUDIT

After completing the redesign, perform a systematic functional audit.

10. Find Unwired or Nonfunctional UI Elements

Inspect every visible Canvas control.

For each button, icon, menu item, gesture or action, verify:

1. Does it have a real implementation?
2. Does it trigger the expected action?
3. Does the resulting action affect the correct state?
4. Is the result persisted when appropriate?
5. Does it work after reopening Canvas?
6. Does undo/redo behave correctly?
7. Does it work on web and through applicable React Native code paths?
8. Are failures handled and communicated?
9. Is its disabled state intentional and explained?

Identify:

- Buttons with empty callbacks.
- Placeholder handlers.
- Nonfunctional toolbar actions.
- UI controls that appear enabled but do nothing.
- Duplicate menu actions.
- Incorrect selection behavior.
- Stale closures.
- Broken object references.
- Missing persistence.
- Export failures.
- Incorrect undo/redo behavior.
- Unreachable functionality.
- Gestures that silently fail.

Distinguish intentional restrictions, such as unavailable secure sharing, from actual defects.

Deliver a functional audit matrix covering every Canvas control.

Fix confirmed defects, not just document them.

11. Canvas Performance Audit

Investigate:

- Pan and zoom fluidity.
- Object dragging.
- Selection updates.
- Text editing.
- Freehand drawing.
- Connector interactions.
- Large diagrams.
- SVG rendering and caching.
- Expensive React renders.
- Unnecessary rerenders.
- Gesture updates crossing the JS thread.
- Offscreen object rendering.
- Memory growth.
- Serialization and persistence frequency.

Avoid recalculating diagram layouts during gestures.

Use efficient transforms, selective subscriptions, memoization where justified and viewport-aware rendering.

Do not introduce heavy dependencies merely to improve visual polish.

Performance targets

Operation| Target
Switching tools| Immediate visual feedback, with no blocking work
Selecting a typical object| Responsive under normal workloads
Dragging objects| Smooth continuous movement
Pan/zoom| Target 60 FPS on capable devices
Cached diagram reopening| Reuse calculated geometry
Changing object color| No full Canvas reconstruction
Text editing| No unrelated object rerenders
Autosave| Avoid blocking the gesture path
Opening advanced panels| No significant JS-thread stall

Use measured benchmarks and report actual values.

Important: Headless browser timing does not validate native Android FPS. Treat mobile frame-rate targets as requirements for the user's physical-device acceptance tests.

12. Canvas Regression Tests

Create or expand tests covering:

- Object insertion.
- Selection.
- Dragging and resizing logic.
- Content updates.
- Undo/redo.
- Grouping.
- Connections.
- Linked project data.
- Diagram caching.
- Serialization and restoration.
- Export validation.
- Tool-state transitions.
- Theme handling.
- Invalid or missing source references.

Do not claim a feature works solely because a component renders.

PHASE 3 — GLOBAL MILVAYO APPLICATION AUDIT

This phase is mandatory after the Canvas-specific work.

13. Audit All Application Screens

Inspect the entire application, not only Canvas.

Include at least:

- Overview / Dashboard.
- Board / Kanban.
- Timeline / Gantt.
- Tasks.
- Sprints.
- Projects.
- WBS Outline and Diagrams.
- Portfolios.
- Programs.
- Project Artifacts.
- More / Project Tools.
- Settings.
- Canvas.

Review navigation, component rendering, state management, gestures, loading states, persistence, error handling and performance.

14. Global Performance Investigation

Investigate known areas of concern:

Startup

Review root initialization, workspace hydration, navigation readiness, shell mounting and startup animation sequencing.

Preserve the N-to-Board animation.

Reduce blocking work without adding artificial delays.

Navigation

Inspect repeated screen switching, retained pages and unnecessary remounting.

Ensure navigation feels responsive on Android.

Timeline

Preserve the stable Android pinch-to-zoom implementation.

Inspect rendering, scrolling, viewport calculations and unnecessary updates.

Projects and WBS

Inspect SVG mounting, layout caching, Tree Top Down responsiveness and full-screen diagram behavior.

Board and Tasks

Review large collections, expensive filters, derived data, unnecessary renders and virtualized lists.

Canvas

Ensure it does not consume substantial resources while users are working in unrelated screens.

Diagnostics

Validate crash reporting, warning classification and performance instrumentation.

Do not suppress errors to improve reported metrics.

15. Global Bug and Dead-Control Audit

Search across the entire application for:

- Empty handlers and placeholder actions.
- Unreachable screens.
- Dead buttons.
- Broken navigation.
- Silent errors.
- Unhandled promises.
- Race conditions.
- Incorrect state synchronization.
- Platform-specific component failures.
- Invalid React Native accessibility props.
- Missing cleanup functions.
- Event-listener leaks.
- Duplicate effects.
- Stale data.
- Unnecessary background work.
- Data-loss risks.
- Broken or untested export paths.

Prioritize issues by severity.

Priority| Classification
P0| Crash, data loss, security or integrity failure
P1| Broken core feature, severe performance or accessibility defect
P2| Noncritical bug, responsiveness or maintainability concern
P3| Cosmetic issue or low-risk improvement

Implement confirmed P0/P1 fixes. Address P2 issues where the changes are well-scoped and regression risk is manageable.

For larger structural changes, provide evidence and a staged migration plan rather than performing an uncontrolled rewrite.

16. Source Code Architecture and Refactoring

Conduct a Ponytail-style architecture audit across the repository.

Inspect:

- Oversized screen components.
- Excessively coupled modules.
- Circular dependencies.
- Repeated rendering logic.
- Duplicate helper functions.
- Mutable shared state.
- Unnecessary store subscriptions.
- Expensive selectors.
- Excessive effects.
- Large synchronous operations.
- Serialization patterns.
- Inconsistent error handling.
- Poor separation of UI and business logic.
- Unused code and dependencies.
- Testability.
- Consistency between Android and web.

Refactor only where there is measurable or clearly justified benefit.

Preserve existing application behavior and data compatibility.

JavaScript, JSX and TypeScript review

The repository predominantly uses ".js" files, including screen components.

Do not assume ".js" files are a performance problem.

React Native/Expo supports JSX syntax within JavaScript files through the configured transformation pipeline.

Evaluate the actual architecture before recommending changes.

Use these principles:

- ".js": Valid for JavaScript logic and React components when configured.
- ".jsx": Makes JSX-containing JavaScript components more explicit, but does not inherently improve performance.
- ".ts": TypeScript modules without JSX.
- ".tsx": TypeScript modules containing JSX, useful for type checking, interface contracts and maintainability.

Do not mass-rename ".js" files to ".jsx".

Do not migrate the complete application to TypeScript merely for perceived runtime speed.

Instead:

1. Audit the existing module organization.
2. Identify where type checking would prevent realistic bugs.
3. Inspect existing TypeScript configuration and dependencies.
4. Evaluate incremental ".ts"/".tsx" adoption for high-risk business logic or complex component contracts.
5. Prefer JSDoc and "checkJs" where useful for existing JavaScript.
6. Avoid disruptive migrations.
7. Recommend any larger migration separately with costs, benefits and risks.

Performance optimization must be based on actual rendering, computation, memory, bundling and state-management issues—not file extensions.

17. Global Regression Protection

Run relevant automated tests after changes.

Maintain compatibility with:

- Expo Go.
- Android release builds.
- Expo Web.
- Existing project data.
- Existing persistence schemas.
- Import/export functionality.
- Current navigation behavior.

Do not delete working functionality merely to improve performance statistics.

PHASE 4 — VISUAL VALIDATION & EXECUTION RESTRICTIONS

18. Strict Resource Constraints

Development runs on an Android phone through Termux/Debian.

Mandatory restrictions:

- Do not launch Expo Go.
- Do not launch an Android emulator.
- Do not open Chrome or Chromium graphically.
- Use headless Chromium only for screenshots.
- Do not use Playwright or Selenium.
- Do not build APKs.
- Do not run Gradle or EAS builds.
- Avoid memory-intensive browser automation.
- Avoid unnecessary Metro restarts.
- Avoid large numbers of simultaneous development processes.
- Shut down temporary development servers after screenshot capture.
- Use existing lightweight automated tests.
- Do not install heavy dependencies without clear justification.

Capture headless screenshots where feasible at:

- Android portrait: 360 × 800.
- Android portrait: 390 × 844.
- Landscape: 844 × 390.
- Desktop: 1440 × 900.

Compare the actual layouts with the intended interaction architecture.

Headless screenshots validate web appearance only. Do not claim physical Android gestures or frame pacing have been verified.

The user will test the application on the physical Android device using Expo Go.

19. Visual Quality Gate

Before declaring Canvas complete, verify:

- The workspace visually dominates the screen.
- Toolbars remain compact.
- Common actions are directly accessible.
- Selected objects display useful contextual controls.
- Color selection uses swatches.
- Bottom sheets are appropriately sized.
- Text editing is direct.
- Buttons are consistently sized.
- Visual hierarchy is clear.
- Mobile portrait layouts are comfortable.
- Dark and light themes remain polished.
- Nothing is clipped, overlapping or inaccessible.
- The interface does not resemble a generic settings application.

Do not consider visual quality established solely through passing tests.

PHASE 5 — DELIVERABLES

20. Required Final Handoff

Deliver the following in a structured report.

A. Canvas design implementation

- Screens and components redesigned.
- Interaction improvements.
- Before/after visual comparison.
- Design skills applied.
- Existing functionality preserved.

B. Canvas functional audit

Provide a control-by-control audit:

Control/feature| Previous behavior| Finding| Fix| Test result

Include unwired controls and any intentionally unavailable features.

C. Canvas performance audit

Provide measured results for:

- Initial load.
- Tool switching.
- Object selection.
- Dragging.
- Diagram interaction.
- React rendering.
- Caching.
- Persistence.
- Memory observations where measurements are available.

Clearly identify unmeasured native behavior.

D. Global application audit

Provide a screen-by-screen report:

Screen| Performance| Bugs| Architecture| Changes made| Remaining issues

E. Refactoring report

List:

- Files changed.
- Duplicated code removed.
- Components extracted.
- Store or selector improvements.
- Circular dependencies addressed.
- Dead code removed.
- Dependencies changed.
- Tests added.
- Any recommended future TypeScript migration.

F. Verification

Report:

- Tests run.
- Passed/failed/skipped counts.
- Headless screenshot coverage.
- Remaining platform-specific risks.
- Android device tests required from the user.

Do not invent measurements or claim successful tests that were not executed.

21. Completion Acceptance Criteria

The task is complete only when:

- [ ] Canvas interaction architecture has been substantially improved.
- [ ] Common editing actions no longer require excessive bottom sheets.
- [ ] Object manipulation works directly on Canvas.
- [ ] Contextual toolbars and compact appearance controls are implemented.
- [ ] Existing Canvas capabilities and project integrations are preserved.
- [ ] Every Canvas control has been audited for real functionality.
- [ ] Confirmed unwired controls are repaired or clearly marked unavailable.
- [ ] Canvas rendering and interaction performance have been investigated.
- [ ] The global Milvayo application audit has been completed.
- [ ] Major bugs and high-priority performance issues have been addressed.
- [ ] Refactoring is justified, focused and covered by appropriate tests.
- [ ] ".js" versus ".jsx"/".tsx" has been assessed technically rather than assumed to cause slowdowns.
- [ ] All available lightweight tests have been executed and reported.
- [ ] Responsive headless screenshots have been reviewed.
- [ ] No native builds or graphical browsers were launched.
- [ ] A complete technical handoff has been delivered.

22. Git Workflow

Work in "~/Milvayo" on branch "work".

Inspect repository status before editing.

Do not modify "main" or stage unrelated nested repositories.

After implementation, testing and audits:

1. Present the results.
2. Identify outstanding Android verification requirements.
3. Wait for the user's physical-device testing and approval.
4. Only after approval, commit and push to "work".

Do not commit or push prematurely.

---

Final Instruction

Approach this as a senior product designer, React Native performance engineer and software architect.

Do not optimize for the smallest number of code changes or the fastest superficial completion. Optimize for design quality, usability, measurable performance, maintainability and preservation of working functionality.

Complete the Canvas redesign first, then the Canvas functional/performance audit, then the global Milvayo audit and appropriate fixes.

Do not stop after the visual redesign or substitute a list of recommendations for the requested implementation.

The final product should feel like a carefully engineered, premium project-management application—not an accumulation of features, forms and settings menus.