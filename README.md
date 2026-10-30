# Niyarvo Projects — v0.2.0 local-first QA candidate

Independent multi-project management app built on Expo SDK 58 / React Native (Web, Android, iOS). No integration with RIVNA or Niyarvo Control Center. The former Northstar sample remains the only preloaded project; engineering roadmaps are **not** bundled.

## What's implemented

- Dark responsive dashboard with multiple local projects and task/release CRUD foundations.
- Kanban board with gesture handles (PanResponder) for moving and ordering cards within/across four lanes. Card details retain a status-choice fallback for touch/accessibility. Drop is based on measured lane/card positions.
- Dependency graph with self-reference, missing-reference and circular-dependency validation. Incomplete prerequisites block transition to Done.
- Date-based roadmap timeline (14/30/90 days), clickable task bars and one-day shift controls; editable start/due dates on task detail.
- Local on-move automation rules: set priority, stage, owner, or due date offset, with enable/pause.
- Task attachment **URL references** (link open and removal); actual binary upload is *not* implemented.
- Web and Android/iOS JSON project/workspace import/export (native document picker + share sheet). Project import validation, snapshot recovery and preserved imported workspace history.
- Niyarvo-branded PWA/Android/iOS icons created from the supplied centered Niyarvo symbol.
- Local AsyncStorage persistence with serialized writes and guarded startup on corrupted data; project snapshots and release-readiness indicators.

## Local development using Termux

```bash
cd ~/NiyarvoProjects
npm install
npm test
npx expo install --check
npx expo start
```

Use Metro/Fast Refresh for both Expo Web and Expo Go. No Python static server required. The source ZIP does not include `node_modules` or a native build. New Expo packages: `expo-document-picker`, `expo-file-system`, `expo-sharing`.

## What is NOT proven/implemented

- **No runtime tap/gesture E2E QA on your phone or desktop browser has been observed for v0.2.0.** JSX parsing and Node model tests are not substitutes for running Metro/Expo Go.
- Cross-device collaboration, realtime sync, secure authentication, cloud file uploads, comments/notifications, collaborative users/permissions, undo/redo history, recurring tasks, multi-board swimlanes and user-configurable automation integrations are still future work.
- No Firebase project is connected or deployed, no iOS build tested, no GitHub branch/remote/commit created from this archive.
- This application is currently a local-first single-device prototype. Do not import sensitive/critical workspaces until recovery, local exports and device QA are accepted.

## Safe Firebase Hosting workflow (later, after local QA)

Create a **separate** Firebase project specifically for Niyarvo Projects, install Firebase CLI, log in with the intended account, and confirm the project ID. The guarded deploy script refuses to run without an explicit new project ID:

```bash
export NIYARVO_PROJECTS_FIREBASE_PROJECT_ID=your-new-firebase-id
npm run deploy:hosting
```

Hosting deployment builds the Expo Web bundle separately and deploys **only Hosting**, not Firestore or Storage. Firestore and Storage rules in this repo are deny-all placeholders. Do not enable cloud sync until dedicated Firebase Auth, per-workspace ownership/security rules, tests and backup strategy are ready.

## Git checkpoint protocol

1. Commit the current **tested** v0.1.0 baseline to your dedicated Niyarvo Projects repo if not already done.
2. Create a working feature branch (e.g. `feat/np-v0.2-boards-roadmap`) from that known baseline.
3. Back up/export real local workspaces before extracting the new ZIP into the project directory.
4. Install dependencies, run tests, start Metro and run the included manual QA flows; fix failures on the branch.
5. Commit the patch only after it passes and then merge the verified branch into `main`.

Read `CHG-NP-0.2.0.md` for evidence, risks and detailed QA instructions.
