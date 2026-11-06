---
name: Milvayo
description: A calm, exact work studio for independent projects.
colors:
  dark-canvas: "#0C0D0F"
  amoled-canvas: "#000000"
  dark-surface: "#17191C"
  amoled-surface: "#101113"
  dark-elevated: "#202226"
  dark-surface-alt: "#121416"
  dark-selection: "#2C2F34"
  dark-ink: "#F2F4F7"
  dark-muted: "#B4BAC6"
  dark-faint: "#949FAE"
  dark-line: "#3C3E40"
  amoled-line: "#363739"
  light-canvas: "#F4F5F7"
  light-surface: "#FFFFFF"
  light-elevated: "#F0F1F4"
  light-surface-alt: "#ECEEF2"
  light-selection: "#E6E8ED"
  light-ink: "#172331"
  light-line: "#DADCDE"
  aqua-dark: "#65A7C2"
  aqua-light: "#216A85"
  mint-dark: "#43C495"
  mint-light: "#0F6B4A"
  lime-dark: "#A5D766"
  lime-light: "#466A22"
  amber-dark: "#E8BB4A"
  amber-light: "#8A6414"
  orange-dark: "#FCA311"
  orange-light: "#B5670A"
  coral-dark: "#E98B7E"
  coral-light: "#BA463E"
  pink-dark: "#ED8FAC"
  pink-light: "#A7275C"
  fuchsia-dark: "#D5A1DA"
  fuchsia-light: "#954BA3"
  violet-dark: "#BB74E2"
  violet-light: "#7730A0"
  indigo-dark: "#AFB4CE"
  indigo-light: "#4F5580"
  success-dark: "#83D8B4"
  success-light: "#16734C"
  warning-dark: "#F0CC77"
  warning-light: "#8C5C0D"
  danger-dark: "#FFA09B"
  danger-light: "#B6303C"
  info-dark: "#8FC6ED"
  info-light: "#25638E"
  chart-validation: "#A6A0E8"
typography:
  headline:
    fontSize: "26px"
    fontWeight: 600
    lineHeight: "31px"
    letterSpacing: "-0.4px"
  headline-wide:
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "34px"
    letterSpacing: "-0.4px"
  title:
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.4px"
  panel-title:
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "25px"
  task-title:
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "22px"
  body:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  supporting:
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "19px"
  action:
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "20px"
  label:
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "17px"
  metadata:
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "16px"
  numeric:
    fontSize: "28px"
    fontWeight: 500
    lineHeight: "34px"
rounded:
  sm: "9px"
  md: "14px"
  lg: "20px"
  pill: "999px"
  field: "12px"
  card: "16px"
  capsule: "24px"
spacing:
  step: "4px"
  compact: "8px"
  control: "12px"
  gutter: "16px"
  panel: "20px"
  section-wide: "24px"
  work-rail: "28px"
  gutter-wide: "32px"
components:
  button-primary:
    backgroundColor: "{colors.dark-ink}"
    textColor: "{colors.dark-canvas}"
    typography: "{typography.action}"
    rounded: "{rounded.capsule}"
    padding: "11px 19px"
  button-secondary:
    backgroundColor: "{colors.dark-elevated}"
    textColor: "{colors.dark-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.dark-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
  button-danger:
    backgroundColor: "#FFA09B12"
    textColor: "{colors.danger-dark}"
    typography: "{typography.action}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
  input:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
  chip-selected:
    backgroundColor: "{colors.dark-selection}"
    textColor: "{colors.coral-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  navigation-selected:
    backgroundColor: "{colors.dark-selection}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.sm}"
    padding: "0px 12px"
  calendar-day-selected:
    backgroundColor: "{colors.dark-ink}"
    textColor: "{colors.dark-canvas}"
    rounded: "{rounded.field}"
---

# Design System: Milvayo

## Overview

**Creative North Star: "The Quiet Work Studio"**

Milvayo is calm, exact and dependable. Neutral graphite planes, clear sans typography and compact controls frame the work; analytical graphics, the agenda, Timeline and Kanban provide the visual richness. Keep the original Milvayo Board mark and one personal accent. Give each workflow a composition suited to its job, with current work and a clear next action before advanced controls.

Motion is plentiful where it explains an action: press feedback, date selection, chart inspection, numeric change, sheet arrival and Kanban lift/reflow. Keep it bounded, interruptible and sensitive to reduced motion. Continuous gestures follow the finger directly.

**Key Characteristics:**

- Neutral Dark and true-black AMOLED, independent of accent preference.
- Off-white capsule actions, precise data graphics and a separate work agenda.
- Original geometric vector artwork and meaningful status/dependency color.
- Adaptive phone and desktop compositions with retained workflow capabilities.

This records the implemented 0.7.0 design, promoted into the main workspace with owner approval on 2026-11-06, extracted from `src/ui/theme/themePalette.cjs`, `theme.js`, `uiBase.js`, `uiControls.js`, `uiLayout.js`, `layoutMode.cjs`, calendar, shell, charts and platform motion pairs. The final contract at the end of `docs/qa/redesign-063/PLAN.md` supersedes earlier sketches. The bundled **Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0**, supplies the review order: spacing → color → icons → copy → typography → layout → details → visuals → motion.

## Colors

### Primary

The default preference is **Coral**, a warm clay accent. Preserve all ten stored IDs and their authored Dark/Daylight pairs in the frontmatter. Dark and AMOLED share accent colors. Use the selected accent for series, selected icons, calendar marks and the dock's creation control; use `accentText` or `onSelection` for small colored text. These are contrast-adjusted by `palette()`, as are muted/faint text. Do not substitute a raw swatch for those roles.

| Preference | Viewed palette influence in `designexamples/` |
| --- | --- |
| Aqua | `Холст (3).jpeg`, `Цветовая палитра для сайта.jpeg` |
| Mint | `Холст (4).jpeg` |
| Lime | `562f54e8-4854-4454-bd10-4ee8bfd47c49.jpeg` |
| Amber | `Холст.jpeg` |
| Orange | `Color Palette _ Grey _ Black _ Orange _ Blue.jpeg` |
| Coral | `Холст (8).jpeg`, rose/burgundy combination sheet |
| Pink | `Color plate _  color combination for logo design.jpeg` |
| Fuchsia | `079ad195-af05-4009-ad49-ae74f793fb56.jpeg` |
| Violet | `Холст (1).jpeg` |
| Indigo | `Холст (7).jpeg` |

These values are authored semantic derivatives, not pixel samples. Some printed pink-sheet labels conflict with their swatches. Sidecar tonal ramps are synthesized preview aids, not additional app tokens.

### Neutral

Use the matching mode's canvas, surface, elevated plane, alternate surface and selection. AMOLED uses its own black canvas and darker surface; it retains the dark elevated plane. `dock` uses the elevated plane in dark modes and the white surface in Daylight. `line` is the surface mixed 16% toward white in dark modes or toward light ink in Daylight; the extracted defaults are recorded above. System resolves to Dark or Daylight.

**The Neutral Canvas Rule.** Accent preference never tints page backgrounds. Resolve live colors through `palette()`; the legacy accent record's `darkBackground` and `darkCard` fields are not rendering authorities.

**The Meaningful Color Rule.** Keep success, warning, danger and information independent of personal accent. Existing task status/priority maps remain separate from chart-series colors; a chart legend must name its own series. Primary buttons invert ink and canvas rather than taking the accent fill.

## Typography

Use the platform's system sans on Android/iOS. Web uses the existing stack `Inter, "Segoe UI", system-ui, -apple-system, sans-serif`; there is no new font download gate. The exported serif remains available for existing explicit `serifFace` consumers; it does not define the new product hierarchy.

The frontmatter records recurring roles rather than a mathematical scale. `T` defaults to body, rounds line height to 1.45× below size 20 and 1.2× from size 20, and tightens large type slightly. Overrides such as action line height are explicit. Section titles also use size 16/weight 600; numeric summaries can reach 38 or 46. Use tabular numerals for comparable quantities and keep metadata subordinate to task names. Uppercase tracking exists as an opt-in legacy capability, not the default label style.

**The Readable Numbers Rule.** Native `CountValue` has intrinsic height with a minimum, allowing system font scaling. Preserve default font scaling and its accessible numeric label; never reinstate a fixed native height/max-height to contain the transition.

## Layout

Use the established 4px rhythm, with smaller internal control gaps when geometry needs them. `Page` has phone/wide side gutters from the frontmatter, a centered maximum content width (1440px), phone/wide bottom clearance (96/72px), and section gaps (20/24px). Intro text is bounded (680px); titles and actions can wrap. Shared card padding defaults to the gutter step; analytical panels commonly use the panel step. Do not turn all data into identical metric cards.

Phone layouts prioritize a compact named header, thumb dock, date-focused analytical region and separate agenda. Wider compositions can pair the analytical region with a narrower work rail. Keep advanced operations in contextual sheets and grouped tools without removing reachable workflows.

Responsive policy belongs to `layoutMode.cjs`: native uses width ≥900 layout units. Web desktop eligibility starts at 320 CSS pixels, but mobile detection, viewport/screen heuristics and the saved desktop preference govern the result. An explicit desktop preference wins; a detected mobile browser stays in mobile mode otherwise. Do not impose a universal 900px web breakpoint.

## Elevation & Depth

Resting depth comes from tonal planes and fine rules. Shared cards have a single border; analytical surfaces may rely on tone alone. Avoid general-purpose shadows and decorative glow. A lifted Kanban item is the observed exception: black shadow, opacity 0.25, radius 14, offset 0/8 and native elevation 8; it returns to zero opacity/elevation at rest. List shadow offset/elevation use 60% of this height (4.8); cards retain 8. Sheets use a dark scrim and surface plane, with rounded upper corners on phones; wide sheets form a right drawer (560px), or a compact centered dialog (420px, maximum 90% width).

## Shapes

Use gently rounded fields, rectangular contained work surfaces and capsules for primary actions. The exported radius scale and recurring component radii are separate, intentional values in the frontmatter. Shared cards use their own card radius; primary buttons and segmented-control tracks use the capsule radius. Keep one-pixel boundaries quiet. Icon buttons are 44px square; button height is a minimum (46px), input minimum is 48px, and calendar days have a 44px minimum height. Preserve flexible text/containers for system scaling.

## Components

### Buttons and choices

Primary actions are ink-filled capsules with canvas-colored text. Secondary actions use an elevated fill and line; ghost actions are transparent; destructive actions use danger text with a faint danger fill/border. `PressSurface` applies disabled opacity (0.38), bounded compression and web focus indication. It does not block the action while animating. The dock creation button is a deliberate accent-filled exception. Segmented options use inverse ink/canvas when selected; chips use neutral selection with readable accent text, a quiet accent border and selected semantics.

### Fields and calendars

Inputs use a surface fill, fine line and readable placeholder; focus changes the border to `accentText`. Mobile web inputs use 16px type to avoid browser focus zoom. Multiline inputs have a minimum height (112px). Preserve the existing lazy commit-buffer behavior where used.

`InlineCalendar`, `InlineDateField` and `InlineDateRange` live together in `src/ui/InlineCalendar.js`, backed by pure ISO rules in `src/domain/calendar.cjs`. Expand month selection in place throughout scheduling/date workflows. Weeks begin Monday; show six rows, subdued adjacent-month dates, an inverse selected day, bounded date limits, range shading and explicit endpoints. Keep clear-date and typed ISO alternatives. Range start selection advances to the end only when its callback accepts it; validation remains with the caller/domain.

### Containers, navigation and sheets

Cards contain related work; rules and spacing can separate records without another card. The dock has labeled tabs and a creation control. Selection enlarges the icon from 20px to 24px over 150ms without a backing tile or changing its 48×28px slot. Wide navigation uses labeled rows and a selected neutral plane with accent icon. Preserve screen-reader roles, selected/expanded/disabled state, named close actions, Android Back and keyboard-safe sheet structure. Retained pages fade on activation while preserving their child and scroll identity.

Task description follows the title before metadata/planning. Its editor uses a 20px theme-accent SVG check and semantic-red SVG X in named 44px press targets; save rejection retains the draft. Action-menu confirmation, cancel, failure, retry and copy success stay inside the same popup; navigation actions can close it. Confirmed deletion may remove its record/view. Copies preserve current task/project context. Manage tools lives in More; Board filters live in header Tools, with no duplicate large button. Home dates page horizontally between seven-day windows; tap toggles a day filter, changing weeks clears it, and screen-reader week actions preserve access without chevrons.

### Charts and artwork

Use actual local task, budget, capacity, release and completed-sprint records. Zero remains zero; completed sprint history is frozen, never inferred from present task status. Workload/status graphics, seven-day columns, velocity areas, budget comparison bars and capacity arcs carry named values and accessible text. Inspection exposes the corresponding records. Data-area gradients are limited to data shading; do not decorate the canvas with gradients.

Empty states use the original geometric SVG family with a purpose-specific explanation and working next action. No reference raster was added as shipping art in this redesign; retain existing app/brand asset provenance. Visual authority is the final documented mix of date/work regions, asymmetric analytical surfaces and Asana/monday/Jira workflows. `Home _ X.jpeg` and its duplicate are explicitly excluded.

### Motion

Reuse the platform pairs: press (native 70ms down/170ms up; web 170ms), reveal (190ms, 8px by default), retained-page presence (120ms), left-origin progress fill (380ms), keyed numbers (native 180ms in/120ms out; web 180ms reveal), columns (420ms with 30–35ms series staggering), and line traces (440ms). Calendar month changes reveal over 180ms at 4px. Overview has specific bounded overrides; do not normalize them into a global entrance sequence.

Kanban keeps live pointer translation direct. Native lift springs over 260ms with 5px lift, 1.025 scale and bounded ±2° tilt; horizontal neighbour displacement is 300ms, vertical preview 240ms, reflow 210ms and arrival 170ms. One animated style multiplies arrival and caller opacity; do not add entering opacity animation to that same measured root. The active strip stacks above the board ribbon, allows native overflow and reserves compensated top room without shifting list positions or reparenting the held responder. List lift uses 60% of the base excursion: 3px native rise, 1.015 scale, bounded ±1.2° native tilt and −0.72° web tilt. Card lift remains at the base values. Web uses 180ms lift/shift and 210ms reflow. Native follows `ReduceMotion.System`; web checks `prefers-reduced-motion` and the app media rule disables CSS transitions. Keep these mechanisms when extending motion. Source checks do not certify frame rate or device feel.

## Do's and Don'ts

### Do:

- **Do** resolve color from the current mode and selected accent through `palette()`.
- **Do** keep work, truthful data, calendar selection and gesture feedback visually prominent.
- **Do** preserve readable text, named controls, flexible sizing and reduced-motion behavior.
- **Do** use the existing platform layout policy and motion primitives before introducing another system.
- **Do** review empty, populated, completed, error and selected-date states independently.

### Don't:

- **Don't** tint the canvas with the accent, add glow, gradient text or decorative motion loops.
- **Don't** use the parent-brand ribbon N, copy competitor artwork or reinstate excluded references.
- **Don't** fabricate activity, pre-start sprint history, remote outcomes or evidence of verification.
- **Don't** tween live Timeline/Kanban pointer tracking or replace an inline date flow with an unrelated date convention.
- **Don't** treat source fixtures or passing contrast checks as native/runtime acceptance.

Extraction status: **Pass** for source-backed tokens and component documentation. Existing `source-review/*.png` fixtures render actual JSX through RN Web with injected data and an SVG adapter; effects/actions are inert and layout callbacks are not measured. They are composition evidence only. Live Expo, Android/iOS, large-font native behavior, persistence round trips, gesture feel, warnings and FPS acceptance remain **Not run / pending owner validation** as recorded in `docs/qa/redesign-063/ENGINEERING-REPORT.md`. The finish verdict covers two resolved source findings only. No adaptive RN HTML/CSS design detector ran. Documentation introduces no migration; reversal is removing these two new documentation artifacts, leaving app/data unchanged.

Interaction follow-up checks and device limits are recorded in `docs/qa/redesign-063/popup-nav-warning-followup.md`; source fixtures and the prior independent finish review predate this follow-up.

Project cards expose Edit project through Project actions while retaining the inline draft editor. More groups Scheduling with Project tools and exposes Manage tools once as a card. The workspace row opens the same compact Projects/Workspaces manager as the header, starting on Workspaces; it has no separate side modal. Project picking/creation delegates to the shell callback.

Performance refinement: keep date rail pages stable through day selection; compute portfolio/calendar facts from source data without repeated work. Failed bulk task status edits retain their selection so retry stays in context. Native Reveal cancels delayed work on unmount while retaining its appearance and reduced-motion settings. CPU-only evidence and device limits: `docs/qa/redesign-063/FOCUSED-PERFORMANCE-AUDIT.md`.

First-run tour: retain the supplied Board/Timeline/release slides and the four Board/Sprints/Timeline/Blank starter choices. Use the original geometric TourArtwork family, existing Reveal/PressSurface, a centered maximum 520px flow, safe-area/keyboard handling, named Skip/Back and accessible selected/disabled/error states. Empty installs may auto-open; existing/recovered workspaces require More → Take the tour. Starters configure a new empty project atomically and never replace existing work. Keep the Island notice in the tour's accessible visual layer. Native runtime acceptance remains pending.
