# Milvayo redesign — implementation plan before code

**Software: mobile-first work-management product, not a marketing website.** Visitor mode: Operate. Scope is exclusively `/mnt/Milvayo/redesign` (the existing Termux `~/Milvayo/redesign` copy). Parent baseline hashes are in `parent-baseline.json`; no application code was edited during reference review/planning.

## Confirmed direction and review standard

Product: a local-first studio for independent work and verified delivery.
Character: composed, capable, approachable.
World: organized work, focused decisions and connected people.
Moments: a task becoming actionable, a clear schedule, a successful handoff.
Signature: the Milvayo Board mark, palette-led surface families and a consistent contextual action system.

Use Impeccable's planning structure (job, outcomes, direction, scope, states, interaction, constraints), Taste's deliberate real-product hierarchy, Frontend Design's explicit composition, UI UX Pro Max accessibility/native patterns, and Software Mansion/Callstack/Expo motion guidance. Unslop by Damir Sokolovsky, CC BY 4.0, supplies the nine-pass review standard. This user's explicit reinvention brief supersedes the earlier instruction to preserve the old visual layouts. No copied competitor art, marketing heroes, shader effects, new UI frameworks or approval gate for routine candidate work.

The brief settles audience, tasks, platform, protected data, reference-led direction and implementation authorization. We are planning these concrete requirements, not asking the user to repeat them. Code-first app UI; original local vectors for empty states. The required approval is before any parent-app integration, never an automatic promotion at completion.

## Before audit (spacing → color → icons → copy → typography → layout → details → visuals → motion)

1. Spacing: repeated card/fold stacks use the same vertical rhythm regardless of screen job; mobile forms and actions compete.
2. Color: old theme ramps are explicitly inherited from a different product's palette; actual supplied palettes contain coherent multi-tone families which should drive this candidate.
3. Icons: shared Feather set and the small chart magnifiers are useful. Status/utility icons need consistent containers and semantic roles, without tiny interactive hitboxes.
4. Copy: utilities explain storage truth but lack a clear arrival/next action. Retain truthful local-only limitations; reorganize their presentation.
5. Typography: large task titles and dense tiny metadata lack a unified relationship. Use the installed system sans with a deliberate product scale; no font downloads/startup gate.
6. Layout: current top controls, body actions and footer actions can duplicate each other. Recompose each workflow around one main action, compact filtering and contextual secondary actions.
7. Details: advanced forms/row editors, WBS commands and backup controls need progressive organization; preserve every callback and failure path.
8. Visuals: many empty screens are text-only. Build an original small family of planning/document/team illustrations, with purposeful empty-state content and existing working actions.
9. Motion: existing native pinch crosses UI/RN commit boundaries; investigate its geometry and remaining render reads first. Restrict new UI motion to press, reveal, selection and feedback, with reduced-motion variants.

## Visual review completed before implementation

All **131 files** in `designexamples/` loaded successfully and were visually inspected in the eleven numbered contact sheets. `reference-inventory.json` maps every numbered item to its actual source filename; `reference-load-checks.json` records decode success and dimensions. Animated GIF was reviewed as a rendered frame, not certified as a full motion study. Nine palette originals were additionally opened at full size for their printed HEX labels. Some palette labels conflict with the visible swatch (notably the pink combination sheet); do not blindly treat such labels as measured pixels.

The user confirmed that references and palettes are grouped in **`designexamples/`**. No substitute folders will be created and no references are read from the protected parent.

## Reference → design decisions (real files viewed)

| Actual reference | Observed pattern / palette | Candidate implementation |
| --- | --- | --- |
| `designexamples/Screenshot_20261106_022534_Asana.png` | A focused Manage view sheet separates filters and ordering | Tasks/Board filters move to a dedicated grouped sheet; active summary remains in the content header |
| `designexamples/Screenshot_20261106_022629_monday.png` | Clear heading, compact date scopes, illustrated empty result, one add affordance | Overview and planning surfaces prioritize current work and one create action; use original Milvayo empty art |
| `designexamples/Screenshot_20261106_022636_monday.png` | Spacious original-art empty state below a compact filter rail | Releases, Testing and Collaboration get purpose-specific titles, explanation and an existing helpful CTA |
| `designexamples/Screenshot_20261106_022802.png` | Small grouped current-work categories, separate lists and compact bottom creation | Overview separates attention from broader summaries; navigation/creation form a consistent thumb-accessible system |
| `designexamples/Screenshot_20261106_022816.png` | View options in a short sheet with independent groups | Reuse compact choice rows and contextual sheets rather than vertically stacked unrelated buttons |
| `designexamples/Screenshot_20261106_022834.png` | Visual appearance previews and grouped preferences | Settings gets appearance preview choices and clearly separated data/native-icon actions |
| `designexamples/Screenshot_20261106_023027.png` | Time entry as a focused bottom-sheet task, with a useful empty explanation | Resources/time/cost controls become a focused flow rather than an initial form wall |
| `designexamples/Screenshot_20261106_023157.png` | A small contextual menu attached to the work view | Utility action groups receive named overflow/context actions; no per-button menu sprawl |
| `designexamples/Screenshot_20261106_023307_Jira.jpg` | Inline calendar paired with a finished empty schedule | Scheduling/date controls use clear calendar/date hierarchy without adding unsupported scheduling features |
| `designexamples/Screenshot_20261106_023423_Jira.png` | Settings grouped into readable list sections with inline state | More, settings, backup and tool setup become readable groups, with destructive controls separated |
| `designexamples/84e6f3af-8799-4a31-9933-173aaeeea63c.jpeg` | Quiet chart ribbon, precise task geometry and a dominant work canvas | Retain functional Gantt interaction; reduce competing controls, refine bar metadata and date navigation |
| `designexamples/1c0046b7-9f06-4472-91e6-7f8326efdec5.jpeg` | People as compact records, summary separated from the work directory | Resources/contributor records and portfolios use relevant summaries, not identical dashboard panels |
| `designexamples/Skillset - Course Dashboard.jpeg` | Light surfaces, aligned numeric data and useful chart hierarchy | Reports/costs get distinct financial/data composition; no copied illustration or fake measurements |
| `designexamples/Холст (3).jpeg` | Printed deep teal `#021D24`, `#042933`, blue `#216A85`, pale `#C7E5F2` | Aqua surface family; canvas/elevated/selection roles, legible light treatment |
| `designexamples/Холст (4).jpeg` | Printed pine `#06241A`, `#0A4430`, green `#159C6B`, mint `#DEF6EB` | Mint family; semantic success remains distinct from selected accent |
| `designexamples/Холст (7).jpeg` | Printed slate `#12141F`, `#232739`, periwinkle `#7B81A8`, pale `#E4E6F0` | Indigo family; calm nested surfaces and elevated controls |
| `designexamples/Холст (1).jpeg` | Printed plum `#250A33`, violet `#9838CE`, pale `#F3E4FB` | Violet family; selected state and softly colored secondary surfaces |
| `designexamples/Холст.jpeg` | Printed earth gold `#5A4A0D`, `#CC961F`, pale `#FFF3D8` | Amber family; dark button ink/contrast-correct small text |
| `designexamples/Холст (8).jpeg` | Printed slate `#1E293B`, muted rose `#C8A99D`, pale `#F2E6D6` | Warm Orange/Coral neutral relationships, with semantic accents kept clear |
| `designexamples/Цветовая палитра для сайта.jpeg` | Printed teal `#001722`, `#0D2B36`, `#1F5E63`, mint `#CEFEF1` | Shared deep-surface and cool feedback/art roles; use contrast-adjusted derivatives |
| `designexamples/Color Palette _ Grey _ Black _ Orange _ Blue.jpeg` | Printed navy `#14213D`, orange `#FCA311`, white/grey | Orange family and deliberate dark/bright relationship; keep AMOLED black |
| `designexamples/Color plate _  color combination for logo design.jpeg` | Burgundy/rose/pale pink; some printed labels visibly inconsistent | Pink/Coral richness; mark chosen derivative values as designed/approximated, not sampled |

Remaining viewed palette families (contact-sheet level): muted taupe, plum/cream, sunset, pine/earth, lime/fern, lagoon, teal, ruby, amethyst and sage. Final token documentation must name which images influence each of all ten retained accent IDs, and distinguish printed HEX from designed contrast-adjusted derivatives.

## New experience: Work in focus

A work-management studio organized around **orientation → current work → one next action → contextual power**. Retain the Board mark and product truth, replace old compositions. Mobile gets a compact named header, a stable dock, a create launcher and task-specific sheets. Each screen has its own data composition. Desktop opens the same tasks into useful columns and a secondary information region, not stretched phone forms.

Typography: one system sans; proposed roles 28/24 page, 18 section, 15 body/action, 13 supporting, 11–12 metadata; tabular numerals. Spacing follows a 4px rhythm. Card geometry follows containment rather than using the same radius everywhere. Touch targets 44–48px. Palettes provide canvas/surface/elevated/selection tones and restrained semantic highlights; no decorative gradients or copied art.

Motion: immediate press feedback; short opacity/translation reveal near 180–220ms for sheets/menus, shorter exit; existing continuous gesture tracking remains direct. Respect reduce motion. No page-load choreography, looping illustrations or startup blocking.

## Execution sequence and exit gates

| Phase | Implementation | Required evidence |
| --- | --- | --- |
| 0 — Boundaries/references/plan | Existing independent Git `work` verified; no external symlinks in edited paths; parent hash baseline; read report; view all references; write this plan | Complete before app code changes |
| 1 — Android reliability | Map native activation/update/finalize through zoom commit/layout; inspect installed RNGH/Reanimated APIs and remaining render reads; implement native-specific finite geometry/atomic handoff/lifecycle safeguards without disabling pinch or rewriting working web | Narrow gesture/math/commit regressions; suspected vs proven cause separated; device validation explicitly pending |
| 2 — System and interaction primitives | Palette-driven semantic tokens; buttons/fields/choices; compact action grouping, contextual menu and filter sheets; native/web reveal motion; original vector empty states; consistent confirmation and feedback | Palette contrast checks, component/control callbacks, source syntax; no new dependencies |
| 3 — Navigation and work | Compact header + dock/creation, actual Overview composition, Kanban cards/actions, task list/filter/detail flows, precise Timeline tools, sprint planning | Light portrait/desktop screenshots and preservation of every route/action |
| 4 — Delivery and utility workflows | Releases, Testing, Scheduling, Resources/time, Costs, Automations, Collaboration, Specifications, Reports, Activity | Distinct screen introductions/content/primary actions; secondary operations grouped, no missing utility workflows |
| 5 — Governance/preferences/recovery | Project overview/detail/docs/risks/WBS/budget, portfolios/programs editors, More/tool management, Settings/appearance, backup/import/recovery, project/workspace creation/switching | Explicit coverage matrix for all sub-screens and modals; destructive/save failure paths preserved |
| 6 — Focused validation/handoff | Focused existing tests and new invariant checks; JSX/worklet checks; conservative Chromium portrait/desktop captures; final parent hash comparison; eight-part handoff and documented tokens | No full heavy suite, APK/Gradle/EAS/Playwright/device automation; honest runtime limits; no copy-back |

## Screen/sub-screen composition map

| Surface / sub-screens | Main path and redesign decision | Primary files |
| --- | --- | --- |
| Overview / attention / upcoming | Current-work introduction, actionable attention list and compact project context; deeper summaries follow | `screens/overview/Overview.js`, `today.cjs` (rules retained) |
| Board / tools / board-list management / card edit | Current board + focused filters; task-led cards and contextual list/card utilities | `screens/board/Board.js`, `BoardManagement.js` |
| Timeline / parents / unscheduled / dependency removal | Chart first, small requested corner magnifiers, density/date controls; purposeful empty/scheduling flow | `screens/timeline/Timeline.js`, gestures/timeline selectors |
| Tasks / filters / due soon / task creation / detail / advanced fields | Clear list/search/filter hierarchy; task details organize essentials, delivery, relationships and uncommon operations | `screens/tasks/Tasks.js`, `TaskSheet.js`, `TaskFields.js`, `DueSoon.js` |
| Sprints / plan/edit/start/finish/delete / backlog | Planning summary, active sprint work and frozen-history context; focused lifecycle confirmation | `screens/delivery/Delivery.js` |
| Releases / edit/checkpoint / Testing / evidence | Delivery status leads; create/edit and evidence gathered in coherent panels/sheets | `screens/delivery/Delivery.js` |
| Scheduling / dependency/calendar tools | Schedule status and next action lead; advanced options progressively disclosed | `screens/management/Management.js` |
| Resources / contributors / log time / time entries | Contributor directory and capacity before focused management/time-entry flow | `screens/workspace/Workspace.js` |
| Costs / budget | Financial summary, comparison and one budget-edit path | `screens/workspace/Workspace.js` |
| Automations / rule editor / due/aging checks | Readable commands; create/edit flow separate from run/check utilities | `screens/workspace/Workspace.js` |
| Collaboration / comments / reminders | Conversation/reminder content first, focused composer; truthful local-only context | `screens/management/Management.js` |
| Specifications / task configuration / custom fields / workflow | Navigable document/configuration groups, contextual editors, clear empty setups | `screens/management/Management.js` |
| Reports / Activity | Distinct report summaries and chronological event presentation; exports contextual | `screens/workspace/Workspace.js` |
| Projects / create / detail / governance overview | Project records with deliberate health/progress; project detail navigates work/governance groups | `screens/governance/Projects.js`, `CreateProjectSheet.js` |
| Governance documents / finance / stakeholders / budget / risks / WBS outline+diagram | Purpose-specific document headers, useful context and grouped record operations; WBS operations become contextual | `screens/governance/pm/PmDocs.js`, `PmRisks.js`, `PmWbs.js`, `pmui.js` |
| Portfolios / Programs / create/edit/membership/benefits | Clear hierarchy and purpose-built illustrated empty states; compact membership/editor flows | `screens/governance/Portfolios.js`, `Programs.js` |
| More / project tools / workspace/project switching and creation | Grouped destinations and a coherent tool directory; preserve feature reachability | `screens/more/*`, `components/shell/Menus.js`, `CreateMore.js` |
| Settings / appearance / icon application / diagnostics | Visual theme choices, compact preference rows, safe explicit native icon operation, data tools grouped | `screens/workspace/Workspace.js`, `ui/theme/*`, diagnostics |
| Backup / export/import / snapshots / archived recovery / workspace recovery | Clear protect/transfer/recover structure, guided destructive confirmation and honest failure states | `screens/workspace/Backup.js` |
| Shared modal/menu/confirmation/notice/loading | Consistent anatomy, primary/secondary CTA order, keyboard/safe-area handling and reduced-motion reveals | `ui/uiLayout.js`, `uiControls.js`, `components/inline/*`, `components/notice/*` |

## Validation and rollback boundaries

Use only installed tooling; no package reinstalls. Native approval is explicitly pending the owner's Expo Go/APK pinch stress test, strict-warning review and theme/background checks. Preserve excellent web gestures. Compare parent hashes at handoff. Rollback is leaving or selectively reverting this candidate only; no parent integration, migration, uninstall or storage clearing. Keep version 0.6.3 synchronized and one cumulative changelog inside this copy.

## Revised direction — user correction, 6 November

The user rejected the first implementation as a reskin and decluttering exercise. That implementation is **not visually accepted**. The user independently confirmed pinch-to-zoom now works; preserve that repair. No further gesture rewrite is justified by the design correction.

**Replacement contract:** Premium neutral dark/AMOLED workspace. Accent choice affects controls and chart series, never the page background. Keep Daylight/System compatibility, but design and review the dark experience first. Replace the dashboard composition, containers, charts, navigation/control anatomy and empty-state presentation. No repeated old Stat/Card/Bar dashboard grid under new colors.

**Thesis:** Project state becomes understandable through a dominant visual work summary and a distinct agenda, with the actual work one tap away.
**Own world:** near-black canvas, graphite planes, off-white type, narrow rules, compact pill controls; one personal accent and disciplined chart colors. Original geometric SVG art, not competitor assets.
**Story:** see workload and schedule; inspect an interactive status or date; act on a task; review evidence.
**First viewport:** project heading; a large status orbit paired with numeric legend; a seven-day schedule chart with a date inspector; a separate chronological work agenda. Desktop uses an asymmetric analytical canvas and right work rail; phone uses an intentional chart-first composition.
**Form:** user-pinned dark analytical product direction; `seed: none (user references)`. Main references revisited full-size: `Home _ X.jpeg`, `Figma Resources Component -.jpeg`, `Discover Creative CRM panel.jpeg`, `19470563-550c-483f-a10d-a7240768097b.jpeg`. Chart gradients, where used, are data shading only, never background decoration/glow. Implement original charts from local data with accessible text alternatives; no fabricated historical activity.
**Finish:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

User-reported native verification: pinch fixed in their test; exact device/build context was not supplied, so do not expand this into independent Expo Go/APK or zero-warning certification.

Further correction: `Home _ X.jpeg` and its duplicate are explicitly excluded as design authorities. New governing mix: `original-51086c4f8f759a6a782920c19f2b4849.png` (interactive date rail plus analytical canvas/work rail), `b11175bd-0e8d-4b03-bfd0-5c25f152e5ce.jpeg` (distinct project/task/calendar regions), `Trade Crypto_ Your Secure Gateway.jpeg` (asymmetric content hierarchy and inset data surfaces), `Discover Creative CRM panel.jpeg` (dominant chart, secondary work table), `Figma Resources Component -.jpeg` (data shading/segmentation only), plus the already reviewed ClickUp/Asana/monday/Jira workflows. User explicitly requests abundant purposeful animation and permits compatible Expo packages when needed. Installed Reanimated 4.7.1/RNGH 3.3 already supply the required tools; no new package is necessary for the current motion implementation.


## Final implemented contract (supersedes prior visual sketches)

THESIS: A neutral dark work studio with a date-focused agenda and an analytical canvas; no inherited metric-card dashboard repainted with palette backgrounds.
OWN-WORLD: black/graphite planes, off-white capsule actions, original geometric art, bounded data graphics and a restrained personal accent. AMOLED is true black; saved Daylight/System remain compatible.
STORY: orient by project/date, inspect actual workload, focus a task, plan dates and verify delivery.
FIRST VIEWPORT: compact project heading, navigable seven-day rail, inspectable workload columns/weighted progress, then a distinct task agenda. Desktop pairs the analytical region with a right work rail. Scheduling and date fields expand real month/range calendars inline.
FORM: user-pinned mixture of statistics/work rails, asymmetric finance/product surfaces and the supplied mobile workflows; `seed: none (user references)`. Home _ X and its duplicate are excluded. New Kanban lift/tilt/reflow and bounded chart/control/calendar/count/reveal motion serve the explicit animation preference.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
