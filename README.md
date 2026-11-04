# Niyarvo Projects — full source v0.5.59

Expo SDK 58 app for Android/iOS and Web, based on the v0.5.58 release. **Application version is 0.5.59**; there is no workspace, backup, or `.niyav` format change.

**v0.5.59 Android APK preparation:** The official three-column Projects Board symbol with six card cutouts is now the Coral default app/launcher icon on Android, iOS and PWA. Ten colorway icons ship as assets. The selected accent updates the Web tab favicon; installed launcher icons remain Coral until native alternate-icon support is implemented. Added `.github/workflows/android-apk.yml` for an ARM64-only APK compiled and signed directly on the GitHub runner (Expo prebuild + Gradle; no EAS cloud queue). GitHub signing setup reuses the existing Niyarvo EAS keystore via encrypted repository secrets; see `docs/instructions/android-apk-first-build.md`. The source ZIP does not include a built APK and has not triggered a cloud build. Firebase collaboration remains a separate future phase.



**v0.5.58 brand motion:** The user-approved flicker-free N-to-Board logo morph is now a single cross-platform `react-native-svg` component. A logo-only splash plays at 1× on each cold JS launch, after saved theme preferences load, before the workspace mounts. The mobile drawer shows the animated Board mark at 1.5× on every opening; the desktop rail uses the finished static Board mark. The appearance toggle is immediately beside the drawer hamburger. Source animation data and math live in `src/components/brand/`. No WebView, new packages, masks or extra branding elements are used. Six Board windows open sequentially in 3–2–1 order. Reduced-motion users see the completed mark immediately.

**User-selected color palette:** `src/ui/theme/themePalette.cjs` contains the exact 10 color rows supplied by the user (including Daylight Amber `#FFA500`, Orange `#E65A19`, and Dark Orange `#FF6F61`). AMOLED keeps pure black `#000000` and darkens card/secondary surfaces with multipliers `0.50` and `0.35`. Other brightness tokens are unchanged. All theme-accent-filled action buttons and their icons now use white ink by explicit user request. This can reduce text contrast on the lightest accent colors.

**Navigation and branding:** The hamburger has three horizontal strokes at 18px (20% larger than the previous 15px icon), rotating into three vertical strokes while the menu is open. The drawer appearance icon is sun in Daylight, outline moon in Dark, and filled moon in AMOLED. The open hamburger is rendered once inside the drawer at the original top-left header position, never floating outside the panel. **PROJECTS** uses a custom vector monoline word mask matching the hand-outlined Niyarvo wordmark; its transparent PNG is 20% smaller, tinted to the exact active accent (matching the selected Board accent family), and right aligned. No font assets or new dependencies are needed.

**Password checks:** An existing encrypted `.niyav` backup cannot verify an incorrect password until its stored PBKDF2 key-derivation work is complete. We do not add a cheap password check because that would speed up offline attacks. The Backup UI explains progress and keeps the selected encrypted file in memory for a retry after a wrong password; typed passwords are cleared promptly.

**Background limitations:** Navigating within the app does not cancel jobs. On Web, completed encrypted backups are memory-only and are lost after a page reload; download before refreshing. Android/iOS may pause ordinary Expo Go JavaScript after switching apps, and process termination interrupts unfinished jobs. Completed encrypted files are retained for later download; encrypted material only is persisted. A completion event received while backgrounded is shown when the app returns to the foreground. This is an in-app notification, not an operating-system push.

**Termux update:** Keep existing `.git`, dependencies and app data. Extract this full ZIP into `~/NiyarvoProjects`, run `npm test`, then `npx expo start --clear`. This version adds no dependencies; `npm install` is not required if v0.5.54 is already installed. Confirm a newly exported encrypted file and an older `.niyav` open on your Android before committing. The archive has no enclosing top-level folder.

Current release notes and QA: `docs/changelog/CHANGELOG.md` and `docs/qa/modern/NP-v0.5.58-PONYTAIL-AUDIT.md`.

## Historical release documentation (older setup instructions below are archival)

# Niyarvo Projects v0.5.9 — Governance migration

Niyarvo Projects is a local-first, cross-platform project management application using Expo and React Native. All screens now run inside the modern Niyarvo interface; the original v0.4.1 domain modules continue to validate the project data behind it.

## Installing on an existing Termux checkout

This full source ZIP deliberately **does not include `package.json`, `package-lock.json` or `node_modules`**. Preserve those three files/folders from your working installation (including the locally corrected `expo-font` dependency), then extract the ZIP at the project root:

```sh
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects-v0.5.9-GOVERNANCE.zip -d .
npx expo install expo-document-picker
npm test
npx expo-doctor
npx expo start --clear
```

The ZIP does not contain an enclosing parent directory. If this is a truly blank folder without `package.json`, obtain a known compatible Expo SDK 58 manifest before installation; this ZIP alone is not sufficient to install dependencies from scratch.

## Screens

Overview · Board · Timeline · Scheduling · Tasks · Task configuration · Sprints · Releases · Testing · Resources · Collaboration · Costs · **Governance** (Projects → Portfolios → Programs) · Automations · Reports · Activity · Specifications · Backup · Settings.

Project management, task hierarchy, schedules, sprint safeguards, releases, resources, financial reports, portfolios, local automation commands and backup recovery use the original data model. Projects, Portfolios and Programs are independent management screens grouped under Governance. They use `src/domain/projectRelations.cjs` and a single canonical workspace store for shared membership and roll-ups and the existing canonical workspace store. Complex controls are organized in collapsible sections and inline task rows.

The application is local-only: it does **not** provide remote multi-user sync, push reminders, authenticated GitHub operations or cloud-run automation. Existing Firestore readiness files do not imply enabled cloud services.

## Storage and safety

The existing AsyncStorage key remains `niyarvo-projects-v1`. Never clear app data or reinstall without first exporting a complete workspace backup from Backup. Destructive operations require explicit confirmation and/or create local recovery snapshots.

## Verification

Source-level tests and syntax checks verify business-logic pathways but **cannot certify native Expo Go rendering or gestures**. In particular, verify Timeline ribbon and calendar remain pinned while vertically scrolling, and task bars and dependency SVGs stay visible after initial mount, Kanban scrolling and long-press dragging, and navigation responsiveness on Android/iOS. The consolidated complete v0.1.0–v0.5.53 change history is in the repository-root `docs/changelog/CHANGELOG.md`.

## v0.5.2 task experience

The Tasks page uses saved task status for its completion checkboxes. A long press selects tasks for bulk actions. Status and label filters live under one disclosure. Automations support an explicit checked-task destination (Done or Validation), safe status actions, due checks, card-aging checks and presets. The appearance menu contains Orange and nine alternative accents, saved locally.

Native inline notices use Reanimated motion and are anchored below the phone header (wide-screen notices honor the top safe-area inset). They are app notifications, not native Apple Dynamic Island Live Activities or operating-system push notifications.

## v0.5.3 — Projects / Programs / Backup / Navigation

- Project creation, editing, duplication, archival and confirmed deletion live in the **Projects** manager above Programs and Portfolios. Destructive deletion preserves a local pre-delete workspace snapshot and cleans up group memberships.
- **Programs** are distinct workspace-level coordination groups. They contain references to existing projects (no project/task copies), have Planned / Active / Completed states and survive full-workspace import/export and snapshots. Older workspaces receive an empty Programs list.
- Task configuration is now under **Operate**. Settings is for appearance and diagnostics; Backup manages JSON file transfer, snapshots and archived project recovery.
- Android/iOS `.json` import uses `expo-document-picker` with a cache copy read by `expo-file-system`, and export uses the existing `expo-sharing` flow. Install `expo-document-picker` in the user's retained manifest using Expo's installer; package manifests are intentionally absent from this release ZIP.
- Mobile screen titles are compact and placed in the header; the Niyarvo Projects SVG lockup is used in the drawer. Notices are presented within the safe area. Timeline retains one continuous task list and its Items control is aligned left.

## v0.5.4 — Drawer key and embedded logo lettering hotfix

- Removed duplicate `taskconfig` row from the shared NAV groups feeding Android/iOS drawer and desktop sidebar; Task configuration appears exactly once under OPERATE.
- Strengthened the embedded PROJECTS subtitle in both dark/light SVG logo files and regenerated their matching PNGs. Launcher icon and original colored monogram unchanged.
- Updated local diagnostics version and Expo app version to 0.5.4. No dependency changes.
- The provided performance data still shows Board navigation around 2 seconds; this narrowly scoped release does not claim to improve Board/Tasks transition latency.

## v0.5.5 — Entreprise PM and compact responsive headers

- Consolidated Projects, Programs and Portfolios into one Entreprise PM drawer destination, with separate feature source files and shared relationship selector.
- A program can now include portfolios; a portfolio includes projects. Existing direct program-to-project IDs remain readable and editable to avoid discarding historical memberships. Project summaries deduplicate projects belonging to multiple portfolios.
- Workspace normalization, snapshots and whole-workspace transfer preserve `portfolioIds`; portfolio deletion safely unlinks programs without removing projects or tasks.
- The shared mobile Page layout stacks the full-width subtitle above its own horizontal action row. This avoids word-by-word wrapping in Timeline and Automations, and applies to other screens using Page.
- Embedded PROJECTS logo lettering has been repositioned under the right side of Niyarvo and colored blue, then regenerated as transparent PNGs from the vector source.
- - Fixed the Android 15 notification overlay that could appear behind the status bar by anchoring the floating pill beneath the phone header, with a safe-area inset guard for wide screens.
- No new dependencies. Expo Go device QA is still needed.


## v0.5.6 — Dynamic Island-style in-app notifications

- The notification pill uses a compact → expanded → collapsed → dismissed lifecycle, with manual expansion/dismissal and a deliberate persistent error state.
- Android and iOS animations use Reanimated UI-thread worklets. Web uses React Native Web's Animated transitions. A restrained spring settle was inspired by classic Android animation references (the Android libraries themselves are **not** dependencies).
- Notifications remain anchored beneath the mobile header and Android status bar, or near the top center in desktop web. They are **in-app** notifications, not native system Dynamic Island Live Activities.
- No manifest changes or additional packages. Test device motion/placement before promoting to main.

## v0.5.7 — Dynamic Island at the top safe area

Moved the existing in-app Dynamic Island animation to a top-of-window layer with a platform-aware status-bar/notch inset and 10-point visual clearance. The animation and dismissal behavior are unchanged. On phones it may temporarily overlap the header while expanded, but it no longer sits over task filters or the scrolling page. This is not a system notification. See the current consolidated changelog (`docs/changelog/CHANGELOG.md`) for new changes.

## v0.5.8 — Web scroll and offscreen rendering fix

Web Kanban and Timeline now use a browser pointer-based stationary-hold drag hook, rather than a PanResponder that claims touches on pointer-down. Normal swipes scroll without fighting the ScrollView responder. Heavy Board/Timeline screens unmount when hidden on web as well as native; this reduces repeated offscreen React renders. Native gesture handling and layout geometry remain unchanged. Console diagnostics now distinguish the count of `console.error` calls and exceptions from the number of actual captured JS exceptions.
