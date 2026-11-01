# Unslop QA — Niyarvo Projects 0.2.3

Source: original `unslop` skill supplied by the user (Damir Sokolovsky, CC BY 4.0). Reference: user's screenshot captures of v0.2.2 on Android.

## Five-line direction

- Product: independent project management and releases in one cross-platform workspace.
- Character: calm, exact, dependable.
- World: planning instruments and technical workbenches.
- Moments: task Gantt bars and dependency paths; Kanban task movement.
- Signature: Niyarvo violet for active navigation; cyan for dependency links; amber for critical chains/warnings.

## Audit (before)

- Spacing: timeline controls occupy multiple mobile rows; user-visible task grid starts lower than necessary. Keep compact control spacing; avoid adding permanent text blocks.
- Color: dark neutral base and restrained violet identity are consistent; keep. Existing status colors convey state; do not replace.
- Icons: Gantt has a task-edit icon and a predecessor icon in the fixed label column; the relation cannot be initiated at the bar, making direct linking unintuitive.
- Copy: timeline instructional sentence is verbose. Replace with concise action hints. Show connection guidance only during link mode.
- Typography: headings and rows are readable; keep the scale. On narrow screens, clipped task labels must still open full details.
- Layout: existing two-panel fixed labels/scrolled dates are functional; preserve. No need for a new visual template.
- Details: existing connectors do not distinguish the duration-determining dependency chain. Add opt-in critical chain overlay with an assumption label.
- Visuals: the real Gantt is the relevant visual; no stock art or generated imagery.
- Motion: link preview should follow touch while dragging; no decorative animation.

## Changes and review boundaries

- Added a visible linking port on bars and milestones. Supports press the port then tap a successor bar, or drag the port onto a successor bar. Existing predecessor selector remains the reliable fallback.
- Added an optional duration-only critical path overlay. It is calendar-day finish-to-start CPM, not a business-day or resource-leveled schedule.
- Streamlined timeline instructional copy.
- No base palette changes, no rebranding, no changes to the already user-accepted Kanban dragging.

## Verification

- Pure model tests: run and report separately.
- JSX parse: run and report separately.
- Web/Android gesture and visual acceptance: **Not run** in this environment. Needs Web + Expo Go on user's phone.
- iOS: **Not run** (no Apple device/build environment).

## Follow-up candidates

- Mobile screen reader / accessibility labels and keyboard link support.
- Scheduling calendars, lag/dependency types, critical path against fixed dates and project finish constraints.
- Appointments/roadmap scale performance and large board virtualization.
