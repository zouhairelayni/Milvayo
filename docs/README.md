# Niyarvo Projects — Engineering Workspace

**Product:** Niyarvo Projects  
**Release:** `0.1.0` — local-first web/PWA foundation  
**Stack:** React Native / Expo SDK 58 / React Native Web  
**Ownership:** Separate repository and Firebase project.

Niyarvo Projects is an independent project-management product. It has **no integration with, account connection to, or backend access to any other Niyarvo-branded application or athletic product**. Any project or roadmap later imported into it is *ordinary user-provided project data*, not a technical integration.

## What this release implements

- Desktop dark operations dashboard with left sidebar, task status metrics, acceptance-test counts and honest charts derived from current project data.
- Mobile responsive workspace with bottom navigation and drawer for remaining screens.
- Kanban board (Backlog, In progress, Validation, Done), task search, task edit panel, priority, stage and project fields.
- Per-task acceptance checks with status and evidence, expected/actual results, rollback notes, branch, patch SHA and merge SHA.
- Local verification and merge-recording gates; these **do not actually create Git commits**.
- Releases and checkpoints: create/edit release, version, repository, notes, main SHA. “Released” requires linked tasks to be individually verified and marked merged.
- Project switching, creating and deleting projects with a local recovery snapshot.
- Project data schemas, API contracts, phases and playbook viewer (from imported project files).
- Full-workspace and single-project JSON export; import with preview/confirmation; local workspace snapshots and restore.
- Offline-capable PWA shell, manifest and service worker; no secret keys, Firebase credentials or service accounts in source.
- Nine deterministic Node unit tests for import format, verification, release gates and workspace restore.

**Not implemented in 0.1.0:** Cloud-synced database, multi-device sync, authentication, team permissions, GitHub API operations, attachment binary storage, encrypted cloud backups, native document picker/sharing or any import of the user's existing roadmaps. These are future release work. Hosting the web bundle does not add them automatically.

### Security note

The PWA is **local-first**, not a remotely authenticated private app. Firebase Hosting serves static files publicly; the workspace data stays inside this browser’s local storage unless exported. **Do not upload sensitive project details to a public hostname with the expectation that the site itself has access control.** Before adding cloud persistence, integrate Google sign-in in a *separate* Firebase project and enforce account isolation in Firestore rules, with emulator tests.

## Termux installation

1. Create/extract to a separate folder, not inside another project:

   ```bash
   pkg update -y
   pkg install -y git nodejs-lts unzip python
   mkdir -p ~/NiyarvoProjects
   unzip -q ~/storage/downloads/NiyarvoProjects-v0.1.0-source.zip -d ~/NiyarvoProjects
   cd ~/NiyarvoProjects
   ```

2. Install/test/export:

   ```bash
   npm install --no-audit --no-fund
   npm test
   npx expo install --check
   npx expo export --platform web --output-dir dist
   ```

3. Serve the export without Metro's large file-watch list (Android/Termux):

   ```bash
   python -m http.server 8083 --bind 127.0.0.1 --directory dist
   ```

   Open **http://localhost:8083** in your phone browser. You may need to refresh after the PWA service worker activates. The dev server is optional; static export is preferred on Android when Metro hits an `ENOSPC` watcher limit.

## Creating an *independent* Firebase Hosting project

Use your other Google account to create a new Firebase project (example project ID `niyarvo-projects-workspace`; choose an available ID). **Do not use `rivnafit` or any existing Firebase project.** In the new project, activate Firebase Hosting (Spark is sufficient for static hosting within its quota). From `~/NiyarvoProjects`:

```bash
npm install -g firebase-tools
firebase login --no-localhost
# select the separate Google account in the auth browser
firebase projects:list
npm run build:web
firebase deploy --only hosting --project YOUR_NEW_FIREBASE_PROJECT_ID
```

The included `firebase.json` deploys only the `dist` directory. Always pass the explicit **new** project ID to avoid deploying into another Firebase project. Do not deploy before you review the privacy note above. See Firebase Hosting docs: https://firebase.google.com/docs/hosting/quickstart

## Import / export schema

Project import files are JSON with `format: "niyarvo.project.v1"`. See `examples/EXAMPLE.project.json` and `schemas/niyarvo.project.v1.schema.json`. An import can include project details, phases, tasks, status, acceptance checks/evidence, releases, schemas, API contracts and playbooks. The import UI saves an **entire workspace** recovery snapshot first, including on workspace replacements. A workspace export uses `exportFormat: "niyarvo.workspace.v1"` and retains all projects and stored recovery history.

**A JSON file is not executable code**. Imported text is displayed as text rather than injected into the web page. Keep files smaller than 5 MB; do not import unknown files. Export a portable JSON copy periodically, because browser storage can be cleared or evicted.

## Git source workflow

Create a private repository named `NiyarvoProjects` under an account you control. In Termux:

```bash
cd ~/NiyarvoProjects
git init -b main
git add .
git commit -m 'feat(projects): independent workspace foundation v0.1.0'
git remote add origin https://github.com/YOUR_USERNAME/NiyarvoProjects.git
git push -u origin main
```

For later patches, use `feature/NP-...` branches; run Node tests, export, verify on Android Chrome, record evidence, then merge to main. Release-note checkboxes in the UI record progress, not repository actions.

## Known limitations / next engineering milestones

1. **NP-001:** Install/export web on Android, manually verify board/cards/forms/import/restore on Chrome.
2. **NP-002:** Create separate Firebase project; authentication, per-user ownership and Firestore rules tested against emulator.
3. **NP-003:** Optional cloud sync with conflicts, version histories, transactional writes and offline queue.
4. **NP-004:** GitHub connector for real branches, commits, PRs and release status (token stored securely, server-side).
5. **NP-005:** Encrypted file attachments, cloud backups and restore audit.
6. **NP-006:** Import adapter for the user's roadmaps as **one project import file** after the workspace UI is accepted.
7. **NP-007:** App icon/typography/accessibility/browser performance regression and PWA install testing.

## Release evidence

The container environment ran `npm test` successfully (9 of 9) and TypeScript's JSX source parser with no errors. `npm install` did not finish in this isolated environment because the package registry was unreachable. Therefore **no successful Expo export or real browser interaction is claimed**. The Android/Termux build instructions above are the pending integration test.
