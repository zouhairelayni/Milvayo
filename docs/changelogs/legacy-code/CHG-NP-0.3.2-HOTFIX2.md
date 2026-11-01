# CHG-NP-0.3.2-HOTFIX2 — Android project JSON import

## READ FIRST

| Field | Evidence |
|---|---|
| Project | Niyarvo Projects (independent of RIVNA / Niyarvo Control Center) |
| Release | 0.3.2-HOTFIX2, built on 0.3.2-HOTFIX1 |
| Git branch | `work` is intended; no Git operations performed here |
| Firebase | Not connected/deployed |
| Root cause | On Android Expo Go the `expo-document-picker` cache URI `file:///data/user/0/host.exp.exponent/cache/DocumentPicker/...json` was reported unreadable by both `File.text()` and legacy `readAsStringAsync()`. The cached-file fallback did not resolve this provider/Expo Go behavior. |
| Fix | Android **now uses `File.pickFileAsync` from Expo SDK 58** and reads the picker-granted native `File` directly, bypassing the DocumentPicker cache. iOS retains the previous `expo-document-picker` path, and Web retains HTML file input. |
| Compatibility | Existing model/schema and `niyarvo-projects-v1` AsyncStorage key unchanged. No new packages, broad storage permissions, or user-data migrations. |
| Automated validation | 216/216 Node tests passed, including 9 new tests for the SDK58 picker; JSX parse of App, Gantt, Sprint passed. Mock Atlas JSON imported through model: 73 tasks, 3 sprints. |
| Not verified | Android Expo Go system picker on user's device; iOS/Web runtime; Android APK build; Firebase deployment |

## Changed files

- `App.js`: Android-specific native importer now calls `importFiles.pickAndroidJsonText(File)`; Web/iOS behavior unchanged.
- `src/importFiles.cjs`: `pickAndroidJsonText()` handles SDK 58 `{canceled,result}` and older direct File shape, checks size before and after read, preserves cancel/no-op semantics, handles a UTF-8 BOM, and normalizes permission errors without exposing private paths. Existing legacy helper remains for iOS.
- `tests/native-import.test.cjs`: tests picker shape, cancellation, size checks, unreadable files, malformed results, and denied file metadata.
- `README.md`: hotfix summary.
- `docs/NP-0.3.2-HOTFIX2-QA.md`: instructions/acceptance.

## Assumptions and remaining risks

- `File.pickFileAsync` is present in Expo SDK 58's `expo-file-system` API and opens a system picker. This route is the documented native alternative for Android. Device-specific provider behavior still requires testing; source tests do not prove it will work in Expo Go.
- Import is transactional at the app level: the chosen JSON is parsed and previewed before any workspace mutation; confirmation first records a snapshot. Never bypass this preview.
- The Android system picker intentionally offers all MIME types because JSON files may be labeled `text/plain` or `application/octet-stream`. The app still requires supported JSON schema and limits document text to 5 MB.
- If Expo Go does not support the new picker in the installed binary, use Expo Web import as a temporary workaround and report exact error text. Do not request broad storage access.
- No unrelated feature, UI, Gantt, Kanban, scheduling, sprint logic, accent, or user data was modified.

## Test / merge policy

1. On `work` export a workspace JSON backup, ensure a safe checkpoint, then extract the changes-only patch.
2. Run `npm test` and `npx expo start` (Metro). Re-import `NiyarvoProjects-Atlas-Mock-v0.3.2.project.json` from Downloads using **Backups → Import JSON**.
3. Check preview says 73 tasks and that 3 sprints are present, including burndown. Test cancel (no mutation) and a non-JSON text file (error without mutation).
4. Record Android result. Do not merge into `main` until runtime QA passes.
