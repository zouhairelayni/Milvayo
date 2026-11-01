# Unslop audit — Tasks workspace v0.2.8

Original skill: Damir Sokolovsky, CC BY 4.0 (bundled in `.opencode/skills/unslop/`). This batch applies the skill as a design constraint, not a claim of full-screen redesign or a runtime screenshot comparison.

## Direction
- **Product:** manage tasks, release work and independent engineering projects on desktop/mobile.
- **Character:** calm, exact, dependable.
- **World:** quiet technical workbench and planning instruments.
- **Moments:** Kanban movement, status and dependency states.
- **Signature:** restrained violet active/selected controls, semantic status colors.

## Before → after by pass

| Pass | Observed issue before | Change in v0.2.8 |
|---|---|---|
| Spacing | Unlimited tasks list grows without bounds | 40 visible rows, 12–16px spacing, 44px selection targets |
| Color | Mixed states compete for emphasis | Selected violet only; other filters neutral; preserve status semantics |
| Icons | Task status and action icons could compete with row text | Reused existing Ionicons, no new decorative icon set |
| Copy | No explanation of batch effect | Short labels and one clear recovery/blocked warning |
| Type | Metadata competes with task title | Secondary ID/breadcrumb; readable title |
| Layout | Filtering and task selection absent | Separate compact filters and conditional bulk operations; horizontal filter rails on mobile |
| Details | No parent context or task hierarchy in row | Parent breadcrumb, parent editor and child list |
| Visuals | Added controls could obscure actual work | Board and Gantt content retained; controls scoped to Tasks |
| Motion | Huge card list causes pressure on render budget | Bounded Board lane and Tasks items; no new visual motion |

## Limitations
No Android/Web render was available in the delivery workspace; user runtime screenshots are required. Shared shell and Gantt redesign were not part of this feature batch. No speculative visual success claims.
