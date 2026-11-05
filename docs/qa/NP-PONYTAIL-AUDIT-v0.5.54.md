# NP Ponytail Audit — v0.5.54: encryption, package exports and persistent backup jobs

**What this repo does:** Milvayo is a local-first, Expo React Native project manager. It holds a workspace in AsyncStorage and lets a single user export or restore projects. The encrypted `.niyav` format is a gzip-compressed JSON snapshot protected using PBKDF2-HMAC-SHA256 and AES-256-GCM.

**Expected load:** one user, one running app process, project/workspace backups no larger than 5 MB of uncompressed JSON; Android Expo Go and Web during development, iOS later. **Audit scope:** package/dependency manifest, app entry, Backup screen, backup codec/KDF/AES bridge, file export, job lifecycle, and relevant store guard/test files. Also reviewed relevant UI-kit buttons. Not a full audit of every task/planning engine file.

## Must fix

1. **Backup vanishes when leaving the screen** (`src/screens/workspace/Backup.js`, old `useEffect` cleanup).
   - **What this is:** Encryption used to live inside the Backup component.
   - **Problem:** Switch to Board midway through a long PBKDF2 pass, and component unmount aborts the job.
   - **Fix:** Move encrypt/decrypt to a module-level job controller. Only explicit Cancel aborts it; return to Backup to see progress or a completed file.
   - **If skipped:** A normal navigation gesture loses the backup work.
   - **Status:** Fixed, Node lifecycle tests passed.

2. **Finished encrypted output was temporary and immediately opened the share sheet** (`src/ui/downloadText.js`, `src/screens/workspace/Backup.js`).
   - **What this is:** Files were written to a cache file solely for sharing right after encryption.
   - **Problem:** If sharing is dismissed, the user must encrypt again; the OS can remove cached files.
   - **Fix:** Save only completed password-encrypted `.niyav` files in `Paths.document` and retain metadata in AsyncStorage. Display a Download backup button after completion or after a normal app restart. Retain one ready backup at a time with explicit discard.
   - **If skipped:** The requested return-later download is unavailable.
   - **Status:** Fixed in source; real device storage acceptance pending.

3. **A background decryption must not mutate the wrong workspace** (`src/store/store.js`, `src/screens/workspace/Backup.js`).
   - **What this is:** Unprotected project imports already guard the workspace selected when file reading began.
   - **Problem:** A decrypted result can finish after switching workspaces and be routed into the wrong one if it is immediately applied.
   - **Fix:** Keep decrypted text only in memory; show a Review/Import button on Backup, preserve the starting workspace ID, and refuse to import into another workspace. Full-workspace restore still needs explicit confirmation and recovery snapshot.
   - **If skipped:** The same file could modify an unintended workspace.
   - **Status:** Fixed, with lifecycle and source checks.

4. **Never persist a plain gzip as an encrypted pending download** (`src/store/readyBackupFiles.js`).
   - **What this is:** `.niyav` can be either password-encrypted or just gzip-compressed.
   - **Problem:** Persisting a file merely because it has a `.niyav` extension could store sensitive unencrypted JSON in the app's document folder.
   - **Fix:** Stage only password-protected exports, verify the encrypted `NIYV` header and write only the resulting ciphertext. Unprotected JSON/gzip uses the existing immediate download/share path.
   - **If skipped:** An ostensibly protected queue could retain readable private data.
   - **Status:** Fixed. Password, plaintext and derived keys are never persisted as job metadata.

5. **Secrets might survive an error path during key derivation** (`src/store/niyav.cjs`).
   - **What this is:** PBKDF2 temporarily holds UTF-8 password bytes.
   - **Problem:** A rejection during encryption or restore previously risked retaining the array instead of wiping it.
   - **Fix:** Move cleanup into `finally` so password/key buffers are zeroed on success, rejection and cancellation.
   - **If skipped:** Sensitive bytes may remain in reachable memory for longer than necessary.
   - **Status:** Fixed and tested in `tests/store/crypto-migration-0554.test.cjs`.

## Should fix

6. **Noble Hashes package-exports warning** (`package.json`, `package-lock.json`, `src/store/niyavPrimitives.js`).
   - **What this is:** Metro complains about a reference to internal `@noble/hashes/crypto.js` outside its declared exports.
   - **Problem:** File-path fallback works today, but package upgrades can break internal resolution. This warning began when crypto backup support was introduced.
   - **Fix:** Remove both `@noble/hashes` and `@noble/ciphers`. Use Expo SDK 58 `expo-crypto` AES-256-GCM and the current `js-sha256@1.0.0` HMAC for the sliced PBKDF2 fallback. Keep the `.niyav` v1 header, salts, nonce, authenticated data, iterations and tag unchanged.
   - **If skipped:** The Metro warning persists and future internal API changes could break bundling.
   - **Status:** Source/lock checked; independent Node known-answer and legacy-format tests passed; native Expo acceptance pending.

7. **Backgrounding the operating-system app is NOT guaranteed execution** (`src/store/backupJobs.js`, `src/store/backupJobCore.cjs`).
   - **What this is:** App-owned promises continue after navigating within Niyarvo but require the JavaScript process to stay runnable.
   - **Problem:** Android or iOS may suspend or kill it when the user switches to another app. Expo's `expo-background-task` uses deferred, OS-scheduled work, not a guaranteed immediate backup; passwords are deliberately not written to disk for a restart.
   - **Fix:** Current release preserves jobs across screen changes, resumes them when the existing process resumes and reports interrupted jobs honestly after a cold restart. **To guarantee uninterrupted Android processing while another app is foregrounded, build a native foreground service with a visible system notification and a separate development APK; Expo Go cannot provide that guarantee.** iOS has additional OS limits.
   - **If skipped:** Claiming 'background complete' after the OS stopped the job would mislead the user and could imply a backup exists when it does not.
   - **Status:** Native guaranteed background execution **not implemented**; it is a platform/build requirement, not a defect hidden by the UI.

8. **New dependency/version compatibility needs device acceptance** (`package-lock.json`, `src/store/expoAesGcm.cjs`).
   - **What this is:** Node tests inject independent AES/PBKDF2 references because the actual Expo native implementation is unavailable in this execution environment.
   - **Problem:** A mocked native contract alone cannot prove the installed Expo Go ABI, Android native encryption and AES metadata serialization will work.
   - **Fix:** The app runs PBKDF2/AES/gzip known-answer self-tests and fails closed if they disagree. Run `npm install`, Expo Go backup encryption, protected backup import, and old `.niyav` import on Android before a checkpoint.
   - **If skipped:** A source-only success could be mistaken for a device-tested release.
   - **Status:** Release gate open pending on-device verification.

## Nice to have

9. **Button sizes differed between shared components** (`src/ui/uiControls.js`).
   - **What this is:** Buttons and segmented controls had inconsistent visual heights relative to New task.
   - **Problem:** The header action looked smaller than other screen controls.
   - **Fix:** Unify Button/Chip/Segmented/IconBtn at 40-point visual height with compact labels/padding and 4-point hit slop for individual buttons; keep any larger control whose layout or accessibility specifically requires it.
   - **If skipped:** Controls keep visibly uneven proportions.
   - **Status:** Fixed in shared UI kit; native touch testing pending.

## Evidence and QA

- Full local Node suite: **665 tests, 664 pass, 0 fail, 1 skipped** before final packaging.
- JS/JSX/JS CommonJS syntax parse: **241 source/test files, 0 diagnostics**.
- Backup-job tests cover screen unmount, complete+download, restart metadata, decryption not auto-applied, cancellation, overlapping jobs, interrupted-job notice, encrypted-only persistence.
- Cipher tests use Node's independent `crypto` and `zlib` references with AES-GCM known answer, PBKDF2 known answer, wrong password, authenticated header tampering and legacy format round trip.
- Package-lock has no `@noble/` package entries. `package.json` and `app.json` both identify 0.5.54.
- **Not run:** npm install on the user's Termux, Expo Go Android/iOS runtime, actual app minimizing, OS process termination tests or browser visual QA. On-device results are required before commit or promotion to `main`.

**Verdict:** The package-exports warning and screen-unmount cancellation were real issues; addressed in this release without changing the encrypted backup file format. Guaranteed OS-level background processing remains open and requires a native service rather than a JS-only Expo Go change.

**Lean:** Remove 2 Noble dependencies; add 1 maintained HMAC dependency. No additional background-scheduler package added because it cannot satisfy user-initiated, immediate backup processing.

**Not checked:** Every Timeline/Kanban business rule, the actual npm registry install, device profiler timings, iOS background behavior, and real native Expo encryption.
