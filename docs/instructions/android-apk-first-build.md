# Milvayo v0.5.59 — direct GitHub ARM64 APK build

**Build location:** GitHub-hosted Ubuntu runner. **No EAS cloud build**. GitHub installs Node/Java/Android tooling, runs `npm ci --legacy-peer-deps` and tests, generates `android/` using `npx expo prebuild`, then runs Gradle `:app:assembleRelease -PreactNativeArchitectures=arm64-v8a`. The uploaded artifact includes an installable signed APK and SHA-256 file.

The existing Expo project is linked to `com.milvayo.projects`; the signing key already exists on EAS. We only **export that existing key once** to GitHub secrets. Do not generate a second keystore: Android updates must use the same signing identity.

## First-time setup in Termux

**A. Download existing credentials securely**

1. While in `~/Milvayo`, run `npx --yes eas-cli@latest credentials -p android`.
2. Select the `preview` profile, then `credentials.json` -> **Download credentials from EAS to credentials.json**. Follow the prompts to download the existing Android keystore and a credentials JSON containing `keystorePath`, `keystorePassword`, `keyAlias`, `keyPassword`. **Do not select Generate new keystore.**
3. Move the credentials JSON and JKS file to a private folder *outside* the repository, for example `~/milvayo-private/`. Preserve their relative paths (or update the JSON `keystorePath` accordingly). Keep the files only on your own device. The `.gitignore` excludes `credentials.json`, `.jks`, `.keystore` and `.env*` from Git.

**B. Store the four signing secrets without exposing their contents**

Use this helper from the **work** branch after applying the patch (the path points to your own exported file):

```bash
cd ~/Milvayo
git switch work
node scripts/ci/upload-android-signing-secrets.cjs ~/milvayo-private/credentials.json
gh secret list -R zouhairelayni/Milvayo
```

It creates these secrets in the Milvayo repository:

- `NIYARVO_ANDROID_KEYSTORE_BASE64` (the original keystore file, encoded)
- `NIYARVO_ANDROID_KEYSTORE_PASSWORD`
- `NIYARVO_ANDROID_KEY_ALIAS`
- `NIYARVO_ANDROID_KEY_PASSWORD`

The GitHub Actions workflow still reads the `NIYARVO_ANDROID_*` secret names. Keep those repository secret names until the workflow and stored secrets are migrated together; they are compatibility identifiers, not current app branding.

**Never share** the JSON, JKS, passwords, token, or Base64 text in chat or Git. The helper only prints secret *names*. Base64 is an encoding, not encryption; GitHub secret storage protects it.

**C. Commit, merge, and trigger**

```bash
cd ~/Milvayo
git switch work
npm test
git add .github/workflows/android-apk.yml .gitignore README.md docs/changelog/CHANGELOG.md docs/instructions/android-apk-first-build.md scripts/ci/upload-android-signing-secrets.cjs tests/app/board-launcher-apk-059.test.cjs
git rm scripts/ci/eas-apk-url.cjs
git commit -m "fix(ci): build signed ARM64 APK directly on GitHub instead of EAS cloud"
git push origin work
git switch main
git pull --ff-only origin main
git merge --no-ff work -m "merge(hotfix): direct GitHub ARM64 APK build"
git push origin main
gh workflow run android-apk.yml --ref main -R zouhairelayni/Milvayo
```

**Note:** if `package.json` and `package-lock.json` are still modified after repairing six Metro/Babel dependencies, include those two files in the same `work` commit (run `git add package.json package-lock.json` before `git commit`), or GitHub will still use the old lockfile.

## Expected result and validation

From GitHub Actions -> `Milvayo · Android APK`, wait for successful jobs and download artifact `Milvayo-v0.5.59-arm64-<run number>`. It contains `Milvayo-v0.5.59-arm64.apk` and SHA-256 checksum.

Checks enforced in CI:

- Existing keystore must match the SHA-256 certificate `23:F8:19:EA:5C:EA:EE:57:D1:C2:27:40:99:38:6C:E2:FC:35:31:B0:5E:EA:FE:A6:CA:B5:EA:99:6E:DB:B0:F4`.
- APK must contain **only** `arm64-v8a` shared native libraries.
- Android's `apksigner` must verify the APK signature and matching certificate.
- No Expo token, EAS `build --wait`, or Expo cloud build in the workflow.

`eas.json` and the Expo project link remain intact for identification and credentials management, but are not used to build the APK. The existing `EXPO_TOKEN` GitHub secret is unnecessary for this workflow; it can be removed separately when no other jobs need it.

**No Firebase integration in this release.** After installation test the cold-start Board morph, drawer logo replay, navigation, board drag, Gantt/timeline, encrypted backup restore, app restart, and device rotation.
