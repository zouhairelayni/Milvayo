# Unslop design audit — NP v0.2.5

**Skill actually read and applied**: `.opencode/skills/unslop/SKILL.md` and `references/signs.md` (original Unslop by Damir Sokolovsky, CC BY 4.0). Evidence: user Android screenshots `532439.png` and `532441.png`, source App.js, src/GanttView.js. No fabricated after screenshot.

## Five-line direction

- **Product**: A single workspace for multiple project schedules, task boards, and release gates.
- **Character**: Exact, calm, dependable.
- **World**: Technical planning workbench and dated schedules.
- **Moments**: Task bars, linked timelines, and draggable Kanban tasks.
- **Signature**: Niyarvo's restrained violet selection alongside semantic task/dependency colors.

## Before audit, observed from Android capture and source

1. **Spacing**: Multiple large toolbar controls wrapped into four rows; chart pushed below fold; button heights varied between 36, 40 and 44 px; labels crowded.
2. **Color**: Toolbar-selected purple fills and borders competed with task color; existing panels varied in uncoordinated dark tints.
3. **Icons**: Small inconsistent link icons nested inside short task bars; header carried four competing actions on a narrow screen.
4. **Copy**: Repeated title/subtitle/movement instructions and dense warning lines before the chart.
5. **Typography**: Small 10/11 px content across controls; narrow buttons and multiline captions; inconsistent emphasis.
6. **Layout**: Chart could not pan vertically inside the component; left task rail occupied an excessive fraction of portrait width.
7. **Details**: Link preview could initially offset from finger; overlapping lines relied on the existing Links-list fallback.
8. **Visual**: Genuine Gantt task bars competed with toolbar chrome instead of dominating the screen.
9. **Motion**: Only preset zoom, no pinch; drag had no edge auto-scroll in chart, unlike user expectation.

## Nine actual design passes in v0.2.5

1. **Spacing** — shared 4px rhythm, minimum 40/44px actions, 8–12px control groups, balanced 16/24px page padding. Three stable chart toolbar rows, advanced actions behind **More**.
2. **Color** — single charcoal/graphite palette in `src/design.cjs` for App and Gantt. Neutral control fills and borders; violet only for primary/selected, semantic colors remain on tasks/dependency links.
3. **Icons** — consistent Ionicons size roles (~17–20px), 44px mobile header icon buttons. Export remains in Backups on narrow screens.
4. **Copy** — mobile heading `Schedule`; hide redundant subtitles on mobile; `Fit`, `More`, `Links`, `Today` replace verbose toolbar explanations.
5. **Type** — shared 12/13/14px actionable type; task card headings 14px, secondary labels muted. Prevent header title and project name wrapping by ellipsis.
6. **Layout** — reduced Gantt task rail width; independent horizontal and vertical chart scrolling; toolbar prioritizes zoom and navigation, progressively discloses diagnostics.
7. **Details** — touch offset calibration at connector grant, a second measurement update, continuous zoom around pointer midpoint and `Fit` overview; small bars condense to indicators when zoomed out.
8. **Visuals** — real schedule bars and link paths remain focal content; no fake illustration, stock graphics, gradient or glow introduced.
9. **Motion** — bounded zoom and edge-auto-pan, single continuous gesture with scroll offset compensation; no decorative animations.

## After assessment / limitations

- Changes are present in source, but **no screenshot or Expo Go renderer result was obtained in this environment**. Android appearance and gestures require the user's local acceptance; this is not a claim of a completed perfect redesign.
- Hardcoded one-off styles remain in many nonshared feature screens. Shared primitives, navigation and the Gantt were edited; a pixel-level audit of every individual modal and form is still needed.
- Complex Gantt tasks can overlap or produce ambiguous connectors; the relationship list remains an alternative. Critical path still uses calendar days, not work calendars.
- Pinch is implemented using React Native touch events and has not yet been exercised in Expo Go. `+`, `−`, `Fit` are intentional fallbacks; actual phone interaction is the release gate.
