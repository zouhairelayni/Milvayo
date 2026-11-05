# Milvayo v0.4.2 — acceptance / release gate

**Status: Source-level QA candidate; device/browser acceptance PENDING.**

| Area | Status | Notes |
|---|---|---|
| Full Node regression suite | PASS | 327/327 on 2026-10-31 |
| New migration bridge tests | PASS | 17 new tests for board/list, task migration and protection |
| JavaScript/JSX parse | PASS | 27 files, no parser diagnostics |
| Expo installation/bundle | NOT VERIFIED | `npm ci` stalled; network/dependency environment issue |
| Web UI responsive visual QA | NOT RUN | New app shell not launched in browser |
| Expo Go Android | NOT RUN | Long-press and auto-scroll not device-tested |
| iOS | NOT RUN | No simulator/device available |
| Native JSON/CSV share & picker | NOT RUN | Implemented, not verified |
| Production deployment | NOT RUN | Do not deploy yet |

## Required acceptance sequence

- [ ] Export full v0.4.1 workspace JSON before starting the upgrade, and retain original ZIP/source.
- [ ] `npm install && npm test && npx expo install --check` in Android Termux; resolve any installed-version warnings.
- [ ] `npx expo start --clear`, verify Web/Expo Go launches without Metro errors.
- [ ] Open an existing populated project; check task IDs, board membership, labels, dependencies, evidence, time entries, custom fields, release and sprint associations.
- [ ] Create, rename, archive and delete secondary boards; confirm tasks are kept and snapshots are available.
- [ ] Create/rename/reorder/delete a list. Move cards between lists and reorder within a list using **hold + drag**, including auto-scroll and a status-invalid drop.
- [ ] Task sheet: edit dates, type, owner, notes, labels, parent, release, sprint, acceptance status and evidence; close/reopen and restart app to confirm persistence.
- [ ] Timeline: Days/Weeks/Months, navigate window, move/start-resize/due-resize bars, add/remove a dependency, attempt an invalid dependency cycle. Check task with no dates appears in “Needs scheduling”.
- [ ] Confirm incomplete predecessors block Done and acceptance evidence/actual are required for verified completion.
- [ ] Confirm recorded merges and release gating are metadata operations only and cannot trigger real Git actions.
- [ ] Settings → Advanced workspace, return to new workspace, verify updates are reflected in both shells after reopen.
- [ ] Verify JSON workspace export and import, CSV export, mobile share sheet, Web download and recovery snapshot restore; repeat after a fresh app relaunch.
- [ ] Test at 320, 390, 768 and desktop widths, light/dark appearance, phone keyboard, long titles and large (>120) timelines.
- [ ] Record screenshots, platform, console output, bugs and repeat test results before approving merge to `main`.

Do not clear Expo Go app data or uninstall during troubleshooting; this is a local-first application with on-device AsyncStorage. Keep the backed-up v0.4.1 release and the exported JSON recovery file available until acceptance is complete.
