# QA — Redesign batch 2 (Project tools switches, pill order), on top of v0.5.59

## What moved or changed

| Item | Now |
|---|---|
| Work pill order | Board, Timeline, List, Sprints |
| Project documents (business case, charter, risks, WBS...) | Projects, open a project (unchanged, always on) |
| Sprints | Work pill, only when the Sprints tool is on |
| Releases, Testing, Activity, Resources, Collaboration, Costs, Automations, Reports, Specifications | More, Project tools, only when switched on |
| Scheduling | More, Plan (always on) |
| Settings, Appearance, Desktop layout | More, App |
| Manage tools | More, Project tools, last row; also Settings, General, Choose tools |

## Results

| Check | Result |
|---|---|
| `node tests/run-all.cjs` | 708 tests: 706 pass, 1 skipped, 1 fail. The fail is `board-launcher-apk-059` (needs `.github/workflows/android-apk.yml`, not in the zip; same before). |
| New tests for switches (8) | Pass |
| JSX parse of all source files | 0 syntax errors |
| Undefined-variable check on changed files | 0 |
| Expo Go, Web build, `npx expo install --check` | **Not run** |

## For Elay: what to try in Expo Go

1. Open Work. The pill reads Board, Timeline, List, Sprints. Swipe it left and right.
2. More, Project tools, Manage tools. Switch Sprints off: the pill loses Sprints. Switch it on: it returns.
3. Switch Releases off: it disappears from More, and the Create sheet (+) loses its Release row. Overview loses the release card. Switch it on again and open Releases: your releases are all still there.
4. Create a new project (+, then Project). It should start with Resources, Collaboration, Costs, Automations, Reports and Specifications off. Switch one on.
5. Open your old project: every tool should be on.
6. Close the app fully and reopen it: the switches should be remembered.
7. Timeline: check the date ribbon, weekend shading and the dashed today line are there as before. Tell me what is missing, if anything.

## Rollback

Restore the batch 01 zip. A project saved with switches keeps its `tools` field, which older code ignores. No other storage key or format changed.
