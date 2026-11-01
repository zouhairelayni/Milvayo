# Unslop design audit — Niyarvo Projects v0.2.4

**Reference reviewed:** actual user-provided v0.2.3 Android Timeline and Board screenshots, including the connector touch-offset screenshot and Gantt toolbar at portrait width. **Skill:** original Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0; `.opencode/skills/unslop/SKILL.md`, `references/signs.md`, and `references/tokens.md` were read. This report applies the skill to source code; no simulated visual rendering is presented as device evidence.

## Direction — five lines

- **Product:** A local-first workspace for managing multiple projects, task schedules, dependencies and releases.
- **Character:** Exact, calm, dependable.
- **World:** Workbench instruments, dated schedules and clear task accountability.
- **Moments:** Kanban cards in motion and legible, selectable Gantt dependency chains.
- **Signature:** Niyarvo's violet active navigation, with status colors reserved for actual task state and cyan/amber/red dependency meaning.

## Before — observed problems

1. **Spacing:** Gantt control card occupied a large fraction of the mobile screen before the timeline appeared; repeated instruction/warning paragraphs caused unstable height.
2. **Color:** Multiple colored labels, saturated group bands, and line overlays competed with the tasks. Preserve brand violet; reduce decorative purple.
3. **Icons:** A connection icon was buried inside short Gantt bars; removing an existing line had no discoverable control.
4. **Copy:** Long mobile header subtitle (`Manage, verify and preserve your work`), task movement explanation, and duplicated dashboard descriptions.
5. **Type:** Bold interface labels used 700 and tiny Gantt labels used 11px; no consistent role separation.
6. **Layout:** At narrow widths task names truncated early, while warnings stacked above a densely populated chart.
7. **Details:** Thin rigid connectors intersected and sometimes appeared joined; direct line removal was not possible.
8. **Visuals:** Task bars and meaningful relationships should be the primary visual, not the controls. No stock/generative imagery belongs in an engineering Gantt.
9. **Motion:** Yellow drag preview sometimes landed below the finger because screen touch coordinates were mixed with asynchronously measured canvas coordinates.

## After — actual implementation

1. **Spacing:** 4px-based control heights (36px), 60px Gantt rows, 60px two-tier timeline header; 8px gaps in control groups. Instructions and schedule detail are collapsed by default.
2. **Color:** Neutral panel/group surfaces, preserved brand navigation, status-color bars, semantic conflict red and critical-chain amber. Conflicted links use dashed strokes.
3. **Icons:** Fixed task rail retains predecessor control; `Links N` opens a browsable relationship list; tap individual curved SVG paths to open the same remove-confirmation dialog. No icon-only deletion action.
4. **Copy:** Header now displays only the project name as secondary information; concise `Kanban board`, `Move dates, connect tasks and review dependencies`, and short on-demand help text.
5. **Type:** Bold weight 600 throughout shared UI and Gantt; fixed task names 12px; small labels have limited muted text roles.
6. **Layout:** Fixed task rail minimum width is 156px; list alignment and row heights are consistent; concise summary and links action remain visible.
7. **Details:** Independently implemented smooth SVG Bézier curves; route trunks are separated where vertical spans intersect; endpoint circles and arrowheads communicate direction; relationships are individually inspectable/removable.
8. **Visuals:** Retained genuine Gantt bars, task statuses, and the user's Niyarvo logo. Did not introduce gradients, glows, decoration or fake data.
9. **Motion:** All connector movement derives from the source port plus PanResponder `dx/dy` in content coordinates, not `moveX/moveY` with asynchronous window measurement. The link preview is curved and follows that coordinate system. The already accepted Kanban movement code was preserved.

## Honest boundaries

- This was a **focused Gantt + shared-header/board redline**, not a pixel-by-pixel redesign of every application screen. Future UI releases must repeat the Unslop audit for their affected screens.
- No browser or Android screenshot was generated in the build environment after the patch; final appearance and touch targets are **Not verified** until Metro/Expo Go QA.
- Even with separate routing lanes, lines can geometrically cross in complex plans. The unique `Links N` list provides an unambiguous fallback.
- New dependency: `react-native-svg@15.16.0`, per Expo SDK 58 recommended version. Install dependencies before launching Metro.
- No OpenProject or Asana code copied. Designs and mathematical primitives were independently implemented.

## Acceptance checks for human QA

- Portrait/landscape: controls no longer dominate the Gantt; labels and bars remain legible.
- Drag connector up/down across several task rows; verify the preview point stays near the touch and correct successor is linked.
- Tap each curved link; confirm the relationship names in the dialog, then remove it. Repeat from `Links N` list.
- Create two dependencies whose vertical ranges intersect; inspect visually for ambiguous coincident segments.
- Move and resize bars; drag Kanban cards; confirm no regressions, including after restart.

**Credit:** Original *Unslop* skill by Damir Sokolovsky, CC BY 4.0. Attribution is retained in the bundled skill and this audit.
