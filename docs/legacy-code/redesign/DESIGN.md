# Design direction and audit

Product: independent project, task, schedule and release management.
Character: calm, exact, dependable.
World: graphite planning instruments and quiet workspaces.
Moments: ordered task cards and a legible dependency timeline.
Signature: Niyarvo mark, persistent user-selected accent, meaningful status colors.

Before: 17 equally weighted navigation links; task editor is one long form; tiny card metadata; duplicate primary actions; task rows lack aligned desktop columns; timeline labels squeeze into narrow day cells. Preserve the existing domain model and native gesture handlers.

Phase 1: graphite surface hierarchy, grouped navigation, project view tabs, new overview, roomier cards, sibling quick-action controls, responsive task list, tabbed inspector, input labels, focus rings and iOS keyboard avoidance. Shared colors propagate into secondary screens.
Phase 2: timeline toolbar, readable date intervals, pinned calendar header, progress bars, responsive QA.

Review references consulted:
- Bundled Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0. Original retained at .opencode/skills/unslop.
- https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md (app-screen guidance; some remote references unavailable)
- https://github.com/dickwu/apple-design-skill/blob/main/SKILL.md (community Apple design review skill, not an Apple-authored skill)
- https://developer.apple.com/design/tips/
- https://developer.apple.com/design/human-interface-guidelines/layout
- https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts

No third-party product code, Figma assets or Trello/Asana/Monday branding copied. No new runtime dependencies. This is an Expo app redesign, not a new deployed website or native desktop application.
