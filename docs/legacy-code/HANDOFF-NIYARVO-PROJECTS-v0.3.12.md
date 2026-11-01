# Niyarvo Projects — v0.3.12 handoff (source-verified baseline)

**Canonical product:** Niyarvo Projects (independent project management app). **Do not substitute an unverified name for it**, conflate it with RIVNA or Niyarvo Control Center, or merge those apps' repositories, Firebase projects, accounts or schemas.

**Source:** `NiyarvoProjects-v0.3.12-LOCAL-QA.zip` (project-root files at archive root). Documentation-only annotated package: `NiyarvoProjects-v0.3.12-WITH-HANDOFF.zip`. Package version remains **0.3.12**. User's Git `work` commit SHA is not available in this handoff.

**Last user-confirmed working Android/Web baseline:** v0.3.11-HOTFIX2 corrected the navigation drawer and Web Niyarvo logo. Android JSON import of the Atlas demo was confirmed after v0.3.2-HOTFIX2. **v0.3.12's Kanban redesign remains a QA candidate** until tested by the user.

**Latest source audit:** `npm test` from cleanly extracted v0.3.12 source: **297 passed / 0 failed**. This is not Metro Web, native Expo Go, iOS or end-to-end coverage. Do not claim those were run in this documentation task.

## Read these documents in order

1. `00-START-HERE.md` — facts, scope and limits.
2. `01-RELEASE-HISTORY.md` — every documented version from 0.1.0 to 0.3.12 and **five hotfixes**.
3. `02-ARCHITECTURE.md` — architecture diagrams, source files, data flow and security boundaries.
4. `03-FUNCTIONALITY-MAP.md` — all 17 screens and implemented/partial/missing coverage.
5. `04-HOW-TO-USE.md` — Android/Web user manual, tasks/boards/Gantt/sprints/backups/automations/Power-Ups.
6. `05-REMAINING-WORK-AND-HANDOFF.md` — prioritized roadmap, specific next-batch instructions and reusable next-model prompt.
7. `06-AUDIT-AND-TRACEABILITY.md` — checked evidence, omissions and test traceability.

The above files are under `docs/handoff-v0.3.12/` in the annotated full-source ZIP, or at the root of the standalone documentation ZIP. Original `CHG-NP-*` and `docs/CHG-NP-*` files are preserved unchanged in the full source.

## Non-negotiable implementation facts

- Expo SDK 58, React Native + Web, `npx expo start` / Metro / Fast Refresh. User develops on Android via Termux and personally tests, commits, builds and deploys.
- Local-first AsyncStorage key `niyarvo-projects-v1`; project JSON `niyarvo.project.v1`; accent key `niyarvo-projects-accent-v1`. Export/back up before changing storage or imports.
- Current domain: project/task CRUD, Kanban + multiple boards, hierarchical virtualized Gantt, dependencies and working-day scheduling, sprints/burndown, task types/custom fields, optional workflow transitions, local automation, Power-Ups, verification/releases, local portfolios, resources/time, costs, comments/reminders, reports/templates and JSON/CSV transfer.
- Firebase Auth/Firestore synchronization/Storage uploads are **not implemented**; Firebase rules in this source are deny-all scaffolds. GitHub Power-Up is public read-only metadata plus links; no private token/OAuth/webhook sync. Scheduled automations require local invocation.
- Preserve working full-card hold-to-drag and Gantt gestures. v0.3.12 card ellipsis/drag interaction needs hands-on Android and Web QA.
- User's `work` branch is development; only user approves moving changes to `main`. Never fabricate a commit SHA or claim production deployment.

## Next actions

1. Have user accept or report v0.3.12 Android/Web Kanban QA (drag vs ellipsis, filters, board move, duplicates, preserved sidebar/logo, Atlas Timeline and sprint chart).
2. Repair documented data contract gaps: published JSON Schema lags current importer fields; README release banner lags package version; add stronger negative import/export and React UI checks.
3. Based on user selection, advance Kanban UX (saved views/WIP limits/keyboard and touch) and measured Android performance.
4. Plan any Firebase authentication, owner-scoped rules, sync, OAuth, binary uploads, and cloud automations as separate security-reviewed milestones, not implicit features of v0.3.12.

**Documentation-only deliverable:** no app code change, source upgrade, Git push, merge, APK build or remote deployment was performed. See full pack for precise evidence and all remaining-work items.
