# CHG-NP-0.3.11-HOTFIX2 — Niyarvo Projects

## 0. Read first — release and handoff

| Field | Observation |
|---|---|
| Product | Niyarvo Projects (independent project-management application) |
| Baseline | v0.3.11-HOTFIX1 complete source ZIP |
| Batch | v0.3.11-HOTFIX2 |
| Status | **Source-level QA passed; Web and Android runtime acceptance not run** |
| User-reported defect | Expo Web fails during `BrandMark` rendering; stack points to `react-native-svg/lib/module/web/WebShape.js:74`, invoked from `src/BrandMark.js` |
| Root-cause confidence | High for this rendering path; the stack indicates the Web SVG adapter, but the complete thrown exception message was not supplied |
| Data migration | None |
| New dependencies | None |
| API / storage / schema changes | None |
| GitHub changes | No commits, merges or pushes performed |

## 1. Change summary

- **NEW `src/BrandMark.web.js`:** Web-only Niyarvo brand icon implementation using ordinary browser SVG and path elements via React's `createElement`. The Web bundler resolves this platform-specific module from the existing unqualified `import BrandMark from './src/BrandMark'`.
- **UNCHANGED `src/BrandMark.js`:** The original four-path `react-native-svg` implementation remains in place for Android and iOS. No native SVG behavior has been modified.
- Both implementations use the same centered Niyarvo mark geometry (800 × 760 viewBox) and preserve default/original selected accent plus optional explicit tint. The Web rendition has accessible image text.
- This avoids the failing `react-native-svg` `WebShape` path **for the Niyarvo mark only**. Other SVG-based app components (for example Gantt) continue to use the existing drawing library.
- No menu, Kanban, sprint, import, authentication, or persistence logic changes.

## 2. Files

| File | Operation | Reason |
|---|---|---|
| `src/BrandMark.web.js` | Added | Web-native SVG logo, avoiding Web adapter |
| `tests/brand-mark-web.test.cjs` | Added | Platform-resolution contract, original geometry, accent behavior |
| `CHG-NP-0.3.11-HOTFIX2.md` | Added | This handoff record |
| `docs/NP-QA-0.3.11-HOTFIX2.md` | Added | Manual QA checklist |

## 3. Tests and verification

| Check | Result | Evidence / limitation |
|---|---|---|
| `npm test` | **Pass: 286/286** | Native Node test runner, including three new Web logo tests |
| Syntax parsing | **Pass** | TypeScript parser: `App.js`, `src/BrandMark.js`, `src/BrandMark.web.js`: 0 parse diagnostics |
| ZIP integrity / clean extraction | Pass | Checked at packaging |
| Full Expo Web bundling | **Not run** | Expo/React/npm dependencies were not installed in the test environment |
| Web browser runtime | **Not run** | Requires local `npx expo start -c --web` or `npx expo start -c` |
| Android Expo Go | **Not run** | No device access |
| Sidebar scroll and backdrop | **Not verified** | HOTFIX1 behavior still requires browser and Android runtime acceptance |

## 4. Risks and limitations

- This is a narrow corrective patch for the logo frame reported in the Web stack. A subsequent Web exception elsewhere in the application should be investigated separately with its own full error message.
- Browser SVG path rendering should be tested with alternate accent colors, different viewport widths, and navigation open/close.
- The previous sidebar overflow issue remains subject to HOTFIX1 acceptance in the user's runtime.
- Do not infer production readiness or native crash resolution from Node tests alone.

## 5. Install and acceptance

1. Preserve uncommitted work; optionally export the workspace JSON. In Termux: `cd ~/NiyarvoProjects && git switch work && git status --short`.
2. Extract the HOTFIX2 **changes-only** ZIP at the project root; or use complete HOTFIX2 source ZIP if no user edits must be preserved.
3. Run `npm test` and `npx expo start -c` to clear Metro's previous Web resolution cache.
4. Open Web: verify the Niyarvo sidebar mark draws, sidebar links scroll beyond Resources, backdrop tap/Escape dismiss correctly, and Settings accent changes recolor the mark.
5. Open Expo Go on Android: verify the same mark still draws and all navigation works.
6. Accept on `work` only after physical/Web QA; then commit and push as user-controlled checkpoint. Keep `main` unchanged until accepted.

## 6. Next model handoff

Use this full ZIP as baseline for any further Kan-based Kanban redesign. Do not reapply previous v0.3.11-HOTFIX1 patches; they are already included. Preserve the platform split for `BrandMark` and keep other Web SVG issues isolated instead of replacing Gantt rendering wholesale.
