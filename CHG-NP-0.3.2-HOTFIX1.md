# CHG-NP-0.3.2-HOTFIX1 — Android JSON import permission recovery

## 0. Read first

| Field | Value |
|---|---|
| Application | Niyarvo Projects (independent Expo/React Native app) |
| Base source | `NiyarvoProjects-v0.3.2-LOCAL-QA.zip` |
| Patch ID | `NP-0.3.2-HOTFIX1` (app package remains 0.3.2) |
| Git branch intended | `work` (not committed or pushed) |
| Status | Source/test validated; Android Expo Go runtime **Not run** |
| Firebase | **Not connected**; none of RIVNA/Control Center data touched |

## 1. Observed failure

User-selected JSON import on Android displayed:
`Call to function 'FileSystemFile.text' has been rejected. Caused by: Missing 'READ' permission for accessing the file.`

The v0.3.2 `App.js` native importer requested `copyToCacheDirectory:true`, then called `new File(asset.uri).text()` directly without a fallback. The exception occurs **before JSON parsing or preview**, so it does not prove the uploaded JSON is invalid.

## 2. Implemented changes

- `App.js`: native import uses `importFiles.readPickedJsonAsset` with Expo `expo-file-system/legacy` instead of depending solely on `File.text()`.
- `src/importFiles.cjs`: defensive file-reading path:
  - Validates `file://` or `content://` picker URI and 5 MB limit.
  - Reads a local `file://` using legacy UTF-8 reader; if that fails, tries `File.text()` on a local file only.
  - For Android `content://` URIs, uses documented legacy `copyAsync` support to copy into private app cache before reading; always attempts to delete **only that temporary copy**.
  - Metadata access is best-effort; enforces size from known picker information and the returned text.
  - Converts permission errors into actionable guidance to retry from Android Downloads; does not expose raw local file URI.
- `tests/native-import.test.cjs`: 11 unit tests including picker cache, SAF URI copy, cleanup, size limits, fallback, error mapping, and metadata failures.
- No app data model, storage, Kanban, Gantt, sprint, CSS, logo, or workflow changes.
- No manifest-wide storage permission added. File access remains tied to Android's user-driven document picker.

## 3. Test evidence

| Check | Result |
|---|---|
| `npm test` | **207/207 PASS** (196 original + 11 new) |
| TypeScript parser JSX syntax `App.js`, `GanttView.js`, `SprintPanel.js` | **PASS** |
| Atlas mock file imported with `model.importProject` | **PASS** (73 tasks, 3 sprints) |
| Python ZIP integrity / source package verification | **PASS** |
| `npx expo install --check` | **Not run** in this isolated container |
| Metro Web bundle | **Not run** |
| Expo Go Android file-picker import | **Not run** — acceptance required |
| iOS file-picker import | **Not run** |

## 4. QA acceptance in Termux

1. Export workspace backup first; verify clean/committed checkpoint on `work`.
2. Extract full ZIP over the project root or extract the changes-only ZIP.
3. Run `npm test`, `npx expo install --check`, `npx expo start`.
4. Android: Backups → Import JSON → choose Atlas mock project from Downloads. Confirm preview displays `Atlas Operations — Product Launch`, 73 tasks. Confirm import, then select the project and open Sprints.
5. Confirm Sprint 02 history/burndown and task status. Restart the app to verify persistence.
6. Try canceling the picker; import nothing. Try invalid JSON; verify it reports an error without changing workspace. Reimport to test the recovery snapshot path.
7. Repeat importing from another provider (e.g. Drive) to exercise content URI behavior if possible.
8. Confirm existing Kanban drag and Gantt functions remain intact.

## 5. Limitations and follow-up

- This patch implements documented fallback routes; it cannot guarantee third-party Android providers will grant usable file access. In that situation a friendly Downloads retry message is shown instead of a native exception.
- Real Android verification is necessary before claiming the specific device/provider permission error is fixed.
- The project format remains `niyarvo.project.v1` and the app version remains `0.3.2` to keep the hotfix isolated.
