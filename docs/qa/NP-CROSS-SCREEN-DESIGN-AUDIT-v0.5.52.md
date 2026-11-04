# Niyarvo Projects v0.5.52 — Cross-screen UI/UX audit

**Audit scope:** All 20 registered `SCREENS` destinations (including the internal Task Configuration route), primary Android tab bar, desktop/phone navigation, cross-screen sheets, drawers, dialogs, chart interactions, inline notices and form controls. Baseline: verified v0.5.51 source archive. This is a **source and automated regression audit**, not a device or screenshot walk-through.

**Principles used:** Frontend Design (information hierarchy, responsive rhythm, restrained visual language), `dickwu/apple-design-skill` (clear touch targets, discoverable actions, adaptive content, warnings before destructive actions) and Unslop/Ponytail (preserve working features, fix specific defects with small diffs, avoid decorative side-accent strips). Theme colors, domain logic, data schema and chart gesture semantics remain the source of truth.

## Priority findings and changes

| Severity | Location | Source finding | Fix / retained design rule |
|---|---|---|---|
| High | Timeline: Gantt | v0.5.51 deliberately hid ribbon, date labels and zoom after 80 px of vertical scrolling, contrary to the requested behavior | Pin ribbon and horizontally synchronized calendar outside vertical ScrollView, keep zoom in app header and remove fade state |
| High | Scheduling: propagation | Raw `JSON.stringify` preview was truncated and difficult to evaluate before committing schedule changes | Show named tasks, old/new dates, issue and change counts; prevent Apply for invalid/empty proposals |
| High | Releases: metadata editor | Inline fold conflicted with the task-sheet editing convention | Use draft Sheet with explicit Save/Cancel, Markdown notes and header action |
| Medium | Overview: Next due | Invalid or missing dates could enter due task list, leading to confusing results | Only include valid dated tasks, add informative empty state |
| Medium | Sprint tasks and backlog | Two dense task lists dominated the screen, especially on phones | Wrap in expandable sections, preserving item actions and existing pagination |
| Medium | Collaboration / Resources / Scheduling | Technical task IDs required manual entry with high error risk | Add task-name dropdowns, retain raw ID backing field and disable incomplete submissions |
| Medium | Specifications | Long-form PM fields did not share the Markdown preview UX from other editors | Use shared MarkdownField for rich text, keep source as string |
| Medium | Reports: velocity | Bar columns shrink excessively with long sprint history; empty dataset leaves a blank panel | Horizontally scrollable columns with minimum width, accessible value/name and empty-state explanation |
| Medium | Activity feed | Fixed 62-point timestamp cut date/time text; long histories render too many rows | Responsive timestamp layout and show-more paging |
| Medium | Costs | Negative remaining budget looked similar to a healthy positive value | Semantic critical color for negative budget |
| Medium | Burndown gestures | Chart seized touch on start, risking vertical scroll interruption | Claim only clearly horizontal movement, retain tap selection |
| Low | Critical notices | Important errors were announced with same politeness as success updates | Assertive live region for errors, normal polite messages otherwise |

## Coverage by destination

| Screen or route | Review focus | Action in v0.5.52 |
|---|---|---|
| Overview | KPIs, readiness, Next due, navigation targets | Dated-task filtering, empty state, metric hit targets |
| Board | Toolbar, board switcher, drag handles, column pagination, board tools | Reviewed; retained validated task drag and ten-card paging behavior |
| Timeline | Zoom, ribbon, calendar, bars, dates, virtualized links, Parent Tasks, To Schedule | Pinned controls, calendar horizontal sync; kept bar and dependency engines |
| Scheduling | Calendar, dependency options, propagation review | Named task selectors and human-readable guarded preview |
| Tasks | Search, filtered views, bulk edit, nested rows, tools sheet | Reviewed; retained grouped tools and current table/list navigation |
| Task configuration (internal) | Task types, custom fields, workflow restrictions | Reviewed; existing sections already provide progressive disclosure |
| Sprints | Selector, summary, history, burndown, assignment/backlog | Progressive disclosure of long lists; no lifecycle changes |
| Releases | Form, gates, task links, release history | Draft editor sheet and header action; no Git side effects |
| Testing | Check status, evidence, history, pagination | Reviewed; existing 25-check progressive display retained |
| Resources | Contributor management, time entries, capacity | Task-name selector for time logs; retained capacity model |
| Costs | Budget, labour totals, progress bars | Semantic overspend indication |
| Collaboration | Reminders, comment history, destructive actions | Reminder task picker; existing delete confirmation retained |
| Projects | Governance metadata, documentation and audit | Reviewed; v0.5.51 form visibility and Markdown fixes retained |
| Portfolios | Creation/edit sheets, membership and statuses | Reviewed; existing footer and Markdown preview retained |
| Programs | Creation/edit sheets, benefit register, project mapping | Reviewed; existing footer and Markdown preview retained |
| Automations | Command forms, route settings, templates, history | Reviewed; existing nested Fold groups retained, no domain change |
| Reports | Velocity and task distribution, CSV actions | Responsive velocity chart, no-data state |
| Activity | Historical record list and timestamps | Adaptive row density and 50-at-a-time paging |
| Specifications | Schema/API/playbook forms, long text | Markdown preview for long-form entries |
| Settings | Theme, backup tab, diagnostics | Reviewed; existing four modes and ten accents retained |

## Shared overlays and interaction surfaces

| Surface | Audit observations | Status |
|---|---|---|
| Global task creation and editor sheet | Explicit Save, discard on Cancel, confirmations and Markdown editor | Retained, domain tests unchanged |
| Sprint and release sheets | Draft state and cancellation, footer primary action | Sprint retained; release standardized |
| Project/portfolio/program sheets | Field outlines and Markdown previews | Retained v0.5.51 fixes |
| Board tools and Tasks tools | Settings grouped and not duplicated in screen toolbar | Retained |
| Timeline Parent Tasks and To Schedule sheets | User-selectable tasks and normal edit workflow | Retained; ribbon now pinned |
| Hamburger / project switcher / bottom tabs | Original theme controls, swipe/tap navigation and layout detection | Retained; no new gesture responder added |
| Confirm / Delete actions | Existing confirmation logic and visible Cancel | Retained |
| Alerts, inline notices and diagnostic panel | Accessible labels, dismiss targets, failure announcements | Error announcement strengthened |
| Burndown and report charts | Contrast, scales, touch/scroll ownership | Burndown vertical gesture fix; report velocity layout |
| Backups and AES password forms | Input focus, password confirmation, guarded recovery | Reviewed; v0.5.47/0.5.51 behavior retained |

## Verification limits and acceptance checklist

**Automated:** run `npm test`, JavaScript/JSX syntax parsing, and fresh-extracted-archive tests. Include the exact counts from the run in the final release summary. Existing store, gesture and security tests were preserved.

**Not run on hardware:**
- Android and Brave: scroll Timeline vertically; header ribbon and calendar must remain visible and follow horizontal panning/Today/First Task. Validate drag and resize remain smooth.
- iOS Safari/Expo: sheet scrolling and keyboard focus; verify date row and chart height under safe areas.
- VoiceOver/TalkBack: task picker names, modal announcements and notice priorities.
- Large project (100+ tasks / 20+ sprints): dropdown performance, horizontal chart and dashboard responsiveness.
- Check documentation and version information after extracting into `~/NiyarvoProjects` and removing obsolete local files if needed.

No claim of real-device, visual snapshot or accessibility acceptance is implied by source checks.

## Release qualification (source)

- Full Node regression suite on edited source: **649 total, 648 passed, 0 failed, 1 skipped** (before final archive verification).
- Static JSX/JS syntax: audited across all shipped `.js` / `.cjs` files with TypeScript syntax parser.
- Existing dependencies and storage formats retained; no production browser or physical phone interaction was executed here.
- The final archive verification result is assessed separately after extracting the actual shipped ZIP.
