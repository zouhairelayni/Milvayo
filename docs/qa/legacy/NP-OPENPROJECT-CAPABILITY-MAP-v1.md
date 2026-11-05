# Milvayo — OpenProject Capability and Business-Logic Map

**Reference:** user-supplied `openproject-17.9.6.zip` source archive (fixed version).
**Target:** Milvayo v0.2.8 baseline; first expansion implemented in v0.2.9.
**Method:** path-level inventory of backend models, services, modules and relevant frontend/server components, cross-referenced against Niyarvo project code. **No OpenProject implementation code was copied.**
**Coverage:** broad capability map, not a line-by-line proof of every feature, configuration, enterprise entitlement, or runtime behavior. Code presence confirms an implementation area exists; availability can depend on configuration, edition, integrations or deployment environment.

## Architecture observations from the supplied source

- OpenProject is a Rails-style server application with domain models, services, contracts, API, background workers and modules; frontend components are separate. Niyarvo is an Expo/React Native local-first application with a small pure-JavaScript domain engine.
- Work packages, relations, saved queries, custom fields and workflow services are central. Gantt/boards/backlogs/meeting/resource management are separate modules that operate on shared domain entities.
- Authorization and membership are server-side responsibilities in OpenProject. Niyarvo must not treat a client-side role selector as security; authenticated cloud actions will require Firestore rules/server-side checks in a later independent Firebase phase.
- The OpenProject source's GPL-3.0 notices are retained in its archive. We study capabilities and rules, then create independent implementations with our own structure, types, tests and UI. This audit cites paths only.

## Module coverage (all 30 top-level OpenProject modules)

| Module | Source entries (files + directories) |
|---|---:|
| `auth_plugins` | 32 |
| `auth_saml` | 213 |
| `avatars` | 202 |
| `backlogs` | 752 |
| `bim` | 650 |
| `boards` | 316 |
| `budgets` | 311 |
| `calendar` | 202 |
| `costs` | 659 |
| `documents` | 415 |
| `gantt` | 166 |
| `github_integration` | 319 |
| `gitlab_integration` | 301 |
| `grids` | 313 |
| `job_status` | 116 |
| `ldap_departments` | 163 |
| `ldap_groups` | 153 |
| `meeting` | 1080 |
| `my_page` | 179 |
| `openid_connect` | 253 |
| `overviews` | 242 |
| `recaptcha` | 99 |
| `reporting` | 375 |
| `resource_management` | 511 |
| `storages` | 1230 |
| `team_planner` | 210 |
| `two_factor_authentication` | 274 |
| `webhooks` | 178 |
| `wikis` | 666 |
| `xls_export` | 105 |

> Counts are ZIP members under `modules/<name>/`, including documentation, tests, assets and directories; not feature counts.

## Functional/business-logic matrix

### Portfolio & project

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Project lifecycle | Metadata, subprojects, modules and configurable project settings | `app/models/project.rb` | Partial | P1 |
| Portfolios | Portfolio-level project aggregation and summaries | `app/components/portfolios/index_component.rb` | Missing | P2 |
| Project phases | Phase definitions, activation and rescheduling | `app/services/project_phases/reschedule_service.rb` | Partial | P1 |
| Project queries | Reusable project filters, shared queries | `app/services/project_queries/create_service.rb` | Missing | P2 |
| Project dashboards | Configurable overview widgets and grids | `modules/overviews/app/components/overviews/dashboard_component.rb` | Partial | P2 |
| Project copying | Copy linked content with constraints | `app/services/projects/copy_service.rb` | Missing | P2 |
| Project status/health | Health and lifecycle status | `app/components/health_reports/report_component.rb` | Missing | P2 |
### Work packages

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Task/work package properties | Types, priority, assignment, estimates and dates | `app/models/work_package.rb` | Partial | P0 |
| Task hierarchy | Ancestors, children, parent constraints | `app/models/work_package/ancestors.rb` | Partial | P0 |
| Progress / completion | Done-ratio semantics and task effort | `app/models/custom_actions/actions/done_ratio.rb` | Partial → v0.2.9 | P0 |
| Task relation graph | Blocking, predecessors, relationships | `app/models/relation.rb` | Partial | P0 |
| Scheduling relation filters | Distinguish scheduling relations | `app/models/relations/scopes/used_for_scheduling_of.rb` | Partial | P1 |
| Saved work queries | Stored filters, sorting and groups | `app/models/queries/work_packages.rb` | Partial → v0.2.9 | P0 |
| Manual work order | Manually ordered work package views | `app/models/queries/work_packages/common/manual_sorting.rb` | Partial | P1 |
| Advanced filters | Hierarchy, owners, attachments and dates | `app/models/queries/work_packages/filter/ancestor_filter.rb` | Partial | P1 |
| Bulk changes | Batch update and validation | `app/services/work_packages/bulk/update_service.rb` | Partial | P1 |
| Bulk copy/move | Copy and move tasks across projects | `app/services/work_packages/bulk/move_service.rb` | Missing | P1 |
| Custom fields | Typed fields, validation and per-project field types | `app/services/custom_fields/create_service.rb` | Missing | P1 |
| Status transition workflows | Status matrices and allowed actions | `app/services/workflows/matrix_update_service.rb` | Missing | P1 |
| Custom actions | Reusable task actions with field restrictions | `app/services/custom_actions/update_work_package_service.rb` | Basic | P2 |
| Activity and history | Journal of edits and comments | `app/models/journal.rb` | Partial | P1 |
### Planning & agile

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Gantt charts | Timeline, date dependencies, visual schedules | `modules/gantt/app/controllers/gantt/gantt_controller.rb` | Advanced foundation | P0 |
| Calendar views | Date-oriented project work | `modules/calendar/config/routes.rb` | Missing | P1 |
| Kanban & boards | Configurable boards and filters | `modules/boards/app/models/boards/grid.rb` | Partial | P1 |
| Backlogs | Backlog prioritization and buckets | `modules/backlogs/app/models/backlog_bucket.rb` | Missing | P1 |
| Sprints | Iterations and completion workflows | `modules/backlogs/app/components/backlogs/finish_sprint_dialog_component.rb` | Missing | P1 |
| Burndown | Progress vs time reporting | `modules/backlogs/app/models/burndown.rb` | Missing | P2 |
| Team planner | Multi-person allocation visualization | `modules/team_planner/app/components/team_planner/overview/row_component.rb` | Missing | P2 |
| Releases / versions | Version lifecycle and progress | `app/services/versions/create_service.rb` | Partial | P1 |
### Capacity, time & costs

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Resource allocation | Assignment windows and working capacity | `modules/resource_management/app/models/resource_allocation.rb` | Missing | P2 |
| Optimal schedule planning | Compute fitting allocation schedules | `modules/resource_management/app/models/resource_allocations/optimal_schedule.rb` | Missing | P2 |
| User working hours | Availability calendars and hours | `app/services/user_working_hours/create_service.rb` | Missing | P2 |
| Time entry and accounting | Actual work log and time reporting | `modules/costs/app/models/cost_entry.rb` | Missing | P1 |
| Rate management | Hourly and cost rates | `modules/costs/app/models/cost_rate.rb` | Missing | P2 |
| Budgeting | Planned cost and spend reconciliation | `modules/budgets/app/models/budget.rb` | Missing | P2 |
| Cost reporting | Slice-and-dice cost queries | `modules/reporting/app/models/cost_query.rb` | Missing | P2 |
### Collaboration

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Comments & mentions | Task discussions and notification targets | `app/services/work_packages/activities_tab/comment_service.rb` | Missing | P1 |
| Notifications | Recipient settings and feed | `app/services/notifications/create_service.rb` | Missing | P1 |
| Reminders | Schedule and manage reminders | `app/services/reminders/create_service.rb` | Missing | P2 |
| Meetings | Meetings, agenda items and outcomes | `modules/meeting/app/models/meeting.rb` | Missing | P2 |
| Wikis | Project knowledge bases and pages | `modules/wikis/app/models/queries/wikis/wiki_pages/wiki_page_query.rb` | Missing | P2 |
| Documents | Document management and collaboration | `modules/documents/app/components/documents/list_component.rb` | Missing | P2 |
### Files & exports

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Attachments | Uploads, deletion and scanning services | `app/services/attachments/create_service.rb` | URL links only | P1 |
| File safety / antivirus | Malware scanning and quarantine | `app/services/attachments/clamav_service.rb` | Missing | P1 cloud |
| External storage | Linked storage and OAuth adapters | `modules/storages/app/models/queries/storages/file_links/file_link_query.rb` | Missing | P3 |
| CSV export | Data export with spreadsheet injection controls | `app/models/exports/concerns/csv_formula_sanitization.rb` | Missing | P1 |
| Spreadsheet export | XLS exports and formats | `modules/xls_export/app/models/xls_export/work_package/exporter/xls.rb` | Missing | P2 |
| PDF export | Work package/project exports | `app/models/exports/pdf/artefact/budgets.rb` | Missing | P2 |
### Security & governance

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| Project role membership | Role assignments and revocation | `app/services/members/add_role_service.rb` | Not enforced | Cloud prerequisite |
| Authorization | Permission checks and authorized scopes | `app/services/authorization/project_query.rb` | Not enforced | Cloud prerequisite |
| Resource sharing | Permissioned work package sharing | `app/services/shares/create_service.rb` | Missing | Cloud prerequisite |
| Local backups | Backup generation and governance | `app/services/backups/create_service.rb` | Local snapshots | P1 |
| Two-factor auth | TOTP and device verification | `modules/two_factor_authentication/app/components/two_factor_authentication/devices/totp_qr_code_component.rb` | Missing | Cloud prerequisite |
| OIDC sign-in | OpenID Connect provider integration | `modules/openid_connect/config/routes.rb` | Missing | P3 |
| SAML sign-in | Federated enterprise identity | `modules/auth_saml/config/routes.rb` | Missing | P3 |
| LDAP groups | Enterprise group mapping | `modules/ldap_groups/config/routes.rb` | Missing | P3 |
| Bot protection | CAPTCHA integration | `modules/recaptcha/config/routes.rb` | Missing | P3 |
### Integrations & API

| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |
|---|---|---|---|---|
| API endpoints | Public resource model and linked entities | `app/services/api/` | No remote API | Cloud prerequisite |
| GitHub integrations | Pull request/check/deploy data linking | `modules/github_integration/app/models/github_pull_request.rb` | Manual SHA only | P2 |
| GitLab integration | Merge requests and CI pipelines | `modules/gitlab_integration/app/models/gitlab_pipeline.rb` | Missing | P3 |
| Webhooks | Incoming/outgoing event delivery logs | `modules/webhooks/app/models/webhooks/log.rb` | Missing | P2 |
| MCP/automation tools | Tool boundaries and resource actions | `app/services/mcp_tools/create_work_package.rb` | Missing | P3 |
| BIM/BCF | Construction model issues and viewpoints | `modules/bim/app/models/bim/bcf/issue.rb` | Missing | Optional |

## Shared business-logic requirements before feature UI

1. **Identity and referential integrity.** Stable project/task IDs; no cycles in hierarchy or predecessor graph; deletions/moves reconcile relations and audit references.
2. **Transactional mutations.** Validate a whole command before changing the workspace; capture previous revision and a recovery snapshot for destructive or many-row operations; invalidate verification on affected tasks.
3. **Query behavior.** Saved filters and sort definitions are data, not UI state; validate, bound and preserve them in project export/import and backups.
4. **Scheduling.** Calendar days vs working days and FS/SS/FF/SF semantics are explicit; no silent cascade; previews check source revision.
5. **Progress.** Distinguish manually entered leaf progress, completed leaf tasks, calculated parent rollups and verified/merged evidence. A parent's percentage does not forcibly complete children.
6. **Permissions.** Client-side local checks are usability only. Before collaboration, enforce authorization on the trusted server, with owner/member scopes and least privilege.
7. **Attachments.** Store metadata and upload objects separately; validate type/size, authorize upload, scan/monitor where supported, restrict download, and use expiration for privileged URLs.
8. **Events and automations.** Model event envelopes with actor, event id, project, entity, before/after, and idempotency key; prevent recursive loops; use server-side scheduling for external actions.
9. **Reports.** Derive insights from canonical task/time/budget records; do not store inconsistent duplicate aggregates as the source of truth.
10. **Performance.** Define size budgets (projects, tasks, queries and revisions); indexed/virtualized lists and incremental graph computations as scale increases.

## Implementation batches — highest-value sequence

| Batch | Deliverable | Dependency / gate |
|---|---|---|
| **v0.2.9** | Derived progress and weighted hierarchy rollups; named task query views; project dashboard summary; JSON/backups | Implemented as local QA candidate; device testing pending |
| v0.3.0 | Rich work-package attributes, typed custom fields, validation; configurable task types and statuses | Import schema compatibility and mutation tests |
| v0.3.1 | Hierarchical Gantt groups, summary bars, parent date ranges, expand/collapse; date constraints | Existing scheduling and v0.2.9 hierarchy |
| v0.3.2 | Expanded workflow engine, allowed transitions, guarded bulk commands, automation event history | Local rules first; no fake security roles |
| v0.3.3 | Project phases, portfolio views, goals, milestones, project health & reusable templates | Project summary and status semantics |
| v0.3.4 | Scrum/Kanban configurability: backlogs, iterations, sprint goals, burndown and velocity | Task relationships and saved queries |
| v0.3.5 | Time tracking and estimates, resource capacity, availability, workload charts | Consistent effort units/calendars |
| v0.3.6 | Budgets, rate cards and reporting | Time and cost lineage |
| v0.3.7 | Comments, immutable local event history, notifications, reminder models, document metadata | Permission-aware future sync schema |
| v0.3.8 | CSV/PDF exports, project templates, import tools, shareable reports | Formula-injection protections, compatibility |
| Firebase phase | Dedicated `milvayo` auth + Firestore + Storage sync, ACL rules, transactions, offline conflicts, audit, upload processing | Stable local domain, emulator tests, separate cloud credentials |
| Later | Multiuser boards, external integrations, APIs, GitHub/GitLab/webhooks, optional OIDC/enterprise features | Server authorization, monitoring, rate limits |

## Acceptance gates (for every batch)

- Source files changed intentionally; no code copied from OpenProject; separate source provenance notes.
- Unit/model tests: valid/invalid inputs, graph cycles, edge cases, no mutation, compatibility and export/import/restore roundtrips.
- Expo Web and Expo Go with Metro: navigation, create/update/delete, rotation/portrait, touch/scroll, persistence after restart.
- Unslop visual audit on **changed** screens, backed by actual screenshots when available.
- `work` branch checkpoint and handoff changelog before merge; `main` remains last tested baseline.
- Before deployment: independent Firebase environment, deny-by-default rules and emulator tests; never reuse RIVNA/Niyarvo Control Center data.

## Outstanding source-audit questions

The repository inventory does not verify which capabilities are paid Enterprise features, which services require extra infrastructure, or every branch of their underlying domain rules. For implementation, inspect the corresponding tests/contracts and design a Niyarvo-specific specification per batch. In particular, OpenProject's accounting, BIM, external storages, and enterprise identity integrations are **not** implicit commitments to implement those capabilities immediately.
