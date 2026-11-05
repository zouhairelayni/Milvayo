# QA — Redesign batch 1 (phone shell), on top of v0.5.59

## Feature parity matrix (old menu entry -> new home on the phone)

| Old entry | New home | How to reach it |
|---|---|---|
| Overview | Home | bottom bar: Home |
| Board | Work pill | bottom bar: Work, pill: Board |
| Tasks | Work pill ("List") | Work, pill: List (Task configuration is inside it, as before) |
| Timeline | Work pill | Work, pill: Timeline |
| Sprints | Work pill | Work, pill: Sprints |
| Projects | Projects pill | bottom bar: Projects |
| Portfolios | Projects pill | Projects, pill: Portfolios |
| Programs | Projects pill | Projects, pill: Programs |
| Scheduling | More, Plan | More |
| Releases | More, Deliver | More (also: + then Release) |
| Testing | More, Deliver | More |
| Resources, Collaboration, Costs | More, Team and money | More |
| Automations, Reports, Activity, Specifications, Settings | More, Operate | More |

| Old control or gesture | New home |
|---|---|
| Hamburger menu / side drawer | More tab |
| New task button | Centre + (Create sheet, New task on top) |
| Project switcher + Create project | Header project chip (drawer unchanged); + then Project |
| Workspace switcher (create, rename, delete) | More, top row (drawer unchanged) |
| Light / Dark / AMOLED toggle | More, App, Appearance |
| Desktop layout (web) | More, App, Desktop layout |
| Search | Header search icon (opens Tasks filtered) |
| Board Tools, Tasks Tools, New sprint, New release | Header icon on that screen |
| Timeline zoom Days / Weeks / Months | Header chip, one tap cycles |
| Swipe on bottom bar | Still works, now across Home, Work, Projects, More |
| Swipe between views | New: swipe the pill |
| Board card drag, Timeline bar drag, dependency lines, island notices | Unchanged code, same screens |
| Wide / desktop sidebar and toolbar | Unchanged |

## Results

| Check | Result |
|---|---|
| `node tests/run-all.cjs` | 700 tests: 698 pass, 1 fail, 1 skipped. The one failure is `board-launcher-apk-059` and needs `.github/workflows/android-apk.yml`, which is not in the supplied zip (same before this batch). |
| New parity tests (12) | Pass |
| JSX parse of all 140 source files | 0 syntax errors |
| Undefined-variable check on the 7 changed files | 0 |
| Expo Go on a phone | **Not run** |
| Web build / PWA | **Not run** |
| `npx expo install --check` | **Not run** (no network here) |
| Real FPS, memory, battery | **Not measured** |

## For Elay: what to try in Expo Go (about 5 minutes)

1. Bottom bar shows Home, Work, +, Projects, More. Tap each.
2. In Work, tap Board, List, Timeline, Sprints in the pill, then swipe left and right on the pill.
3. Swipe left and right on the bottom bar.
4. Board: hold and drag a card. Timeline: drag a bar and a dependency link, check the lines follow. Tap the zoom chip in the header.
5. Tap + and create a task. Open + again and try Project and Release.
6. Search icon: type, then close it and check the list is unfiltered.
7. More: open each entry, use the back arrow. Try Appearance and the workspace row.
8. Trigger a notice (for example Settings, Back up) and check the island still appears at the top.

Report anything that feels slow, cut off at the edges, or missing.

## Rollback

Restore the previous project zip. Files added: `src/app/navigation/sections.cjs`, `src/screens/more/More.js`, `src/components/shell/CreateMore.js`, `tests/app/phone-shell-parity-060.test.cjs`. File removed: `src/components/shell/MenuToggle.js`. No data format, storage key or migration changed.
