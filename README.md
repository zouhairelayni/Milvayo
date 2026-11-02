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

Source-level tests and syntax checks verify business-logic pathways but **cannot certify native Expo Go rendering or gestures**. In particular, verify Timeline task bars and dependency SVGs stay visible after initial mount, Kanban scrolling and long-press dragging, and navigation responsiveness on Android/iOS. The v0.5.9 changelog is under `docs/changelogs/modern-code/`, and its QA checklist is under `docs/qa/modern-code/`. Historical source documentation is archived separately in `docs/legacy-code/`.

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

Moved the existing in-app Dynamic Island animation to a top-of-window layer with a platform-aware status-bar/notch inset and 10-point visual clearance. The animation and dismissal behavior are unchanged. On phones it may temporarily overlap the header while expanded, but it no longer sits over task filters or the scrolling page. This is not a system notification. See `docs/changelogs/modern-code/CHG-NP-0.5.7.md`.

## v0.5.8 — Web scroll and offscreen rendering fix

Web Kanban and Timeline now use a browser pointer-based stationary-hold drag hook, rather than a PanResponder that claims touches on pointer-down. Normal swipes scroll without fighting the ScrollView responder. Heavy Board/Timeline screens unmount when hidden on web as well as native; this reduces repeated offscreen React renders. Native gesture handling and layout geometry remain unchanged. Console diagnostics now distinguish the count of `console.error` calls and exceptions from the number of actual captured JS exceptions.
