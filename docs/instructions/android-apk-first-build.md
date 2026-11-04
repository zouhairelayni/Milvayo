# First Android APK build — GitHub Actions and Expo EAS (v0.5.59)

This release adds a **workflow**, not a prebuilt APK. It is not connected to your Expo account yet; only you can authorize the build and provide signing credentials. It builds a signed **internal preview APK**, not a Play Store AAB, on Expo's Android builders and downloads it into a GitHub Actions artifact.

## One-time setup from Termux

1. Extract `NiyarvoProjects-v0.5.59-FULL.zip` over the repository root, run `npm test`, and commit and push the files to your `work` branch. The new GitHub workflow must reach the remote repository before it can run.
2. In Termux, run `npx eas-cli@latest login`. Sign in to **your own Expo account** (not the RIVNA project).
3. Run `npx eas-cli@latest init` inside `~/NiyarvoProjects`. Select or create a **separate Niyarvo Projects** Expo project. This populates `expo.extra.eas.projectId` in `app.json`; do not type a fake project ID. Commit and push that additional configuration.
4. Run `npx eas-cli@latest credentials -p android`. Select the `preview` profile and let Expo generate/store the **Niyarvo Projects Android keystore**. This should be a different key from RIVNA. The GitHub workflow does not need a keystore secret when using EAS-managed credentials.
5. On [Expo account settings](https://expo.dev/settings/access-tokens), create a personal access token with access to the newly linked project. In Termux, set it on your GitHub repository without committing it:

   ```bash
   cd ~/NiyarvoProjects
   read -rs -p 'Expo token: ' EXPO_TOKEN; echo
   printf '%s' "$EXPO_TOKEN" | gh secret set EXPO_TOKEN
   unset EXPO_TOKEN
   ```

   `gh` should already be authenticated to the correct **Niyarvo Projects** repository. Never paste the token into source files or a commit.

6. Merge your tested `work` branch into `main`, then trigger the workflow:

   ```bash
   gh workflow run android-apk.yml --ref main
   gh run list --workflow android-apk.yml --limit 3
   gh run watch
   ```

   Alternatively, use **GitHub → Actions → Niyarvo Projects · Android APK → Run workflow**.

7. When the run completes, download its `NiyarvoProjects-Android-APK-*` artifact on the Actions page, or through `gh run download <RUN_ID> -D ~/storage/downloads/np-apk`. The resulting `NiyarvoProjects-preview.apk` is directly installable on Android (allow installation from your file manager if prompted).

## Build and signing properties

- Profile: `preview` / `distribution: internal` / `android.buildType: apk`.
- Package identifier: `com.niyarvo.projects`.
- Uses Expo SDK 58 with Node.js 22 and `npm ci` from the committed lockfile.
- The `.apk` is signed by EAS-managed credentials; do not delete or rotate the signing key casually because upgrades of the installed app require the same key.
- App data remain local in this release. Firebase Authentication, Firestore, invitations and permissions are **not** activated.
- The workflow requires `EXPO_TOKEN` and a linked `extra.eas.projectId`; it reports a clear failure if either is missing.
- No GitHub repository, cloud build or APK has been created or triggered by this source ZIP on your behalf.

## Logo and icon behavior

- The **six-window Board symbol** is the official launcher icon for PWA, Android and iOS, with Coral as the default accent.
- Android uses an adaptive colored foreground and a monochrome drawable compatible with Android's system-themed launcher icons.
- Every accent has a bundled 1024px candidate icon (`assets/app-icons/`) and a 64px browser-tab icon (`public/icons/colorways/`).
- On Web, changing accents changes the browser-tab favicon. The PWA *installed launcher icon* stays Coral; browser/OS support for automatically replacing an installed PWA icon is unreliable.
- On Android and iOS, changing the **in-app accent** does not yet change the *installed launcher icon*. Runtime switching requires a native alternate-icon implementation with predeclared icons and a new development/preview build. Expo Go cannot test that native behavior. **Do not claim dynamic native launcher icons are implemented in v0.5.59.**

## What to test before adopting Firebase

Install the preview APK and verify cold-start morph, animation smoothness, navigation, Kanban drag, Gantt performance, Sprints, Settings, encrypted `.niyav` creation and restore, app restarts, screen rotation, deep links, and launcher artwork. Keep a known-good `.niyav` backup and your current app installation until the new preview build is accepted.

Only after device acceptance should you configure **Niyarvo Projects' separate Firebase project** and design account/session roles and card-level invitation permissions. Never reuse RIVNA's Firebase identity, Firestore data or admin collections.
