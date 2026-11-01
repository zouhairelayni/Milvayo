# CHG-NP-0.5.9 — Governance migration, source handoff

## Baseline and scope
- Based on Niyarvo Projects **v0.5.8** source, preserving working Web scrolling / navigation, task and Timeline business logic.
- Current deliverable: **v0.5.9 source-level QA candidate**. **Expo Go (Android/iOS), Expo Web runtime: Not run** in the build environment.
- `package.json`, `package-lock.json`, `node_modules`: **intentionally excluded** (preserve user's Termux dependencies, including fixed `expo-font`).

## Source changes
- New professional **Governance** drawer group with separate **Projects → Portfolios → Programs** pages (separate source files), linked to the **existing one canonical workspace store**.
- New project-governance fields: health, PMI process group, sponsor, manager, customer, objective, date range. Normalized and persisted with each existing project.
- Ten editable governance documents: business case, charter, stakeholders, scope, WBS, budget, risks, communications plan, change log, lessons learned; each supports status and a progress metric.
- Business-case cost-benefit NPV, ROI and simple payback; no external financial data or undisclosed assumptions. Template headings are original interpretations, not certified PMI templates.
- Stakeholder power/interest quadrants; probability × impact 5×5 risk matrices (threats and opportunities), scored risk register and response plan.
- WBS outline with add/reorder/indent/outdent/owners/hours/notes, deliverable/PMI phase starters, tree/fishbone/mind-map SVG diagrams; CSV and SVG exports through existing file support.
- Budget uses **legacy leaf-task estimated labour costs and actual logged labour** from `operations.costSummary`, plus separate non-labour cost lines, contingency and approved amount.
- Programs: exclusive portfolio and project membership on save; benefit registers, roadmap and Today marker, health/progress/spend/risk roll-ups. Portfolios have editable metadata and real-project roll-ups.
- **No automated demo seeding**. Three sample projects live solely in `examples/atlasproject.json` alongside the existing Atlas project (workspace-format fixture). Its import **replaces the current workspace** after confirmation; back up user data first.
- **Timeline nav icon** rotated 90° in BOTH hamburger and bottom navigation, *not* the actual Timeline canvas. Gantt chart untouched.
- Existing workspace backup/snapshot pipeline retains governance data, programs and portfolio links. Previous source-level web drag/scroll fixes preserved.
- Obsolete tests targeting old combined Entreprise PM screen adjusted to validate new Governance hierarchy.

## Verification
- `node --test tests/*.test.cjs`: **414 passed / 0 failed**.
- JS/JSX parse scan: **134 modules / 0 errors**.
- Atlas workspace sample import and cross-program collision checks: pass.
- Archive ZIP integrity: verified at packaging.
- **Not verified**: Expo Go runtime UI, iOS simulator, web-browser interactions, actual device rendering and animations, exact PMI compliance, or financial accounting suitability.

## Risks / follow-up QA
- Ten long governance documents can be memory-intensive; exercise expansion and scroll especially on Android.
- Test rapid input changes and backing out of Projects, Programs, Portfolios; confirm persistence on reopening and app relaunch.
- Confirm WBS SVG file export and gesture/scroll interplay on web and phone.
- Workspaces with legacy duplicate project membership across programs remain readable; new writes enforce exclusivity. Repair any legacy conflicts manually.
