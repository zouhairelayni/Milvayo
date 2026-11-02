# CHG-NP-0.5.10 — Performance and stability audit

## Handoff
- Baseline: supplied NiyarvoProjects-v0.5.9-GOVERNANCE.zip plus separately supplied package.json and package-lock.json.
- Release: 0.5.10; branch: work. No commit, push, merge, deployment, APK or IPA produced.
- Status: 427 tests pass; Android/iOS/web JavaScript exports pass; browser smoke checks pass. Physical Android/iOS acceptance remains **Not run**.
- Source ZIP contains project-root files, excluding package.json, package-lock.json and node_modules to preserve the user's local setup. The supplied package version remains 0.4.8; app.json reports 0.5.10.

## Fixes
- Timeline dependencies now use the same normalized one-sided dates as bars; invalid coordinates are rejected before SVG rendering. This addresses a concrete rendering defect, but the reported Android return to Overview is not yet confirmed resolved on a device.
- Replaced repeated Timeline routing scans with interval routing; reduced native gesture-handler work. Cancelled drags and connections no longer commit changes.
- Hidden screens unmount instead of remaining subscribed to workspace edits. Local screen state may reset when navigating away.
- Workspace normalization reuses unchanged project objects; pending disk saves coalesce to the newest complete snapshot. Failed saves remain retryable and show a visible error; background/page-hide events attempt a flush. Abrupt process termination can still interrupt asynchronous saves.
- Indexed costs, health, comments and task-view summaries remove repeated scans. No-op task edits avoid unnecessary writes.
- Deep dependency and critical-path traversal avoids recursive stack overflow. Invalid/deep WBS and parent trees fail validation rather than proceeding into rendering.
- Governance IDs no longer restart a numeric counter after relaunch; document edits use current store values. Task editors reset on task/project identity changes; failed creation operations return no success ID.
- Diagnostics distinguish console logging from uncaught exceptions. Web service-worker cache version updated.

## Validation
| Check | Result |
|---|---|
| Node suite | PASS: 427 tests, zero failures |
| Expo offline dependency compatibility | PASS in preceding audit run |
| Android/iOS/web Expo exports | PASS; bundles are not installed native builds |
| Browser Timeline | PASS: five navigation cycles, due-only predecessor fixture, no invalid SVG paths or JS errors |
| Browser secondary screens | PASS: 19 screens opened |
| Persistence | PASS: task edit survived full browser reload |
| Browser layouts | PASS: 412×915 touch emulation and 1440×1000 desktop |
| Physical Android/iOS, Expo Go, Metro Fast Refresh | Not run |

## Installation and rollback
1. Export a whole-workspace backup from the app. Keep the previous source ZIP and a copy of your current package files.
2. Extract the source ZIP directly inside ~/Niyarvo (no enclosing folder). Existing package files are preserved.
3. If using the exact manifests supplied for this audit, extract the separate LOCKFILE-REPAIR ZIP there to replace only package-lock.json. It adds six missing dependency entries, preserving existing entries and versions. Do not apply to a differently updated package.json without reconciliation.
4. Run npm ci if applying the lock repair, then npx expo start -c. Rebuild native binaries through your normal workflow.
5. Test Timeline navigation, vertical/horizontal scrolling, move/resize/connect/cancel gestures, rapid edits, governance documents and persistence after relaunch on your device.
6. Roll back by restoring the previous source and package files. Do not uninstall or clear app data. Restore your exported workspace only if needed.

## Next acceptance gate
Native restart/crash confirmation requires device testing and a crash report if the symptom persists. This audit does not establish that all possible crashes or performance limits are eliminated. Large workspaces still require device memory/frame profiling; Timeline retains all scheduled rows. No data-format migration is required.
