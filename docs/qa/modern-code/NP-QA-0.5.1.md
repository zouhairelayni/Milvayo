# NP-QA-0.5.1 — Device acceptance checklist

**Status:** Source QA only. **369/369 tests passed; 59 JS/JSX files parsed with 0 syntax errors.** Android/iOS/Web interactive acceptance **Not run in build environment**.

| Check | Expected | Status |
|---|---|---|
| Expo config/dependencies | `npx expo-doctor` 20/20, local `expo-font` preserved | Not run here; user confirmed green on prior release |
| Single app | No Advanced workspace / ClassicApp route | Source verified |
| All management screens | Open every drawer item with no render exception | Not run on device |
| Project CRUD and restore | IDs and archived projects preserved | Source tests; device not run |
| Task edit, custom fields, duplicate/delete and hierarchy | Domain validation and snapshot behavior | Source tests; device not run |
| Sprint planned/active/completed lifecycle | Correct history and pre-destructive snapshots | Source tests; device not run |
| Releases and testing | Readiness/verify/evidence and guarded transitions | Source tests; device not run |
| Resource/time/cost | Leaf-only planned cost and 3-letter budget currency | Source tests; device not run |
| Automation | Edit and execute button/status/due commands | Source tests; device not run |
| Backup | Full workspace export then restore portfolio/activity/history | Source tests; device not run |
| Android Board navigation | No snap-back, swipe scrolls, hold drags with correct finger offset | **Open QA blocker** |
| Android Timeline | 66+ tasks accessible, stable SVG bars & curves after 1 sec | **Open QA blocker** |
| Navigation | No repeated ~1.5-second Board navigation | **Open performance issue** |
| Branding | Correct centered icon, adaptive icon and in-app mark | Assets checked; device not run |
| Package preservation | No package.json, package-lock.json, node_modules in ZIP | To verify at package audit |

Do not label this release complete before reproducing device acceptance steps on Termux/Expo Go.
