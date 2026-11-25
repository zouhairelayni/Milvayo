# Plan: projects and governance on cloud v4 (approved in principle 2026-11-23; drafted 2026-11-25)

Plain words first. Today a person's project edits (project settings, risks, work breakdown, budget lines, documents, phases, releases, sprints, Kanban boards, portfolios, programs...) stay on the device that made them ("not shared yet"). Sharing them needs new, narrow cloud actions, each tested with two different people. This is the biggest remaining piece, so it is split into six builds, one per version, in the order below. Nothing here can be done honestly in one version.

## What exists and how it is stored (from `schema.cjs`, `model.cjs`)
- One cloud record per item. Kinds: `projects` (the project's own settings), `governance.risks`, `governance.wbs`, `governance.budget.lines`, `governance.docs`, `dependencies`, plus the project lists `boards`, `resources`, `reminders`, `phases`, `releases`, `sprints`, `savedViews`, `automationCommands`, `automationHistory`, `automations`, `schemas`, `apiContracts`, `playbooks`, `changelog`, and workspace-level `portfolios` and `programs`.
- Existing building blocks to reuse: the generic field patch (`run`), the generic create (`createRecord`, with limits and caps), the planner (`v4Writes.cjs`), the field merge (`mergeChange`), the two-person test harness, the support contract test.
- Hard limits to respect: a cloud change may touch at most 100 records; a record at most 400 KB; a project's tasks are capped at 9000.

## The six builds
| Build | Content | Main risk | Rule I will follow |
|---|---|---|---|
| 0.8.45 | Governance: risks, work breakdown (WBS), budget lines, documents: create, edit, delete | WBS is a tree (parent, no cycles); budget lines hold money | Same checks as the app; WBS parent must exist and may not create a cycle; edit permission; money fields must stay numbers |
| 0.8.46 | Simple project lists: phases, releases, sprints, resources, saved views, schemas, API contracts, playbooks, changelog, reminders: create, edit, delete | Many kinds, so one generic server action driven by a table of kinds instead of ten copies | Each kind uses the app's own cleaner; deleting a phase/release/sprint that tasks point at clears the pointer or refuses (decided in the build) |
| 0.8.47 | Kanban boards and project dependency links: create, edit, delete | Boards carry columns and rules that tasks refer to | Column deletion refused while tasks are in it |
| 0.8.48 | Project settings (name, description, colour, tools, governance settings, scheduling settings, label colours, archive) | One record holds many nested settings; checking it needs the app's whole-project cleaner | Edit by field; unknown or oversized fields refused; archive is a field edit |
| 0.8.49 | Create a project, delete a project | A project owns thousands of records and a cloud change is capped at 100 | Delete only after archiving, manager only, done in chunks that can be repeated safely, and nothing is visible as deleted until the last chunk lands; create adds the project record plus defaults in one step |
| 0.8.50 | Portfolios and programs (workspace level) | They are not inside one project, so project permissions do not apply | Workspace manager only; programs may only reference projects that exist |

Each build follows the same delivery rule as before: one version, full-code zip, changed-files zip, summary.md, a short checklist, CHANGELOG, support matrix updated, two-person tests, then your test run.

## Decisions I need from you (plain choices; I will assume the first option if you do not answer)
1. Automations and automation history (rules that run by themselves): share them in the cloud, or keep them on each device? Recommended: **keep on the device for now** (a shared rule that runs on everyone's phone needs a separate safety design). They are left out of 0.8.46 unless you say share.
2. Who may delete a project: **managers only, and only after it was archived** (recommended).
3. Who may edit portfolios and programs: **workspace managers only** (recommended).
4. Budget and document approvals: keep the app's rule that approving needs manager level (recommended), or allow contributors.

## Also still not shared (smaller, separate from this plan; say if you want them added after 0.8.50)
Editing or deleting a comment, editing or deleting a time entry, removing a whole field from a task, moving or deleting a Canvas comment on its own, nested groups.

## How each build will be proven (honest evidence levels)
Planner-tested (real server code on the in-memory database, two different people) in the sandbox; emulator-tested by your run only if I can add a test that the sandbox can also check; device-verified only after you run the checklist on two real devices.
