# Milvayo v0.3.2 HOTFIX3 — Android performance test

**Prerequisites:** Atlas demo already imported; save **Backups → Export workspace** before updating. Keep this on `work`.

| Test | Expected | Status |
|---|---|---|
| Overview tab | Performance cards, charts and stage distribution; no second Kanban board | Not verified on device |
| Board mobile | 12 initial cards per lane with Show more for longer lists | Not verified on device |
| Board drag | Long press and drag across lanes, including edge scroll | Not verified on device |
| Timeline open | Atlas Gantt opens without exiting Expo Go | Not verified on device |
| Pan date grid | Smooth horizontal/vertical scrolling; no missing rows or column gaps | Not verified on device |
| Pinch to zoom | Preserves date focus, task dates unchanged | Not verified on device |
| Gantt bar actions | Move, resize, open details | Not verified on device |
| Gantt links | Create, select, delete; accurate paths as chart scrolls | Not verified on device |
| Tree view | Collapse/expand parents; summary bars and progress unchanged | Not verified on device |
| Sprint view | 8/16 completed mock sprint and burndown remain intact before edits | Not verified on device |
| Persistence | Tasks and sprints survive app restart | Not verified on device |
| Web regression | Timeline, Board, Sprint still work in browser | Not verified on device |

**A failure without Metro output can be a native crash.** Please note whether you are in Expo Go or a built APK, and whether Android displays a system crash dialog. Without native logs we cannot prove whether the previous failure was out-of-memory, native SVG layout, or another cause.
