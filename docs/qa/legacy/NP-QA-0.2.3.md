# NP v0.2.3 QA Checklist — Web / Expo Go

Do not test real imported project data first. Export a backup. Use sample workspace or a disposable project with 4 dated tasks A,B,C,D and no dependencies.

| ID | Action | Expected | Result |
|---|---|---|---|
| G1 | Tap connector on A, tap B bar | B depends on A; cyan line appears | Not run |
| G2 | Drag connector of B onto C bar | C depends on B and line appears | Not run |
| G3 | Drag from C onto A to make a cycle | Connection rejected; previous links persist | Not run |
| G4 | Link A→B twice | No duplicate; warning displayed | Not run |
| G5 | Drag connector to whitespace | No relation created | Not run |
| G6 | Tap A port then Cancel | Linking mode closes without change | Not run |
| G7 | Link to undated task | Tap-to-link may add relation; no line until scheduled | Not run |
| G8 | Enable critical path | Longest dependency chain outlined amber; assumptions displayed | Not run |
| G9 | Move/resize bar after linking | Date edit works; conflicts are surfaced | Not run |
| G10 | Change zoom and project/grouping | Link target remains accurate; project reset clears link mode | Not run |
| G11 | Restart app and re-open | Links and task dates persist; computed critical overlay re-evaluates | Not run |
| G12 | Existing task selection/editor | Opens as before; list-based dependency editor works | Not run |
| B1 | Kanban hold/drag sideways | v0.2.2 accepted behavior unchanged | Not run |
| L1 | Rotate phone and use portrait/landscape | No clipping of controls, footer, task labels | Not run |
| W1 | Browser mouse drag-link and click-link | Both methods work | Not run |

Report device, OS, Expo Go and Web browser versions, plus logs/screenshots when any item fails.
