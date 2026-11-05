#!/usr/bin/env python3
# /scripts/build-openproject-inventory.py
"""Offline repository evidence index. It does not copy source code."""
from pathlib import Path
import zipfile,collections,sys
archive=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/openproject-17.9.6.zip')
if not archive.exists():
    raise SystemExit('OpenProject 17.9.6 archive not found')
z=zipfile.ZipFile(archive)
root='openproject-17.9.6/'
paths={p.removeprefix(root) for p in z.namelist() if p.startswith(root)}
modules=collections.Counter(p.split('/')[1] for p in paths if p.startswith('modules/') and len(p.split('/'))>2)
# Reference files are markers of a functionality area, not copied code or proof of enterprise licensing.
C=[
('Portfolio & project','Project lifecycle','Metadata, subprojects, modules and configurable project settings','app/models/project.rb','Partial','P1'),
('Portfolio & project','Portfolios','Portfolio-level project aggregation and summaries','app/components/portfolios/index_component.rb','Missing','P2'),
('Portfolio & project','Project phases','Phase definitions, activation and rescheduling','app/services/project_phases/reschedule_service.rb','Partial','P1'),
('Portfolio & project','Project queries','Reusable project filters, shared queries','app/services/project_queries/create_service.rb','Missing','P2'),
('Portfolio & project','Project dashboards','Configurable overview widgets and grids','modules/overviews/app/components/overviews/dashboard_component.rb','Partial','P2'),
('Portfolio & project','Project copying','Copy linked content with constraints','app/services/projects/copy_service.rb','Missing','P2'),
('Portfolio & project','Project status/health','Health and lifecycle status','app/components/health_reports/report_component.rb','Missing','P2'),
('Work packages','Task/work package properties','Types, priority, assignment, estimates and dates','app/models/work_package.rb','Partial','P0'),
('Work packages','Task hierarchy','Ancestors, children, parent constraints','app/models/work_package/ancestors.rb','Partial','P0'),
('Work packages','Progress / completion','Done-ratio semantics and task effort','app/models/custom_actions/actions/done_ratio.rb','Partial → v0.2.9','P0'),
('Work packages','Task relation graph','Blocking, predecessors, relationships','app/models/relation.rb','Partial','P0'),
('Work packages','Scheduling relation filters','Distinguish scheduling relations','app/models/relations/scopes/used_for_scheduling_of.rb','Partial','P1'),
('Work packages','Saved work queries','Stored filters, sorting and groups','app/models/queries/work_packages.rb','Partial → v0.2.9','P0'),
('Work packages','Manual work order','Manually ordered work package views','app/models/queries/work_packages/common/manual_sorting.rb','Partial','P1'),
('Work packages','Advanced filters','Hierarchy, owners, attachments and dates','app/models/queries/work_packages/filter/ancestor_filter.rb','Partial','P1'),
('Work packages','Bulk changes','Batch update and validation','app/services/work_packages/bulk/update_service.rb','Partial','P1'),
('Work packages','Bulk copy/move','Copy and move tasks across projects','app/services/work_packages/bulk/move_service.rb','Missing','P1'),
('Work packages','Custom fields','Typed fields, validation and per-project field types','app/services/custom_fields/create_service.rb','Missing','P1'),
('Work packages','Status transition workflows','Status matrices and allowed actions','app/services/workflows/matrix_update_service.rb','Missing','P1'),
('Work packages','Custom actions','Reusable task actions with field restrictions','app/services/custom_actions/update_work_package_service.rb','Basic','P2'),
('Work packages','Activity and history','Journal of edits and comments','app/models/journal.rb','Partial','P1'),
('Planning & agile','Gantt charts','Timeline, date dependencies, visual schedules','modules/gantt/app/controllers/gantt/gantt_controller.rb','Advanced foundation','P0'),
('Planning & agile','Calendar views','Date-oriented project work','modules/calendar/config/routes.rb','Missing','P1'),
('Planning & agile','Kanban & boards','Configurable boards and filters','modules/boards/app/models/boards/grid.rb','Partial','P1'),
('Planning & agile','Backlogs','Backlog prioritization and buckets','modules/backlogs/app/models/backlog_bucket.rb','Missing','P1'),
('Planning & agile','Sprints','Iterations and completion workflows','modules/backlogs/app/components/backlogs/finish_sprint_dialog_component.rb','Missing','P1'),
('Planning & agile','Burndown','Progress vs time reporting','modules/backlogs/app/models/burndown.rb','Missing','P2'),
('Planning & agile','Team planner','Multi-person allocation visualization','modules/team_planner/app/components/team_planner/overview/row_component.rb','Missing','P2'),
('Planning & agile','Releases / versions','Version lifecycle and progress','app/services/versions/create_service.rb','Partial','P1'),
('Capacity, time & costs','Resource allocation','Assignment windows and working capacity','modules/resource_management/app/models/resource_allocation.rb','Missing','P2'),
('Capacity, time & costs','Optimal schedule planning','Compute fitting allocation schedules','modules/resource_management/app/models/resource_allocations/optimal_schedule.rb','Missing','P2'),
('Capacity, time & costs','User working hours','Availability calendars and hours','app/services/user_working_hours/create_service.rb','Missing','P2'),
('Capacity, time & costs','Time entry and accounting','Actual work log and time reporting','modules/costs/app/models/cost_entry.rb','Missing','P1'),
('Capacity, time & costs','Rate management','Hourly and cost rates','modules/costs/app/models/cost_rate.rb','Missing','P2'),
('Capacity, time & costs','Budgeting','Planned cost and spend reconciliation','modules/budgets/app/models/budget.rb','Missing','P2'),
('Capacity, time & costs','Cost reporting','Slice-and-dice cost queries','modules/reporting/app/models/cost_query.rb','Missing','P2'),
('Collaboration','Comments & mentions','Task discussions and notification targets','app/services/work_packages/activities_tab/comment_service.rb','Missing','P1'),
('Collaboration','Notifications','Recipient settings and feed','app/services/notifications/create_service.rb','Missing','P1'),
('Collaboration','Reminders','Schedule and manage reminders','app/services/reminders/create_service.rb','Missing','P2'),
('Collaboration','Meetings','Meetings, agenda items and outcomes','modules/meeting/app/models/meeting.rb','Missing','P2'),
('Collaboration','Wikis','Project knowledge bases and pages','modules/wikis/app/models/queries/wikis/wiki_pages/wiki_page_query.rb','Missing','P2'),
('Collaboration','Documents','Document management and collaboration','modules/documents/app/components/documents/list_component.rb','Missing','P2'),
('Files & exports','Attachments','Uploads, deletion and scanning services','app/services/attachments/create_service.rb','URL links only','P1'),
('Files & exports','File safety / antivirus','Malware scanning and quarantine','app/services/attachments/clamav_service.rb','Missing','P1 cloud'),
('Files & exports','External storage','Linked storage and OAuth adapters','modules/storages/app/models/queries/storages/file_links/file_link_query.rb','Missing','P3'),
('Files & exports','CSV export','Data export with spreadsheet injection controls','app/models/exports/concerns/csv_formula_sanitization.rb','Missing','P1'),
('Files & exports','Spreadsheet export','XLS exports and formats','modules/xls_export/app/models/xls_export/work_package/exporter/xls.rb','Missing','P2'),
('Files & exports','PDF export','Work package/project exports','app/models/exports/pdf/artefact/budgets.rb','Missing','P2'),
('Security & governance','Project role membership','Role assignments and revocation','app/services/members/add_role_service.rb','Not enforced','Cloud prerequisite'),
('Security & governance','Authorization','Permission checks and authorized scopes','app/services/authorization/project_query.rb','Not enforced','Cloud prerequisite'),
('Security & governance','Resource sharing','Permissioned work package sharing','app/services/shares/create_service.rb','Missing','Cloud prerequisite'),
('Security & governance','Local backups','Backup generation and governance','app/services/backups/create_service.rb','Local snapshots','P1'),
('Security & governance','Two-factor auth','TOTP and device verification','modules/two_factor_authentication/app/components/two_factor_authentication/devices/totp_qr_code_component.rb','Missing','Cloud prerequisite'),
('Security & governance','OIDC sign-in','OpenID Connect provider integration','modules/openid_connect/config/routes.rb','Missing','P3'),
('Security & governance','SAML sign-in','Federated enterprise identity','modules/auth_saml/config/routes.rb','Missing','P3'),
('Security & governance','LDAP groups','Enterprise group mapping','modules/ldap_groups/config/routes.rb','Missing','P3'),
('Security & governance','Bot protection','CAPTCHA integration','modules/recaptcha/config/routes.rb','Missing','P3'),
('Integrations & API','API endpoints','Public resource model and linked entities','app/services/api/','No remote API','Cloud prerequisite'),
('Integrations & API','GitHub integrations','Pull request/check/deploy data linking','modules/github_integration/app/models/github_pull_request.rb','Manual SHA only','P2'),
('Integrations & API','GitLab integration','Merge requests and CI pipelines','modules/gitlab_integration/app/models/gitlab_pipeline.rb','Missing','P3'),
('Integrations & API','Webhooks','Incoming/outgoing event delivery logs','modules/webhooks/app/models/webhooks/log.rb','Missing','P2'),
('Integrations & API','MCP/automation tools','Tool boundaries and resource actions','app/services/mcp_tools/create_work_package.rb','Missing','P3'),
('Integrations & API','BIM/BCF','Construction model issues and viewpoints','modules/bim/app/models/bim/bcf/issue.rb','Missing','Optional'),
]
# Allow evidence directories where exact file is not specified.
missing=[(x[1],x[3]) for x in C if x[3] not in paths and not any(p.startswith(x[3]) for p in paths)]
print('Evidence missing:',missing)
if missing: raise SystemExit('Fix paths before generating')
heading='''# Milvayo — OpenProject Capability and Business-Logic Map

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
'''
for name,count in sorted(modules.items()):heading+=f'| `{name}` | {count} |\n'
heading+='\n> Counts are ZIP members under `modules/<name>/`, including documentation, tests, assets and directories; not feature counts.\n\n## Functional/business-logic matrix\n\n'
last=None
for domain,feature,logic,evidence,state,priority in C:
 if domain!=last:
  heading+=f'### {domain}\n\n| Capability | Architectural rule / intent | Evidence path | Niyarvo baseline | Priority |\n|---|---|---|---|---|\n'
  last=domain
 heading+=f'| {feature} | {logic} | `{evidence}` | {state} | {priority} |\n'
heading+='''
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
'''
out=Path(__file__).resolve().parents[1]/'reference/NP-OPENPROJECT-CAPABILITY-MAP-v1.md';out.write_text(heading)
print('wrote',out,len(C),'capabilities',len(modules),'modules','bytes',len(heading))
