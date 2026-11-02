# CHG-NP-0.5.25 — Backup no longer freezes the app; Backup moves into Settings; Specifications can be edited

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | NiyarvoProjects_v0_5_24.zip |
| Release | 0.5.25. `app.json` version bumped; `package.json` and `package-lock.json` not included (bump `package.json` to 0.5.25 yourself) |
| Dependencies | None added. `@noble/hashes/hmac` ships in the already installed `@noble/hashes`; `pbkdf2Async` is no longer used |
| Source status | 524 tests: 523 pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean (TypeScript parser) |
| Runtime status | Web, Android, iOS, Expo Go: **Not run**. `npx expo install --check`: **Not run** (no network here) |

## 1. Password backup froze the whole app (crash report run mvyjx1i6)
**Cause.** The key for a password is derived with 600,000 rounds of PBKDF2. The library's `pbkdf2Async` only waits on a microtask between slices. A microtask never lets the phone handle a touch, so the JavaScript thread was busy the whole time. Scrolling is handled by the native side, which is why only scrolling still worked and no button or tab responded. There was no progress and no way to stop it.

**Fix.**
- New `src/store/pbkdf2Chunked.cjs`: PBKDF2 in slices of about 16 ms with a real timer wait (`setTimeout`) between slices, so taps and navigation are handled. It reports progress and accepts a cancel signal. Same output as before: files made by 0.5.24 still open, and files made now open in 0.5.24 (same format, same iteration count).
- `niyav.cjs`: `encode` and `decode` accept `onProgress` and `signal` and pass them to key derivation. Cancelling throws `NIYAV_CANCELLED` and no file is written.
- `niyavPrimitives.js`: uses `hmac` from `@noble/hashes` with the chunked loop. The built-in self-test vector (PBKDF2 "password"/"salt"/1000) now also checks the new loop on every device before a protected file is made or opened.
- Backup screen: while protecting or unlocking, a card shows the message, a progress bar with a percentage and a **Cancel** button. Leaving the screen cancels the work as well.

## 2. Backup screen
- Choose **Project** or **Workspace**. Each has a dropdown: Project lists every project (archived ones are marked), Workspace lists this workspace with its project count (there is only one workspace today).
- One **Back up "<name>"** button, the only accent-coloured button on the screen. Unlock was changed to secondary. The file name follows the chosen project.
- `store.backupText(all, {snapshots, projectId})` exports any project, not only the open one; an unknown id throws "Project not found".
- New shared `Dropdown` in `components/inline/CompactTools.js`.

## 3. Backup moved into Settings
- Settings now has two tabs, **General** and **Backup**. The Backup tab holds the whole former screen (export, import, workspace recovery, snapshots, archived projects).
- The separate Backup entry is removed from the drawer menu and the route table. `Projects` points to "Settings → Backup".

## 4. Specifications: add, edit, delete
- Phases, Data schemas, API contracts and Playbooks each have **Add**, an editable form per entry (Save changes) and a confirmed **Delete**. Phases edit stage, goal and exit criteria.
- New `src/domain/specifications.cjs` (`save`, `remove`), exposed as `model.specifications`; store actions `saveSpec` and `deleteSpec` go through the normal project change path (history entry, validation, undo-safe snapshots).
- Deleting a phase clears `phaseId` on tasks that pointed to it. Imported entries are editable now (the old "retained without alteration" rule is gone).

## 5. Tests
- New: `tests/store/pbkdf2-chunked-0525.test.cjs` (same key as Node, yields, progress, cancel, codec round trip, wrong password), `tests/domain/specifications-0525.test.cjs`, `tests/app/backup-in-settings-0525.test.cjs`.
- Updated for the new design: navigation-drawer, single-app-migration-051, niyav-wiring-0524.

## 6. Not verified
- Speed on a real phone. 600,000 rounds in JavaScript on Android may still take a long time; the progress bar will show how long. If it is too slow, lowering the count is a security decision for you (stored in each file's header, so old files keep working).
- Compressing a large backup without a password is still one blocking step (no cancel).

## 7. Acceptance (device)
1. Backup tab, .niyav, password on, back up: progress moves, bottom tabs and the menu still respond, Cancel stops it and no file is saved.
2. Start a protected backup and open another tab: it stops; coming back shows no stuck message.
3. Back up a project other than the open one, then import the file: it is that project.
4. Settings > Backup shows one orange button only.
5. Specifications: add a playbook, edit it, delete it; delete a phase that tasks use.

## 8. Rollback
Restore the changed files from NiyarvoProjects_v0_5_24.zip and delete `src/store/pbkdf2Chunked.cjs`, `src/domain/specifications.cjs` and the three new test files.
