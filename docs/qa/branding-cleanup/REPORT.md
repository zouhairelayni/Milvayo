# Milvayo legacy branding and backup copy audit

Date: 2026-11-10

## Scope and corrections

- `src/store/niyav.cjs`: unsupported content now says to choose a `.json` or `.niyav` backup instead of calling it a Niyarvo backup.
- `src/store/importFiles.cjs`: malformed JSON, non-object backup structures and file access failures now have distinct, user-readable messages. Android guidance is identified as Android-only.
- `src/store/store.js` and `src/domain/model.cjs`: unsupported formats, empty backups, project-count limits and missing project task data no longer expose internal format identifiers or generic validation text.
- `src/screens/workspace/Backup.js`: whole-workspace restore requires schema version 1 and at least one project; errors, file-size guidance, password warning and workspace instructions use current Milvayo wording. The all-project export filename now starts with `milvayo-`.
- `src/components/shell/ScreenErrorBoundary.js`: diagnostic console prefix now says Milvayo.
- `docs/instructions/android-apk-first-build.md`: update the example private credential folder to `milvayo-private` and document why the workflow's existing secret names remain unchanged.

## Compatibility and data safety

- Kept project format `niyarvo.project.v1`, workspace envelope `niyarvo.workspace.v1`, AsyncStorage keys, encrypted-backup metadata keys, and old ready-file prefix/validation unchanged. These are existing user-data and file compatibility identifiers.
- `.json` remains JSON text; plain `.niyav` remains gzip identified by `1F 8B`; protected `.niyav` remains the 40-byte `NIYV` AES-GCM header plus payload. Extensions alone do not establish validity; decoding checks signatures, and project/workspace import checks supported structure/schema.
- Existing tests cover project import as an added project, duplicate-ID remapping, whole-workspace normalization/restore, JSON parsing, gzip round trips, encrypted round trips, decompression corruption, passwords and size limits. No import path was changed to replace the current workspace without explicit full-workspace recovery confirmation.

## Search disposition

- Current user-facing `Niyarvo` backup/error text was removed from the import/export flow.
- Remaining source matches are retained for compatibility: `niyarvo.project.v1`, `niyarvo.workspace.v1`, local workspace/backup storage keys and filenames, crypto known-answer strings, and the `NiyarvoSchedulingPreview/v1` discriminator. Other matches are source comments describing the legacy Niyarvo-origin design rather than displayed UI.
- Historical changelog, QA and historical instruction matches describe past releases. GitHub Actions secret names `NIYARVO_ANDROID_*` remain because the workflow and configured secrets use them; the current setup guide labels these as compatibility identifiers.
- No Niyarvo Projects branding remains in the current rendered screens found by source search. Dynamically generated project/user data is left untouched.

## Verification

| Check | Result |
| --- | --- |
| Focused import, backup, crypto and recovery tests | Pass — 39/39 |
| Full application suite (`npm test`) | Pass — 1,090 passed, 0 failed, 4 skipped |
| Cloud suite | Not run — no backend/cloud/security-rule code changed |
| Android device UI / Expo Go | Not run |
| Web picker runtime | Not run; picker and shared import paths covered by unit tests |
| APK/build | Not run |
