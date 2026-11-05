# Milvayo v0.5.49 — Frontend design / Apple interaction audit

**Basis:** Actual v0.5.48 complete source ZIP. Design criteria from Anthropic Frontend Design and Emil Kowalski's Apple Design / design engineering skill; implementation is original source code for this Expo React Native + Web project. No third-party code, fonts or new packages copied into the app.

**Direction**
- Product: project-management workbench for owners tracking tasks, teams, roadmaps, and releases.
- Character: calm, exact, dependable.
- Material: tinted-neutral panels and controlled outlines, rather than glow/gradient ornament.
- Moments: real Kanban movement, Gantt dependencies and project progress.
- Signature: user-chosen accent on the Niyarvo mark and one or two meaningful actions, not decorative vertical accent stripes.

## Findings and changes

| Surface | Before | Action in v0.5.49 | Coverage |
|---|---|---|---|
| Shared headers | New task/Tools/zoom/menu had 34–38 pt targets and different padding | 44 pt targets, 64 pt mobile row, consistent 8 pt gaps and center alignment | Every app screen; contextual Board, Tasks, Sprints and Timeline headers |
| Narrow screens | Long contextual actions could crowd the primary task action | Horizontal scroll for contextual actions and segmented Timeline zoom; primary action stays visible | Mobile Web and native; desktop compact widths |
| Phone menu | 160 pt drawer cramped logo and navigation | 240 pt drawer, max 80% viewport width; non-dense 44 pt nav rows and restored readable logo | All menu destinations; switching Projects/Workspaces maintained |
| Buttons, icons and chips | Small controls 34–42 pt high, inconsistent tappability | Shared button, icon, chip, and segmented control targets 44 pt | All screens and shared sheets |
| Field inputs and labels | Single-line inputs could have tiny hit areas; uppercase tracked labels | At least 44 pt input targets, sentence-case 12 pt labels; mobile Safari 16 pt input text | Governance, Workspace, Settings, task forms and compact editors |
| Dropdowns | 16 pt radius disagreed with shared 9 pt controls | Use shared control radius and existing 44 pt rows | Every option editor using CompactTools |
| Task lists | Some Board, Tasks and Timeline interactions had 36–40 pt targets | 44 pt task-row press areas, no sorting/persistence changes | Three screens with observed short rows |
| Screen spacing | Wide Page top padding differed from established 24 pt layout rhythm | Standardized wide Page top padding at 24 pt | All Page-based screens |
| Keyboard focus | Hardcoded orange ring conflicted with other accent choices | High-contrast current-text-color focus outline retained | Web app shell |

## Screens inspected via source structure

- **Plan:** Overview, Board, Timeline, Scheduling, Tasks. No change to Gantt or Kanban gesture and SVG drawing engines.
- **Deliver:** Sprints, Releases, Testing. Their existing confirmation/gating logic remains untouched.
- **Team and money:** Resources, Collaboration, Costs. Common form and controls updated through shared UI.
- **Governance:** Projects, Portfolios, Programs. Creation sheet workflows remain unchanged.
- **Operate:** Automations, Reports, Activity, Specifications, Settings. Improved shared controls and page rhythm; no data model changes.
- **Navigation:** Desktop Sidebar, TopBar, mobile SideMenu/TabBar, ProjectSwitcher, and both switcher drawers. The project/workspace switchers are preserved, menu navigation targets enlarged.
- **Overlays:** Shared Sheet, task editor, Board tools and other popups reviewed. Existing close/backdrop/swipe-to-dismiss behaviors retained; no new competing swipe recognizer.

## Intentional restraint

- No universal card/chrome redesign; the app has an existing visual identity and data density.
- No new spring library or animation framework; gestures are performance-sensitive and need real-device profiling before being reworked.
- No nonfunctional ornament, side accent stripes, new font packages, artificial wait times or heavier effects.

## QA / acceptance status

- Source/Node regression suite: **622 passed, 0 failed, 1 skipped** on the **freshly extracted release ZIP** (623 tests total).
- JS/JSX/CJS syntax parse: **229 files, 0 parser diagnostics** on the **freshly extracted release ZIP**.
- Static source audit: complete across shared components and navigation map.
- Physical Android and mobile browser: **NOT RUN** in the source container. Test 320/360/390 px viewports, long project names, screen header scrolling, keyboard focus, drawer opening and nested switchers; verify no clipped actions.
- iOS: **NOT RUN**, including VoiceOver and safe-area rotation.

**References**
- https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md
- https://github.com/emilkowalski/skills
