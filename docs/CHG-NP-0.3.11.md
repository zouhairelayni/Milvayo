# CHG-NP-0.3.11 — Board Power-Ups and GitHub references

## 0. READ FIRST — release handoff

| Field | Observed value |
|---|---|
| Product | Niyarvo Projects (independent of RIVNA/Control Center) |
| Release | v0.3.11 — local QA candidate |
| Base | v0.3.10 cumulative release source |
| Scope | Trello-informed Kanban improvements and original, built-in Power-Up system |
| Git | User-managed `work` branch; no commit, push, merge or tag performed |
| Cloud | Not connected; original local-first AsyncStorage and project JSON format |
| Test result | 278/278 Node tests passed; no Android/iOS/Web runtime test |
| Third-party source | Niyarvo code original; Trello public documentation consulted |
| Unavailable reference | User uploaded `kanban.zip`, but its original bytes were not mounted/readable in this session. Do not claim the internal release was inspected or incorporated. |

## 1. Implementation and behavior

- Added a board-specific built-in extension registry (`src/powerUps.cjs`): GitHub, Due date calendar, Card aging, Checklist progress. The Main board defaults to no extensions enabled; users opt in per board. No arbitrary third-party code is executed.
- Added Power-Ups panel to the Kanban board, with an enable/disable control per extension. Enabling a Power-Up does not mutate task statuses, releases or dependencies; disabling it hides the functionality without deleting persisted GitHub links.
- Added task-level GitHub reference attachments: issues, pull requests, commits and branches, restricted to canonical `https://github.com/<owner>/<repo>/...` URLs. Rejects spoofed hosts, non-HTTPS, URL credentials, query parameters, unsupported routes and duplicates.
- Added optional on-demand **unauthenticated public** GitHub API preview for titles, state (including merged PRs), author, labels and comment count where available. Private repositories and authenticated OAuth access are **not implemented**. No tokens are stored, and no GitHub write operations are performed.
- Added upcoming tasks (within 30 days) when Calendar Power-Up is enabled; age indicator for unfinished cards updated 7+ days ago; checklist completion strip when enabled.
- Improved Kanban cards with slightly tighter spacing, GitHub attachment counts, conditional aging badge and checklist progress strip. Every lane has an Add card action that preselects its workflow status; preserved long-press full-card drag and per-column independent heights.
- Extended `niyarvo.project.v1` optional metadata: `powerUps` board-keyed array selections and `tasks[].githubLinks`. Missing fields default to empty, preserving legacy projects.
- Removing a board also removes its extension settings and moves tasks to Main. Linked GitHub references stay on tasks for recovery.
- Increased app version to 0.3.11 in `package.json` and `app.json` without adding dependencies.

## 2. Changed source files

- `App.js` — Board Power-Ups launcher, optional card adornments, contextual Add card, task editor GitHub references
- `src/PowerUpsPanel.js` — new board extension UI and GitHub card UI
- `src/powerUps.cjs` — new isolated domain/validation/API-preview module
- `src/model.cjs` — normalize, validate, preserve Power-Ups and task links
- `src/boards.cjs` — extension cleanup when deleting a board
- `schemas/niyarvo.project.v1.schema.json` — optional fields documented
- `tests/powerups.test.cjs` — 14 new tests, including Atlas import, failures and GitHub spoofing
- `README.md`, `package.json`, `app.json`, release documentation

## 3. Validation (facts versus pending checks)

| Check | Status | Evidence |
|---|---|---|
| Full Node test suite | PASS | 278 tests, 0 failures (`docs/NP-v0.3.11-test-results.txt`) |
| Existing 264 tests | PASS | Included in suite |
| Source syntax: CommonJS | PASS | `node --check` |
| JSX source parsing | PASS | TypeScript JSX parser |
| Valid JSON files | PASS | Python JSON decode |
| ZIP integrity and clean extraction | PASS | See final packaging QA log |
| Expo SDK package compatibility | Not run | `npx expo install --check` in Termux |
| Metro Web/Expo Go performance | Not run | Device required |
| Actual live GitHub API request | Not run | Automated `fetch` fixture tests only |
| GitHub OAuth, private repositories | Not implemented | Requires secure backend authorization |
| External arbitrary Power-Up installation | Not implemented | Curated built-in extensions only |

## 4. Android acceptance checklist

1. Export current workspace and check `git status --short` on `work` before extraction.
2. Launch v0.3.11, open Atlas and Board. Check cards, independent column heights, lane Add card and long-press drag (including moving to a different column).
3. Open Board → Power-Ups. Enable GitHub only on Main, verify a second board remains disabled. Enable Calendar, Aging and Checklist individually.
4. Open a task on a GitHub-enabled board; attach a public issue/PR/commit/branch URL. Check the reference persists after restart and export/import. Test a spoofed GitHub host is rejected.
5. Select Refresh public details on a public reference only; verify it shows real data, or a useful network/rate-limit error. Confirm private repo links are not claimed as authenticated.
6. Disable GitHub, verify linked information is retained; re-enable and check again.
7. Delete a non-Main board after taking a backup: tasks move to Main and extension selections for that board are removed.
8. Regress Android Timeline with Atlas, Board scrolling/dragging, task editor, Sprint burndown, JSON import and safe-area spacing.

## 5. Rollback and next-model handoff

Restore the previous `work` checkpoint and previously exported JSON workspace if runtime issues appear. Do not merge to main until device QA. The Power-Up engine is currently a fixed set of **first-party in-app extensions**. In a future Firebase phase, implement server-side GitHub OAuth through least-privilege permissions, encrypted token storage and audited revocation; do **not** put GitHub access tokens in Firestore client-visible documents or client bundles. Reassess arbitrary extension sandboxing, permissions and data access separately before allowing untrusted Power-Up code.
