# Firebase emulator — Milvayo 0.8.4

Baseline: 0.8.3. Build: 0.8.4 (existing build number 94). Changes are applied in place on `work`; the owner authorized the local v0.8.4 checkpoint. No ZIP, push, main merge or deployment. Keep local backups before testing. Do not clear application storage.

## Requirements

Tested on Android ARM64/PRoot with Node 24.21.0, npm 12.2.0, Java 21.0.13 and Firebase CLI 15.34.2. The rules-test package needs Node 24.12 or newer. Use the Firebase JS SDK in Expo Go; no native Firebase plugin/build is required. Physical Expo Go acceptance is still pending.

Install the locked project dependencies with `npm ci`. Firebase CLI and Java must be installed in the existing Termux/Debian environment. No Firebase login is needed. `npx expo install --check` verifies Expo compatibility. The emulator launcher sets a conservative 192 MiB Java heap per emulator process and a longer Functions discovery timeout for ARM/PRoot.

## Run locally

Terminal 1:

```sh
npm run emulators
```

Terminal 2:

```sh
npm run cloud:seed
npx expo start
```

The explicit seed command creates only synthetic local records. Its demo account is `owner@milvayo.test`, password `Milvayo-local-only-083`. These are public test credentials, never production credentials. The command prints the personal organization ID and cloud workspace ID `synthetic`; it also establishes the local platform role for that demo owner.

Open Settings → Firebase emulator. On the same Android phone, use `127.0.0.1`. To view the seeded fixture, enter the synthetic email/password, printed organization ID and `synthetic`, then choose **Sign in and open cloud workspace**. It saves the untouched local source first; disconnect restores that source. Pending cloud edits remain in their account/workspace journal.

To publish your own local test copy, choose a fresh cloud workspace ID and explicitly choose **Sign in and publish this workspace**. Leave organization blank for your personal organization, or enter one you are authorized to use. Existing remote workspaces with different source checksums are not overwritten. **Create emulator account and publish** creates an email/password account only in the local Auth emulator.

Use organization administration to load members/seats/audit, invite a UID, apply workspace or project roles and explicitly revoke members. A project `none` override denies it even when the workspace role allows access. An invited user creates their emulator account first, then uses the invitation acceptance fold and opens the authorized workspace. Platform overview requires a separate role and never grants private project access. Project summaries show actual authorized counts. Billing/capacity changes are simulated. Organization tools add teams/departments, display names, last-owner-protected roles, guest invitations, resource seat caps/allocations and license release. Allocate a license before granting editing access; one person in several resources uses one global seat. Groups do not grant project access. Retention settings do not delete records. Platform operations show actual current-worker samples, role controls and local feature/release configuration; they do not alter production releases.

Open Collaboration → Cloud conversations while connected to choose a project/task discussion, watch it, mention an authorized member, send a durably queued message and read your notifications. Typing/viewer signals are ephemeral. Local comments/reminders keep their existing behavior.

Emulator ports: Auth 9099, Firestore 8080, RTDB 9000, Functions 5001, Storage 9199, Hosting 5000, UI 4000, hub 4400. Project ID is fixed to `demo-milvayo-083`. Production hosts/projects and missing server emulator endpoints fail closed.

For a second physical device on your private LAN, bind explicitly to the host's private IPv4 address:

```sh
npm run emulators -- --host 192.168.1.20
```

Use that same address in the app. The launcher generates an ignored local config; the default remains loopback. Do not use a production hostname or Firebase project ID. The SDK configuration does not fall back to a live backend when an emulator is unavailable.

## Verification and measured reports

```sh
npm test
npm run test:cloud:running
npm run cloud:benchmark
npm run cloud:cost
```

`test:cloud:running` requires the already-running local suite. Alternatively stop your manual emulators and use `npm run test:cloud` to start, test and stop all six automatically. Default `npm test` reports emulator integration **Not run** unless explicitly enabled. Do not run both emulator launchers on the same ports.

Benchmark JSON/CSV and the security report are under `docs/qa/cloud-084`; architecture/cost assumptions/readiness are under `docs/cloud`. Enterprise concurrency and 72-hour offline duration are labeled simulations. JavaScript/heap timing is not device FPS. Costs are projections, not Firebase invoices. Pass a replacement regional price table to `npm run cloud:cost -- <path>`.

Web preview: `npx expo start --web`. This PRoot host failed file watching and the optional DevTools executable reported EACCES. `CI=1 npx expo start --web --offline --max-workers 2` allowed actual Web smoke testing, but disables Fast Refresh. Keep the project Metro config unchanged. The owner must still validate normal `npx expo start`, Fast Refresh and Expo Go on Termux.

## Backup and recovery

Use the existing Backup screen for compatible JSON/niyav exports. Cloud export and sync-recovery export are separate explicit actions. Treat their contents as private local data. In Cloud recovery, choose a cloud JSON backup, optionally select a project/task, preview affected records and confirm. Corrupt checksums, bad references, or wrong scope are refused. In-place recovery accepts at most 100 changes. Larger complete backups can be staged into a fresh workspace ID, checked and activated without overwriting the source. Whole-project recovery includes Canvas references; task recovery includes related comments/time/reminders. New unrelated current records are preserved.

For emulator disaster-recovery data:

```sh
npm run cloud:export
npm run emulators -- --import .emulator-data/<timestamp-directory>
```

Stop the existing suite before starting with `--import`. Export always chooses a new timestamped directory, preserving previous copies. These emulator exports do not validate production managed backups or PITR.

Conflicts retain both base and local intent. Export sync recovery and a local backup first. Transient errors retry; permanent conflicts require explicit reconciliation. A dedicated conflict editor is not included in this build. Complete recovery into a new workspace includes messages/watchers and marks restored notifications read; the source retains its prior audit and revision history. Do not erase the queue or pretend a conflict succeeded.

## Reversible update

Keep the untouched 0.8.3 backup and unrelated Git changes. The owner authorized the local 0.8.4 checkpoint; physical device acceptance remains pending before a main merge. To roll back, export local work and pending cloud recovery, disconnect (borrowed views restore their local source), stop the task-started processes, and revert only the cloud patch with its package/lock changes. Do not reset/delete the project directory or remove AsyncStorage. Local schemaVersion stays 1. Cloud journal keys are separate; older releases ignore them.

The repository already contained a 0.8.4 Web chart fix. A same-version PWA rebuild may retain an older service-worker cache; refresh/unregister only the service worker/cache when testing an updated local export, preserving application data. No Hosting deployment is authorized here. The complete enterprise v1 handoff remains subject to the explicit gaps in `docs/cloud/13-deployment-readiness.md`.
