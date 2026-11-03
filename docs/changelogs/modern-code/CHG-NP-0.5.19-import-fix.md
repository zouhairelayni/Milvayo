# CHG-NP-0.5.19 patch — Import project and Restore workspace on Android

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | Niyarvo_0_5_18.zip (with `src/navigationMemory.cjs` removed by the owner) |
| Release | 0.5.19 patch. `app.json` and `package.json` not touched, so the version still reads 0.5.15 |
| Scope | Backup screen file picking, store error reporting, recovery snapshot size budget |
| Dependencies | No new packages |
| Source status | 467 tests pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean |
| Runtime status | Android: **Not run**. Web and iOS: **Not run** |

## 1. What was wrong

**Android could not read the chosen file.** `Backup.js` used `expo-document-picker` (which copies the file into the app cache) and then read it with `new File(uri).text()`. That is the exact path that failed on Android Expo Go in v0.3.2: the cached file was reported unreadable with permission errors. HOTFIX2 (v0.3.2) fixed it with `File.pickFileAsync` (the system picker), and the owner confirmed that import worked. The modern Backup screen later went back to the DocumentPicker path. The fixed helper, `pickAndroidJsonText` in `src/importFiles.cjs`, and its tests were still in the project, but nothing called it. Both **Import project** and **Choose workspace .json** share one picker function, so both failed together.

The DocumentPicker call also listed only `application/json`, `text/json` and `text/plain`. A JSON file labelled `application/octet-stream` could not be selected at all.

**Failures were hidden.** When an import or restore failed inside the store, the screen showed a generic message (`Import failed; no projects were replaced.` / `Workspace restore failed`) instead of the actual reason.

**A trap that import success would have exposed.** Every restore or import stores a full snapshot of the previous workspace. Restoring the 2 MB fixture three times pushed the saved workspace past 2 MB; single rows of about that size are a known read limit on Android storage, which would stop the app loading the workspace.

## 2. Changes

- `src/screens/Backup.js`: Android uses `pickAndroidJsonText(File)` (system picker, every file type offered, size checked, BOM stripped). iOS keeps the DocumentPicker path; web keeps the HTML file input (now also strips a BOM). A cancelled or failed pick now shows "No file selected." instead of nothing.
- `src/store.js`: `trans` records the real error; `importProject` and `restoreWorkspace` return it. When a transaction changes recovery snapshots, `fitBackups` keeps them within a size budget and says so if it removed any.
- `src/backupBudget.cjs` (new): keeps the newest snapshots, drops the oldest above 1.5 MB, always keeps the newest one unless it alone would exceed 1.9 MB. The live workspace is never changed.
- `tests/import-android-0519.test.cjs` (new, 6 tests).

## 3. Verification

- The owner's fixture `Northstar-Studio-FULL-WORKSPACE-HIERARCHY-GOVERNANCE-v2.json` (about 2 MB) run through the app's own model code in Node: restore gives 5 projects, 1 program, 2 portfolios; Import project gives all 5 projects, 41/40/41/40/39 tasks. The data is valid; the failure was file access.
- Eight repeated restores of that fixture with the budget: saved workspace stays at about 1.15 MB with 2 snapshots (without it, it passed 2 MB by the third).
- Installed SDK 58.0.13 `File.pickFileAsync` signature checked in `node_modules`: `{ mimeTypes, multipleFiles }` returning `{ result: File, canceled }`.
- **Not verified**: the Android system picker on the owner's device. In SDK 58 the new API reports any picker failure as a cancel, so a failed pick shows "No file selected." with no further detail.

## 4. Limits

- A workspace restore replaces everything, as designed; a snapshot is taken first (subject to the budget above).
- **Import project** with a workspace file imports its projects only (no programs or portfolios). Use **Choose workspace .json** for the hierarchy.
- The main project switcher is intentionally flat; Program > Portfolio > Project nesting is under Governance > Programs.

## 5. Acceptance sequence

1. Backup > **Import .json file**, choose the Northstar file. Expected: "Imported 5 projects. … is open." Open the project switcher: 5 new projects.
2. Backup > Full workspace recovery > **Choose workspace .json** > the Northstar file. Expected: "5 project(s) in selected workspace." Then **Restore entire workspace** > **Confirm**. Expected: "Whole workspace restored; prior snapshot retained."
3. Governance > Programs: 1 program with 2 portfolios and their projects.
4. Close and reopen the app: workspace loads.
5. Cancel the picker: "No file selected."
6. If a step fails, send the exact message shown on the Backup screen.

## 6. Rollback

Restore `src/screens/Backup.js` and `src/store.js` from Niyarvo_0_5_18.zip and delete `src/backupBudget.cjs`.
