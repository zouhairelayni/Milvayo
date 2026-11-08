MILVAYO — CANVAS UX 2.1

Unified Workspace Redesign & Mobile Interaction Correction

Application: Milvayo — Expo React Native / Web
Source: "~/Milvayo"
Branch: "work"
Primary platform: Android portrait
Objective: Transform Canvas from a collection of floating menus and bottom sheets into a cohesive, premium visual workspace.

1. Current Situation

The previous Canvas redesign introduced improvements:

- Compact Add menu with grouped categories.
- Contextual editing controls.
- Color swatches.
- Source-specific actions for linked diagrams.
- Improved bottom navigation.
- Better organization of project sources.

However, the overall experience is still fragmented.

The problem is no longer individual component styling. It is the composition of the entire workspace.

Current screenshots demonstrate:

1. Two large stacked toolbars competing for space.
2. Oversized floating Undo/Redo controls.
3. Excessive reliance on large bottom sheets.
4. Contextual controls positioned far from selected objects.
5. Repeated actions across multiple toolbars.
6. Tiny diagrams at initial zoom levels around 18–23%.
7. Inconsistent spacing, button dimensions and control density.
8. Too many interactions required for basic editing.
9. Empty space inside simple configuration panels.
10. Poor coordination between selection, drawing, navigation and editing.

Do not add another toolbar, panel or collection of controls without first redesigning the complete screen composition.

This is an interaction-system correction, not a feature expansion.

2. Mandatory Skills

Discover, read and actively apply the available relevant skills:

- Impeccable: Visual craftsmanship, hierarchy, responsive composition and polish.
- Taste / Frontend Design: Distinctive, premium interface direction.
- UI UX Pro Max: Mobile usability, direct manipulation and discoverability.
- Ponytail Audit: Remove redundant UI structures, duplicated handlers and component complexity.
- React Animations / Reanimated: Gestures, animated overlays and transitions.
- React Native Performance: Rendering efficiency, SVG performance and JS-thread responsiveness.
- Unslop: Remove generic AI-designed UI patterns, unnecessary surfaces and visual clutter.

Use equivalent skills if some are unavailable.

Skills must materially influence the actual implementation.

3. Required Screen Architecture

The entire Canvas must follow one coordinated layout system.

A. Top navigation

A compact top bar containing:

- Back
- Canvas title
- Zoom/Fit control
- Board overflow

Integrate Undo/Redo into the top control system or a compact secondary action location.

Remove the large floating Undo/Redo container currently occupying the upper-right workspace.

Do not replace it with another oversized floating panel.

B. Canvas workspace

The Canvas is the dominant surface.

It must:

- Occupy the maximum available screen area.
- Support uninterrupted pan/zoom.
- Keep selected elements readable.
- Avoid unnecessary floating overlays.
- Preserve the current viewport during editing.
- Frame content intelligently on first opening.
- Support Fit All, Fit Selection and Reset View.

C. Primary toolbar

Use one compact persistent bottom dock.

Required tools:

Select | Add | Draw | Connect | More

Design constraints:

- Approximately 56–68 dp visual height, excluding safe-area padding.
- Consistent icon sizes and alignment.
- Clear active-tool state.
- Accessible touch targets.
- Subtle borders and background treatment.
- Compact typography or contextually appropriate labels.
- No excessive padding or decorative containers.

Tool switching must happen immediately.

Do not open a menu merely to switch between Select, Draw and Connect.

D. Contextual toolbar

Selected objects should reveal a small, context-aware action strip, not a second large permanent toolbar.

Relevant actions could include:

- Edit
- Color
- Duplicate
- Connect
- More

Adapt actions to object type.

For example:

Selected object| Contextual actions
Sticky note| Edit, Color, Duplicate, Connect
Text| Edit, Formatting, Color, Duplicate
Shape| Fill, Border, Duplicate, Connect
Frame| Rename, Arrange, Duplicate
Linked diagram| Source, Layout, Duplicate, More
Connector| Style, Direction, Delete

Rules:

- Position controls intelligently near the selection when space permits.
- Otherwise use a compact anchored strip above the bottom dock.
- Never obscure the selected element unnecessarily.
- Never render two large stacked control panels.
- Avoid duplicating actions already prominently accessible elsewhere.
- Hide contextual actions when nothing is selected.
- Keep controls correctly positioned when panning or zooming.

The main and contextual toolbars must behave as one coordinated system.

4. Explicit Interface States

Implement and visually validate the following states.

State 1 — Nothing selected

Visible:

- Compact top bar.
- Canvas workspace.
- Single primary bottom toolbar.

Hidden:

- Selection formatting controls.
- Object-specific actions.
- Unnecessary floating panels.

The result must feel spacious and focused.

State 2 — Object selected

Visible:

- Selected object with clear handles.
- Small contextual action strip.
- Primary toolbar.

Behavior:

- Drag object directly.
- Resize through handles.
- Change color through a compact palette.
- Edit text by double-tapping.
- Duplicate or connect without navigating through several menus.

The contextual controls should not consume a substantial portion of the viewport.

State 3 — Drawing

Visible:

- Canvas.
- Active drawing mode.
- Compact brush settings.

Controls:

- Brush/Eraser toggle.
- Stroke width.
- Color swatches.

These should appear in a compact floating tool palette or expandable rail.

Do not open a large Drawing Tools sheet for routine brush settings.

Show advanced options only when needed.

State 4 — Adding objects

Open a compact, anchored Add palette.

Structure:

Create: Note, Text, Shape, Card, Frame.

Diagrams: Tree, Fishbone, Mind Map.

Project: Project Diagram, Project Sources.

Use grid-style icon actions for short selections and labeled rows for complex import flows.

Do not cover most of the Canvas for a list of eight simple tools.

State 5 — Advanced configuration

Open an adaptive inspector only for complex operations.

Examples:

- Project source selection.
- Detailed diagram properties.
- Export configuration.
- Board settings.

Simple actions should use compact popovers instead.

5. Bottom-Sheet Redesign

Audit every existing Canvas bottom sheet.

For each one, decide whether it should become:

1. Direct Canvas interaction.
2. Contextual popover.
3. Compact floating palette.
4. Short bottom sheet.
5. Full-height inspector when genuinely required.

Specific corrections

Current interface| Required treatment
Canvas Tools| Compact overflow with clearly grouped secondary actions
Selection Actions| Contextual actions attached to active selection
Drawing Tools| Floating brush/eraser palette
Appearance| Inline color swatches and compact style options
Objects and Selection| Searchable object inspector with efficient list density
Connections| Compact searchable connection inspector
Canvas Comments| Object-anchored comments or appropriately sized composer
Canvas Options| Structured board settings, without unnecessary explanatory text
Project Sources| Searchable, filtered and virtualized source picker
Export Canvas| Explicitly labeled formats and clear export feedback

No full-height sheet for a handful of controls.

Use content-aware heights, scrolling only when needed and correct keyboard avoidance.

6. Visual Quality Direction

Achieve a premium tool-oriented design comparable in interaction refinement to mature whiteboarding and design software.

Avoid copying any application's visual identity.

Apply these rules:

- One coherent component system.
- Restrained use of borders.
- Consistent iconography.
- Clear typography hierarchy.
- Compact controls without sacrificing touch accessibility.
- Balanced use of accent color.
- Appropriate visual density.
- No repeated giant square buttons.
- No excessive dark containers floating over other dark containers.
- No unnecessary explanatory paragraphs in routine menus.
- No huge vertical gaps between related actions.
- No meaningless animations or decorative gradients.

Keep the existing light and dark themes.

Ensure the interface looks intentional at 360–430 dp screen widths.

7. Intelligent Viewport Management

Current screenshots show project diagrams rendered at approximately 18–23% zoom, making content unreadable.

Implement reliable viewport behavior.

Requirements:

- Fit All computes actual content bounds.
- Fit Selection centers the selected object or group.
- Opening a Canvas restores its previous viewport.
- First opening uses sensible content framing.
- Adding an object does not unexpectedly reposition existing content.
- Editing or closing inspectors preserves pan/zoom state.
- Zoom respects focal position.
- Newly inserted content appears in a visible, usable position.
- Large project diagrams do not force small independent notes to become impossible to locate.

The display percentage alone is not a measure of usability.

Test both large imported diagrams and small freeform objects in the same board.

8. Interaction Acceptance Targets

User action| Required experience
Select object| One tap
Move object| Direct drag
Resize object| Direct handles
Edit text| Double tap
Change color| One contextual tap
Add note| Maximum two taps
Switch Select/Draw/Connect| One tap
Undo/Redo| Direct access
Duplicate selected object| One contextual action
Fit content| One tap
Fit selection| One tap
Open advanced properties| One contextual action
Close inspector| Return to identical viewport and selection

Do not claim compliance merely because buttons exist. Validate that each workflow performs the actual operation.

9. Responsiveness & Performance

Preserve the existing Canvas engine, gesture architecture, linked project data, persistence and diagram caching.

Optimize the presentation layer rather than rebuilding working business logic.

Requirements

- Gestures should not regenerate cached diagram geometry.
- Selection changes should not rerender unrelated SVG objects.
- Tool switching must not remount the Canvas.
- Contextual toolbars must not trigger expensive layout recalculations.
- Avoid JS-driven animations for continuous gestures.
- Keep pan/zoom transforms lightweight.
- Avoid unbounded object mounting.
- Preserve drawing performance.
- Prevent autosave operations from blocking interactions.
- Avoid state synchronization loops between toolbars, selection and Canvas viewport.

Target experience

- Immediate visible response to input.
- Smooth panning, drawing and dragging on capable Android devices.
- No noticeable stall when opening/closing compact controls.
- No flicker during selection changes.
- Stable Canvas viewport during UI transitions.
- No unnecessary diagram rebuilding.

Measure actual improvements where possible. Do not invent FPS or native timing results.

10. Mandatory Design Validation

Do not finalize the implementation by reviewing components individually.

Validate complete Canvas screen compositions.

Capture these states:

1. Empty Canvas.
2. Populated Canvas with no selection.
3. Selected sticky note.
4. Selected linked diagram.
5. Drawing mode.
6. Add palette.
7. Appearance controls.
8. Project source picker.
9. Advanced inspector.
10. Landscape and desktop layouts.

Check every screenshot for:

- Overlapping controls.
- Oversized overlays.
- Poor hierarchy.
- Clipped actions.
- Excessive whitespace.
- Duplicated controls.
- Obscured Canvas content.
- Inconsistent alignment.
- Too many floating surfaces.
- Unreadable content.
- Inadequate touch spacing.

Do not declare success if the screen still resembles a set of settings panels placed over a whiteboard.

11. Functional Regression Audit

Test:

- Sticky notes and text editing.
- Objects, frames and shapes.
- Diagram insertion.
- Project-linked sources.
- Drawing and erasing.
- Panning and zooming.
- Selection and resizing.
- Multi-selection and grouping.
- Copy, paste and duplication.
- Connection creation.
- Undo/redo.
- Local persistence and reopening.
- Comments.
- Export and backup.
- Light/dark themes.

Look for unwired buttons, empty handlers, misleading enabled states and broken contextual actions.

Repair confirmed issues without removing working functionality.

Preserve canonical project data isolation.

12. Execution Restrictions

Development occurs on an Android phone using Termux/Debian.

Strictly prohibited:

- Launching Expo Go.
- Launching graphical Chrome or Chromium.
- Android emulators.
- APK builds.
- Gradle.
- EAS builds.
- Playwright and Selenium.
- Heavy browser automation.
- Unnecessary background watchers or servers.

Allowed:

- Lightweight automated tests.
- Static analysis.
- Headless Chromium screenshots only.
- Lightweight temporary web serving when needed for screenshot capture.

Do not open a graphical browser.

Stop temporary processes after validation.

The user will manually test the final result in Expo Go.

13. Mandatory Implementation Workflow

Step 1 — Audit

Inspect existing components, screen composition and screenshots.

Identify which current UI structures should be retained, consolidated or removed.

Step 2 — Define the unified composition

Create a clear internal layout specification for all interaction states.

Ensure controls do not compete for space.

Step 3 — Implement

Refactor presentation components and interactions while preserving working functionality.

Do not simply add more UI on top of the old structure.

Step 4 — Verify visually

Capture complete headless screenshots at mobile portrait, landscape and desktop dimensions.

Compare them against the required composition.

Correct layout problems before reporting completion.

Step 5 — Functional and performance audit

Run regression tests and investigate UI-related rendering regressions.

Fix confirmed defects.

Step 6 — Deliver handoff

Provide:

- Components changed.
- Old UI structures removed or consolidated.
- Before/after layout comparisons.
- Screenshot evidence.
- Interaction workflows improved.
- Functional regression results.
- Performance observations.
- Remaining physical Android tests.

14. Acceptance Criteria

- [ ] One compact primary toolbar.
- [ ] Contextual controls appear only when relevant.
- [ ] No two oversized stacked toolbars.
- [ ] Oversized Undo/Redo container removed.
- [ ] Direct object editing and manipulation.
- [ ] Compact appearance and drawing controls.
- [ ] Bottom sheets reserved for complex interactions.
- [ ] Intelligent Fit All and Fit Selection.
- [ ] Reliable viewport restoration.
- [ ] Project-linked diagrams and documents preserved.
- [ ] No inaccessible or duplicated primary controls.
- [ ] No large unnecessary blank spaces in simple menus.
- [ ] No new gesture conflicts or crashes.
- [ ] All existing Canvas functionality preserved.
- [ ] Mobile, landscape and desktop layouts reviewed.
- [ ] Tests executed and reported.
- [ ] Headless visual validation completed.

15. Git and Delivery

Work in "~/Milvayo" on branch "work".

Do not modify "main".

Do not commit or push before user acceptance.

Deliver the implementation, screenshot comparisons and test report for manual Expo Go verification.

Only after approval should changes be committed and pushed to "work".

---

Final Directive

The previous redesign attempts improved individual components but failed to produce a cohesive workspace.

This implementation must solve that specific failure.

Do not respond with another collection of polished panels.

Do not treat empty space as premium design.

Do not satisfy the requirements by adding more toolbars.

Do not equate reorganizing buttons with improving the interaction model.

Build one coherent, visually balanced workspace where tools appear when needed, disappear when irrelevant and never compete with the content.

The acceptance standard is the quality of the complete interactive Canvas experience, not the appearance of individual components.