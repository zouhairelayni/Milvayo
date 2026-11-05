# Milvayo — full-surface frontend design audit (v0.5.50)

**Baseline:** Full v0.5.49 source ZIP. **Platform:** React Native / Expo, Android, iOS, mobile Web and desktop Web. **Review method:** Walked the entire `SCREENS` registry and `NAV` map, audited 72 JSX-bearing source modules, inspected all `Pressable` and `Sheet` uses, drawer and modal flows, notification components, chart controls, shared typography and theme contrast. Changes were made to actual source, not a mock or installer.

**Design direction:** A focused project operations console: dense but legible information, predictable controls and one meaningful accent. No decorative side-accent bars, glowing buttons, unnecessary cards, arbitrary visual flourishes, or changes to user data. Apple guidance is used for general mobile/desktop interaction and accessibility principles, not to impose iOS-specific visuals on Android. Frontend Design favors a distinct product identity over generic template ornament.

## Screen and sub-screen coverage

| Navigation destination | Examined surfaces / nested interactions | Outcome |
|---|---|---|
| Overview | Progress summary, linked metrics, recent tasks, readiness cards, status shortcuts | Shared Card/metric button semantics, status contrast |
| Board | Board selector and manager, list creation, board Tools, inline add-card, lists, task cards, drag state, power-ups | Accessible selection, named controls/gestures, 44pt focusable actions; original drag preserved |
| Timeline | Zoom header, Gantt bars/dependency handles, Parent Tasks, To Schedule, labels, chart and date readout | Labeled task controls and assistive tap; grid hit area unchanged |
| Scheduling | Calendar, dependency type/lag, preview and application confirmation | Shared Fold, segmented input, and confirmation semantics |
| Tasks | Search, filters, Tools, saved views, list/tree layouts, bulk actions, task rows | Named/selected task rows, larger checkbox target, shared controls |
| Sprints | Sprint editor sheet, sprint goal, backlog and task selection, dependencies | Named task links, 44pt tap rows, calmer labels |
| Releases | Release metadata, readiness verification, release operations and deletion | Shared form controls and destructive confirmation reviewed |
| Testing | Test cases, evidence, and validation workflows | Shared form/input and status component coverage |
| Resources | Contributor management, hourly rates, capacity and time logs | Accessible field labels, dropdowns and expandable rows |
| Collaboration | Reminders, comments, editor and destructive actions | Shared form and confirmation improvements |
| Costs | Budget editor, planned/actual cost indicators and charts | Shared Stat/Pill accessible labeling and ink |
| Projects | Creation sheet, hierarchy, governance entry points, PM document tabs | Named navigation, modal and field improvements |
| Portfolios | Create/edit sheet, memberships, lifecycle and portfolio actions | Shared sheet semantics, form labels and confirmation |
| Programs | Create/edit sheet, benefits, roadmap, portfolio/project details | Contrast-safe accent status, interactive details |
| Automations | Commands, workflow rules, due checks, action presets | Shared form controls, dropdown and disclosures |
| Reports | Summary reports, burndown chart and exports | Accessible legend checked states and readable contrast |
| Activity | History and event listings | Shared legibility and section controls |
| Specifications | Definition templates, stage and evidence fields, editors | Accessible sentence-case field labels |
| Settings | Theme modes, accent selection, diagnostics, workspace controls | Improved palette text contrast, message and modal behavior |
| Internal Task Configuration | Types, custom fields, workflow restrictions, configuration sheet in Tasks | Shared editing/confirmation and label review |

## Global surfaces reviewed

- Primary navigation: phone bottom tabs, hamburger drawer, collapsed/wide desktop sidebar, project and workspace switchers, project creation overlays.
- Task detail and draft-only create task sheets; task fields, label editor, destructive confirmations, selectors, duplicate actions.
- Governance sheets: Project, Portfolio and Program create/edit; WBS outline, risks register/matrix/plan, PM document editor and finance charts.
- Board Tools, Boards Manager, New list, Timeline Parent Tasks and To Schedule, Sprint editor, diagnostics report sheet.
- Notification surfaces: persistent island notices, inline modal error notices, screen-render error boundary, backup progress, restore warnings and confirmations.

## Findings and source fixes

| Severity | Finding | Correction |
|---|---|---|
| High | New Governance risks were saved immediately as blank records | New risk remains a local draft until **Save risk**; Cancel discards it |
| High | Risk deletion was one tap without confirmation | Uses shared two-stage destructive confirmation |
| High | Some read-only chips were exposed as buttons | Display-only chips and task labels are ordinary Views; editable counterparts remain buttons |
| High | Many pressable rows had no explicit semantics | Added role, meaningful name, state and accessible tap actions; chart canvas remains intentionally out of screen-reader traversal |
| High | Light-mode accent text failed 4.5:1 for several accents | Added minimally adjusted `accentText` variant without changing button/chart accent |
| Medium | Placeholder/secondary colors were too faint in light appearance | Adjusted neutral ramp; automatic contrast tests cover 30 theme combinations |
| Medium | Governance WBS rows had a decorative colored side rail | Replaced with a restrained eight-point semantic dot |
| Medium | Governance mini controls used 32-point targets | Standardized to 44 points, without changing their actions |
| Medium | Form headings were frequently tiny, bold and uppercase | Standardized residual field labels to 12-point sentence case |
| Medium | Modal background dismissal was not labeled, and modal content lacked escape semantics | Added shared modal labels, accessibility escape and header role |
| Medium | Notifications had a smaller dismiss target; inline errors were passive announcements | Expanded dismiss hit target and made inline errors assertive |
| Medium | Chart series could only show disabled state via low opacity | Uses legible strikethrough plus announced checked state; readable numeric accent text |
| Medium | Error boundary displayed raw exception detail directly to users | Replaced with actionable screen copy; diagnostics retain technical context |

## Contrast and interaction checks

- Compared primary, secondary, placeholder, accent text and primary-button label luminance for 10 accents × 3 appearances (Light, Dark, AMOLED). Minimum normal-text contrast required: **4.5:1**; the tests assert every combination. The System setting resolves to Light or Dark.
- App-wide static scan before fixes: 31 source `Pressable` elements without explicit role; after fixes one unlabeled gesture-only chart hit area remains deliberately excluded from the accessibility tree (`accessible={false}`).
- Verified source-level declarations for shared sheets, disabled states, selection, collapse/expand, and the project/wbs/risk editing paths.

## Remaining limitations and device QA

**This was a code and automated regression audit, not 19 real-device screenshot tests.** No native Expo Go, iOS simulator or interactive browser preview was launched in this container. Important remaining checks: test landscape and 320/390px mobile layouts, long labels with system font scaling, VoiceOver/TalkBack traversal, keyboard focus/escape on Web, modal swiping and background taps, Gantt/Board gesture conflicts, new-risk Cancel/Save, and notification announcements on actual devices. Colour contrast of raster assets, user-entered label colors and all semantic status hues was not exhaustively verified.

Sources for design method: https://github.com/dickwu/apple-design-skill and https://github.com/anthropics/skills/tree/main/skills/frontend-design. No copy of either skill is shipped in this release.
