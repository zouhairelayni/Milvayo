# Android JSON import acceptance — 0.3.2-HOTFIX2

1. Back up your existing project/workspace to a JSON file; preserve a Git checkpoint on `work` before extracting.
2. `npm test` — expected **216 tests passed**. `npx expo install --check`, then `npx expo start`.
3. On Android Expo Go, open **Backups → Import JSON**. This now uses the Expo FileSystem **native system picker**, not the DocumentPicker cache.
4. Select `NiyarvoProjects-Atlas-Mock-v0.3.2.project.json` in Downloads. Expected: valid project import preview, **73 tasks**, **3 sprints**. Confirm and open Sprints 02.
5. Cancel the file picker and ensure no new project appears. Select a plain text file and verify safe format error with no project changed.
6. Restart Expo Go; confirm imported project, sprint history and previous projects still exist. Export the imported project and verify JSON round-trip.
7. Test import on Web as a cross-platform regression. iOS is not yet verified.

**If an Android error still occurs:** capture the exact message, provider used (Downloads, Drive, etc.), and whether the picker opened. Do not grant unrestricted storage access or reinstall/clear data as a first step. Web import in the same Metro dev environment is a temporary workaround.
