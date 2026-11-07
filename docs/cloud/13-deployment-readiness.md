# Readiness — emulator integration, target build 0.8.4

This work is an implemented local emulator integration. It does **not** satisfy the entire master handoff's enterprise/production definition of done. The owner corrected the baseline/build to 0.8.3/0.8.4. No 0.8.5 bump, live project creation, login, Blaze activation, deployment, push or merge. The owner subsequently authorized a local v0.8.4 checkpoint on `work`; device gates remain pending.

| Area | State | Evidence / remaining work |
| --- | --- | --- |
| Source audit and baseline | Pass | 984 baseline tests; architecture inventory |
| Auth, Firestore, RTDB, Functions, Storage, Hosting | Pass locally | All six emulator listeners running on demo-milvayo-083 |
| Granular schema and canonical compatibility | Pass in automated tests | Existing local data/import format preserved |
| Scoped permissions and negative rules tests | Pass for implemented paths | Production review and additional rate limiting remain |
| Durable queue, incremental pulls, conflicts, idempotency | Pass for covered cases | Real multi-device/long-offline soak and conflict editor remain; emulator sign-in is required again after restart |
| Cache and project summaries | Measured | Project-wide mutation reads and sequence contention remain |
| Canvas record sync and presence | Implemented | Physical gesture/FPS, client concurrency and disconnect timing pending |
| Organization roles, invitations, seats | Implemented locally | Teams/departments, guests, scoped caps, unique licenses and role UI tested; full enterprise hierarchy remains bounded |
| Platform administration | Implemented locally with limits | Worker telemetry, flags, release configuration, role administration and audit; complete service-wide billing/security metrics remain |
| Payments | Simulated only | Signed mock events; real providers/store billing/refunds remain |
| Local/cloud recovery | Implemented with bounds | 100-change in-place limit; larger fresh-workspace staged recovery tested with collaboration |
| Mentions/watchers/conversations/notifications | Implemented locally | Durable authenticated messages, paginated history, scoped watchers/mentions, pointer notifications, typing and archive recovery tested |
| Attachment storage | Rules tested | Current app still uses link attachments; upload UI/lifecycle integration remains |
| Benchmarks/cost | Measured + labeled simulations | Real enterprise fan-out, billable index behavior and complete service prices pending |
| Web app | Runtime smoke in QA | CI mode bypasses host watcher; Fast Refresh not accepted |
| Android/iOS / Expo Go | Not run | Owner device gates required |
| Production backups/PITR/GCP IAM | Not run | Cannot be certified by local emulators |

Required handoff documentation is consolidated here plus QA and usage instructions. A separate CHG-MILVAYO-CLOUD file is intentionally omitted because AGENTS.md requires exactly one cumulative release changelog: docs/changelog/CHANGELOG.md.

Rollback: disconnect the emulator session, export local JSON/niyav and any pending journal, stop only task-started processes, then revert the cloud patch while preserving unrelated files. Keep package/lock/app metadata synchronized. No local schemaVersion migration is required. Do not reset/delete the project folder or clear AsyncStorage. Production activation is a separate future task; this source intentionally fails outside the demo emulator environment.
