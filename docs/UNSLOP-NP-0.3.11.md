# Unslop review — Kanban v0.3.11

Guidance: original Unslop skill by Damir Sokolovsky, CC BY 4.0; preserve existing Niyarvo colors and feature identity.

## Product direction
- Product: structured project-management workbench with tactile Kanban tasks and release gates.
- Character: calm, exact, deliberate.
- World: planning instruments with restrained graphite surfaces.
- Moments: card hierarchy and visible status/progress across the board.
- Signature: Niyarvo's one user-selected accent; default clay orange.

## Before audit and nine-pass result

1. Spacing — previous card padding 16 px increased vertical density cost; adjusted to 12 px, with 44 px card actions and independent column heights preserved.
2. Color — retained dark neutrals and one selected accent; GitHub labels in neutral outlines. Warnings use existing semantic colors.
3. Icons — Ionicons are reused; no emoji decorations.
4. Copy — concise Power-Ups, Add card, Refresh public details; no promotional copy.
5. Typography — compact card titles, secondary metadata.
6. Layout — board-level extension menu only when requested; on-demand upcoming-due list; link details inside task editor rather than flooding cards.
7. Details — shows contextual checklist progress, GitHub attachment counts and age only if extension is enabled.
8. Visuals — no stock images or decorative gradients; actual task content is central.
9. Motion — no new animation; original long-press drag preserved in code.

**Evidence limits:** mobile and web pixels not visually rendered or tested in a live Metro session. The uploaded `kanban.zip` was not mountable, so this audit applies to the Niyarvo v0.3.10 baseline, not a purported external archive review.
