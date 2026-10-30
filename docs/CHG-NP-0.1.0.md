# CHG-NP-0.1.0 — Niyarvo Projects foundation

| Field | Observed state |
|---|---|
| Product | Niyarvo Projects — independent project management product |
| Scope | React Native + Expo Web PWA starter with desktop/mobile layout |
| Project integration | No connections to RIVNA or Niyarvo Control Center |
| Firebase integration | Not configured. `firebase.json` provides **Hosting only** |
| Cloud authentication | Not implemented |
| Sample content | Neutral fictional Northstar Studio example only |
| Source repository | Not created/pushed by assistant |
| Node tests | 9/9 passed locally |
| App JSX parser | Passed TypeScript JSX parser |
| Expo dependency installation | Not verified in this sandbox (registry timeout) |
| Real web export/browser testing | Not run; must be performed in Termux |
| Android APK | Not built or requested |

## Feature modules

- Overview dashboard: derived task/check metrics and stage distribution.
- Kanban board and task list/search.
- Task detail: check evidence, actual/expected, branch/main SHA, rollback.
- Release creation/editing with gated Released status.
- Project selector, add/delete, backups/restore, data schema & API readouts.
- Import/export using `niyarvo.project.v1`; workspace JSON export and import.
- PWA manifest/service-worker source prepared.

## Risks and limitations

- `AsyncStorage` on web is local browser storage, not an encrypted or server-side backup.
- No user login, access permissions, cloud synchronization, GitHub actions or real Git verification.
- Sample verified entries are demonstration fixtures, not observed releases.
- No user roadmap was imported as part of this delivery.
- Firebase Hosting alone does not restrict site access.

## Next model handoff

1. Install dependencies in Termux and run `npm test`, `npx expo install --check`, and `npx expo export --platform web --output-dir dist`.
2. Serve `dist` on localhost:8083. Validate all views on desktop/mobile; test new task, release, verification gating, project switch, export/import and restore.
3. Address any RN SDK 58 web issues without changing the versioned import schema prematurely.
4. Create a separate Firebase project (never use existing other project IDs), then implement auth/security before cloud storage.
5. Only after UI and project schema acceptance convert the engineering roadmap to a single imported `.project.json`.
