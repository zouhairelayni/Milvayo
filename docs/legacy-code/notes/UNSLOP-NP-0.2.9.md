# Unslop pass — v0.2.9 Tasks and dashboard changes

Based on the user-supplied `unslop` skill (Damir Sokolovsky, CC-BY-4.0). This pass covers the **new components only**; it does not claim a complete redesign of all inherited application screens.

## Five-line direction

- **Product:** An offline-first, cross-platform management tool for coordinating task hierarchies, schedules and releases.
- **Character:** Precise, focused, dependable.
- **World:** Technical project planning boards and schedules.
- **Moments:** Real task progress and the Gantt schedule are the main visual information, not decorative gradients.
- **Signature:** Niyarvo violet remains a restrained selection/accent indicator; status colors convey work meaning.

## Initial redlines

- v0.2.8 Tasks already displayed two full horizontal status/priority filter rows. Adding more controls without restructuring would further crowd mobile portrait mode.
- Parent-child hierarchy had no visual numerical progress; the dashboard had no actionable progress summary.
- Existing application screens have many button-like controls in the header and forms and require a later full visual QA; they are outside this batch's functional scope.

## Nine passes for modified surfaces

| Pass | Implementation |
|---|---|
| Spacing | Saved views grouped in one card; advanced filters behind a disclosure button; consistent 8–12 px gaps. |
| Color | Use existing neutral surfaces, only selected filters use Niyarvo violet. |
| Icons | Bookmark icon for saved views, options icon for filter disclosure, plain trash for delete. |
| Copy | Short, explicit controls: Save view, Filters & sort, Delete selected; exact progress/effort meaning. |
| Type | Reuse shared typography, no decorative all-caps overline or emoji badges. |
| Layout | Horizontal saved-view picker and collapsible multi-row filters avoid permanent mobile toolbar overload. |
| Details | Percentages and estimate weight appear in task rows and dashboard; no duplicated chrome. |
| Visuals | One real progress bar inside dashboard tile, colored by existing semantic cyan. |
| Motion | No looping animations, glows, hover scaling or new gratuitous motion. |

## Verification limitations

Source-level JSX parsed and model/UI wiring is present, but no renderer screenshot or Android viewport comparison has been run in this environment. Device-level readability, clipping and responsiveness **remain acceptance tests**, not assumed successes. The user has previously reported broader app UI clutter; that is not represented as fully solved by this focused pass.
