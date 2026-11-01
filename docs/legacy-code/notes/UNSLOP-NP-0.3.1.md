# Unslop review — Niyarvo Projects 0.3.1

Source-only audit. Not a claim of rendered device QA.

## Direction

- **Product:** Multi-project planning across tasks, roadmaps, Kanban and release checkpoints.
- **Character:** Calm, exact, dependable.
- **World:** Technical planning workspace, quiet charcoal instruments.
- **Moments:** Gantt rollups, task statuses and one focused accent selection.
- **Signature:** The original Niyarvo symbol recolors as a single, personal accent.

## Nine-pass changes

1. **Spacing:** Settings swatches use uniform 8px gaps, consistent min heights, bounded columns on mobile; Gantt Tree control uses the existing 40px control rhythm.
2. **Color:** Replaced hard-coded violet navigation/selection with `C.accent`-derived values (compatibility alias `C.purple`). Default Clay orange `#D97757`; surfaces remain charcoal. Status warning and success colors keep semantic meaning.
3. **Icons:** Original Niyarvo monochrome vector paths, now dynamic by color; no extra decorative icons or emojis.
4. **Copy:** Short labels, `Accent color`, `Tree`, `Expand subtasks`, `Collapse subtasks` and explicit platform icon limitation.
5. **Typography:** Reused established text scale and weight; no new custom fonts.
6. **Layout:** Swatch wrapping rather than a horizontally scrolling palette; Gantt uses its original fixed-label/timeline composition with indented tree rows.
7. **Details:** Accessible selected state and SVG brand preview, progress display in parent rows, no warning-color changes.
8. **Visuals:** Monochrome icons regenerated from the user's centered brand symbol; no gradients, glows or generated imagery.
9. **Motion:** Instant color updates, no animations introduced; preserving already-accepted drag behavior is intentional.

## Outstanding visual acceptance

- App screens were not rendered in Expo Go or browser here.
- Confirm Settings on narrow devices and Tree view with large nesting depths; current UI clamps visual indentation after five levels.
- Static Android/iOS launch icons use the default orange and cannot respond to JS preferences after installation.
