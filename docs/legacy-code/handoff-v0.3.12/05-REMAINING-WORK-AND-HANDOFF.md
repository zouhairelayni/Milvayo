# Niyarvo Projects — remaining work, prioritized roadmap, next-model handoff

**Baseline:** `v0.3.12` full-source ZIP, derived from user-accepted `v0.3.11-HOTFIX2`; `npm test` **297 passed** on extracted source. **No Git SHA was supplied and v0.3.12 has not yet been user-accepted on Android/Web.** Plan is explicitly *proposed future work*, not present features. Do not implement cloud wiring in an unrelated product.

## 0. Immediate acceptance before new features — HIGH priority

### NP-QA-0312: Kanban interaction and regression gate

**Why:** The new Kan-derived UI adds small ellipsis targets and card filters to an established long-press PanResponder. Prior bugs affected Android native performance, task drawer text and both-platform navigation. Source-level tests alone don't protect gestures.

**Acceptance checklist:**

- Android Expo Go and Web: tap card opens editor; ellipsis opens contextual actions without triggering drag; ~340ms hold moves card; release updates correct status/lane; horizontal edge auto-scroll and filtered reordering work; hidden cards retain order.
- Empty, 1-card, short-column, and 36+ card scenarios; independent lane heights and Show more work; long labels and touch targets remain legible.
- Create 2nd board, move card from Main, switch board, remove secondary board, ensure tasks rehome to Main and no status/sprint/links/evidence changed unexpectedly.
- Duplicate a card; verify new unique ID, Backlog, unverified/unmerged, no false passing tests/Git merge/active sprint assignment.
- Enable GitHub, due/calendar, aging/checklist Power-Ups per board, refresh public issue/PR (network allowed) and ensure failure does not lose stored data; disabled behavior graceful.
- Open Atlas (73 tasks), inspect Gantt scroll/zoom/links and Sprints burndown; use app for a longer session, record memory/performance if possible. If Expo Go exits silently, gather `adb logcat` via available device tools or build crash report; Metro log alone is insufficient.
- Use lower sidebar links, Web logo, Android Back, Web Escape, alternate accent, save/restart. Export/import workspace and compare counts/hashes/metadata on round trip.

**Definition of done:** User confirms Android and Web interactions, no critical regressions, relevant screenshots/logs archived in `CHG-NP-[VERSION].md`, and commits/pushes `work`. `main` merge only after explicit authorization/acceptance. Do not claim accepted v0.3.12 before this gate.

## 1. Near-term code/model hygiene — HIGH priority

| ID | Proposed improvement | Why / source evidence | Minimum tests & done condition |
|---|---|---|---|
| NP-SCHEMA-V1 | Expand `schemas/niyarvo.project.v1.schema.json` to document root `sprints`, `kanbanViews`, `taskTypes`, `customFields`, `workflow`, task `boardId/sprintId/taskTypeId/customValues` and other current fields. | Audit finds fields present in `model.cjs` but absent in schema documentation. | Schema validator round-trips Atlas export and an old v0.1 fixture; no field stripping; import discriminator remains `niyarvo.project.v1`. |
| NP-README | Correct stale top `README.md` heading `v0.3.11` in v0.3.12 archive; provide concise active documentation index rather than stacked historical notes; retain original release changelogs. | README top is stale while package is `0.3.12`. | Version/index contract test. |
| NP-INVARIANTS | Audit *all* status-changing code paths (including `model.verifyTask`, bulk, card buttons and advanced automation) for consistent transition, dependency, sprint and release rules. | `verifyTask(t)` currently sets `status:'Done'` on task object; caller guards may not cover future programmatic invocations. | Negative tests: forbidden transitions, incomplete predecessors, bypass via verification/bulk/automation; consistent authoritative mutation API. Do not accidentally break existing acceptance workflow. |
| NP-PERSIST | Harden local state autosave and recovery for rapid typing, app suspension, writes near data cap; preserve mutation order and no overwrite on invalid startup. | `App.js` saves serialized complete workspace on changes and uses AsyncStorage; user reported slowdown for Atlas. | 1000-task synthetic tests and real Android profiling; interruption/restart recovery; no lost edits; avoid excessive re-renders and huge backups. |
| NP-UI-SPLIT | Extract monolithic `App.js` by feature with stable state interfaces after capturing screen-level regression tests; adopt memoized/virtualized lists where validated. | App.js ~115 KB with multiple interdependent screen render branches. | Screens and gestures unchanged; no raw text; no platform-svg regressions; stress on phone. |
| NP-GANTT-CPU | Profile viewport Gantt, clamp overscan and dependency-path rendering; enhance native animation/gesture handling if needed. | HOTFIX3 reduced SVG allocation, but no native heap/GPU trace. | Atlas plus larger fixtures; no crash, responsive scroll, correct pointer hit tests under zoom. |
| NP-GH-URL | Validate GitHub URL parsing and preview metadata against redirects, timeouts, rate limits and public read-only boundaries. | Public GitHub Power-Up fetches on demand. | Malformed/untrusted URL tests; offline/404/403/429 tests; no token leakage, no writes. |
| NP-DATA-QA | Add integration-level screen tests (React Native Testing Library if compatible), import/export round-trip, UI smoke harness and CI for PRs. | Existing tests are pure Node tests and source contracts; no screenshot automation. | Android/Web smoke and CI runner with retained artifacts; record real environment. |

## 2. Kanban and automation next stage — MEDIUM priority, separate release

Study `kanban.zip` further for product/design concepts **without copying source/assets**; compare Kan's cards, list settings, user filters, subtasks/checklists, keyboard shortcuts, quick edit, board ordering, saved board views and organization. Work from the verified **v0.3.12 code**, not an older source snapshot.

**Possible NP-KAN2 features:** per-board named swimlanes/grouping, WIP limits, reorder board selector, card cover/previews (safe media source), keyboard navigation, richer checklist editing, multi-select board operations, full-text search, saved per-board filters and undo for quick card changes. **Custom arbitrary workflow columns** require a larger migration because current `model.STATUSES`, transition rules, automations, status metrics and sprint completion all assume Backlog/In progress/Validation/Done; do not simply add a new label to the UI.

**Automation evolution:** rule builder with conditional clauses, scope/execution preview, undo/recovery, de-duplication across legacy/advanced rules, action logs with clear failures, explicit manual due checks. Don't promise scheduled background execution before a trusted worker. Avoid recursion (automation triggering another automation indefinitely), and cap runs/actions. Any automation changing dates, stage, labels, assignee or progress must invalidate stale evidence and preserve sprint history consistently.

**Power-Ups architecture:** current entries are built-ins (`src/powerUps.cjs`), no third-party SDK or sandbox. Before loading arbitrary extensions, define a versioned manifest, permissions/consent, safe UI extension points, data limits, stable capability APIs, and Web/native isolation. Do not evaluate untrusted JS inside the current app.

## 3. Enterprise-grade local PM workflows — MEDIUM priority

| Workstream | Missing or partial compared with future product goals |
|---|---|
| Project planning | Baselines, schedule snapshots and variance charts; constraints/resource leveling; typed-dependency critical path with working calendars; workload timeline; undo/redo and richer dependency visualization. |
| Agile | Story points, configurable completion definitions, velocity forecasts, sprint retrospectives, capacity-aware sprint planning and burnup; recording historical events with reliable actor/time data. |
| Portfolios | Portfolio dashboard trend lines, cross-project task queries, program milestones, project templates beyond clone, RAG status annotations with explanations. |
| People/Resources | Resource availability calendars, teams, per-role/skill planning, booked vs available utilization per week, workload assignments, time approval. |
| Finance | Expense categories, nonlabor cost, budgets by work package, forecast at completion, change-control audit, currency conversion policy if needed. |
| Collaboration | Actual multiuser authorship, comments threading, mentions, assignments, audit, secure file attachments and notifications. Current comments/reminders are local records. |
| Documents | Structured project knowledge, file versioning, attachment preview, export bundle, shareable reports/print/PDF if requested. |
| Quality/governance | Approval workflows, immutable-ish server audit, role-based release gates, Git-backed verification evidence, actual test-result integrations. |
| Accessibility | Screen-reader traversal, keyboard shortcuts, reduced motion, contrast under all ten accent colors, large-text and landscape QA. |

Prioritize only after v0.3.12 local QA and user selection; do **not** implement every OpenProject module blindly.

## 4. Firebase and multiuser architecture — HIGH security gate, future milestone

**Current code:** no Firebase SDK initializers or Auth, deny-all Firestore and Storage rules, hosting-only scaffold. Proposed Firebase project display/name `niyarvoprojects`; confirm its **actual project ID** before connecting. Android package `com.niyarvo.projects` and corresponding iOS identifier are present; production signing/provisioning needs separate validation. **Never connect to RIVNA or Niyarvo Control Center.**

### NP-FIREBASE1 — authentication and rules (before data sync)

1. Explicit app config and environment separation (`dev`, staging, production), no secrets or API tokens in client repository. Firebase Web config IDs are not secrets, but rules are the real access boundary.
2. Firebase Authentication (supported methods selected by user), secure session storage, verification, account-switching/reauth flows and deletion/export rights.
3. Design Firestore documents for workspace/project/task/sprint/board/automation with authenticated ownership/team role and immutable server-side workspace IDs; **no public allow-all**. Write Firestore Security Rules first and run Emulator Suite negative/positive tests for cross-user access, ownership changes, oversized writes and field constraints.
4. Migration strategy for existing local `niyarvo.project.v1` exports: versioned migrations, idempotency, conflict policies and **explicit user confirmation before uploading** local projects.
5. Preserve local-first performance with offline queue, mutation IDs, revisions/ETags, incremental sync and conflict resolution, deterministic merges for comments/activity, server-authoritative mutations where necessary.
6. Incident logging, budgets/quotas, rate limits, App Check when appropriate; consent/privacy policy. Release behind feature flag and maintain a full export/rollback path.

### NP-FIREBASE2 — private attachments, presence and automation

- Firebase Storage owner-scoped rules with type/size restrictions; validate actual uploads in backend where necessary; no unrestricted URI proxying or serving attacker-provided HTML.
- Cloud Functions / scheduled tasks for unattended due reminders and notifications, authenticated authorization on every task, idempotency keys, bounded retries and cost monitoring.
- Realtime collaboration with membership roles and presence, audit attribution, invite flow and notification preferences; do not treat the current local comments as synchronized accounts.

### NP-GITHUB1 — secure GitHub Power-Up integration

- GitHub App/OAuth with least privilege, state/PKCE where applicable, expiring credentials and server-side encrypted token handling. Do not place tokens in exported project JSON or in a public Expo bundle.
- Per-workspace repo allowlist and explicit user consent; read-only sync of issues/PR status first, then optional gated writes.
- Verify webhook signatures server-side, deduplicate events, map remote IDs to local task refs, handle deleted repositories/permission loss/rate limits.
- Never auto-mark task verified/merged solely because a PR reports merged; preserve release evidence gate.

## 5. Engineering/deployment/testing gates

**Minimum recurring release tests:** `npm test`, CommonJS `node --check`, JSX parsing/bundling, `npx expo install --check`, Web Metro smoke, Android Expo Go device smoke, import/export in both environments, recovery snapshots, gesture/navigation checks, Atlas Gantt and Sprint, dependency/schedule audit, accessible controls, and a bug reproduction. For all Web/native tests in delivery reports use **Pass**, **Fail**, or **Not run**, not general claims.

**Git policy (user-controlled):** preserve uncommitted changes, develop/test on `work`, checkpoint after user acceptance, push `work`, only merge to `main` after accepted; include exact `git rev-parse HEAD` for handoff when known, not a guessed commit. No automatic APK builds or remote deployment by the assistant without explicit request and actual tools.

## 6. Prioritized next batches (proposal, not pre-approved features)

1. **v0.3.12-QA1** — fix any user-observed Android/Web regression in v0.3.12, especially ellipsis/drag/filter interplay and Gantt crash or load issues.
2. **v0.3.13** — schema, README, data invariants and persistence hardening; targeted negative tests; optional React component tests. Keep app format stable.
3. **v0.3.14** — Kanban next-phase UX after explicit owner selection, saved board views/WIP limits/keyboard accessibility; preserve Trello-style automations.
4. **v0.3.15** — advanced local QA/performance, Gantt & list virtualization where measured; comprehensive Android screenshot/testing workflow.
5. **v0.4.x** — only once owner elects server integration: separate Firebase Auth/rules/sync design and first staging integration. Do not mix into v0.3 patch casually.
6. **v0.5.x+** — optional GitHub OAuth and audited webhook sync, collaboration, notifications, real attachments; release gates and quotas.

Version labels are suggestions; adjust to owner priorities and existing Git checkpoints. No time/cost estimate is implied.

## 7. Exact next-model handoff contract

### READ FIRST — 60 seconds

| Field | Required value |
|---|---|
| Product | **Niyarvo Projects**, separate from RIVNA and Niyarvo Control Center |
| Latest source | `NiyarvoProjects-v0.3.12-LOCAL-QA.zip` or annotated full source with these docs |
| Last user-confirmed runtime baseline | v0.3.11-HOTFIX2: navigation and logo operate on Web and Android |
| Current candidate | v0.3.12, Kan-derived board UI, **runtime acceptance pending** |
| Most recent observed source tests | 297/297 `npm test`, extracted source, 2026-10-31 |
| Git branch / SHA | User's `work` branch; **SHA unknown** until user supplies it |
| Local data | `niyarvo-projects-v1`; accent `niyarvo-projects-accent-v1`; project format `niyarvo.project.v1` |
| Firebase | Not connected; Firestore/Storage deny-all placeholders |
| First action | Read `AGENTS.md`, Unslop skill, current `CHG-NP-0.3.12.md`, and all documents in this pack |
| Active risks | Android Gantt under large load; v0.3.12 card touch interactions; incomplete JSON Schema; status verification path invariants; React monolith; future sync design |

### Copy/paste into a new model conversation

> You are continuing the **independent Niyarvo Projects** Expo React Native/Web app. Read the full source ZIP at project root and `00-START-HERE.md`, `01-RELEASE-HISTORY.md`, `02-ARCHITECTURE.md`, `03-FUNCTIONALITY-MAP.md`, `04-HOW-TO-USE.md`, `05-REMAINING-WORK-AND-HANDOFF.md`, `06-AUDIT-AND-TRACEABILITY.md`, `AGENTS.md`, `.opencode/skills/unslop/SKILL.md`, `CHG-NP-0.3.12.md` and its QA record. Do not mix this product with RIVNA or Niyarvo Control Center. Baseline source is v0.3.12, unit tests 297/297, but v0.3.12 runtime QA is not yet accepted; user confirmed v0.3.11-HOTFIX2 works on Web and Android. Preserve local `niyarvo.project.v1` imports, AsyncStorage, snapshot recovery, full-card Kanban dragging, Gantt viewport windowing, sprint recorded history, release evidence gates, Board Power-Ups, per-project configuration and theme. Start by confirming current Git `work` SHA and observed UI errors from user, then implement only requested batch. Tests must report actual Pass/Fail/Not run. Deliver full project-root ZIP, changes-only patch if appropriate, versioned changelog both standalone and in ZIP, QA and Unslop notes; never claim to have pushed/merged/deployed or run physical QA when you have not. Firebase backend is unconnected with deny-all rules; no cloud or GitHub OAuth claims.

### Release handoff checklist for every next change

- [ ] Exact base ZIP and user Git commit hash (or “unknown”)
- [ ] User-reported bug reproduction and screenshots/logs
- [ ] Complete files changed, additions, removals and data migration statement
- [ ] Preserved APIs/schema/AsyncStorage keys and why
- [ ] Unit/smoke/Metro/Expo Go/Web/iOS tests with honest statuses
- [ ] Known defects, security/cost risks, rollback/export and intended QA
- [ ] Separate `CHG-NP-[VERSION].md` at ZIP root plus standalone
- [ ] Full project-root ZIP without enclosing folder, tests and docs
- [ ] User-controlled `work` checkpoint; do not merge or deploy automatically
