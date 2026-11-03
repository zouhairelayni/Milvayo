# NP-QA-0.5.31 — Responsive workspace release checks

## Automated checks (performed)

| Gate | Result | Evidence |
| --- | --- | --- |
| Node source/domain suite | **PASS** | 577 total, 576 passed, 0 failed, 1 skipped; `node tests/run-all.cjs` with temporary test-only manifests |
| JSX syntax parse | **PASS** | TypeScript JSX parser across `src`, 0 diagnostics |
| Pure accent accessibility | **PASS** | All theme accents have contrast-qualified light/dark foregrounds in unit test |
| Source ZIP structure | **PASS** | Root-level `src`, `tests`, `docs`, `assets`, no enclosing parent directory |
| Data migration | **NOT NEEDED** | Store model, persisted keys and backup schemas unchanged |
| Real app / package manifest | **NOT RUN** | Excluded from source ZIP, present only on user device |
| Web browser screen render / interactions | **NOT RUN** | Expo/React Native dependencies unavailable in this environment |
| Android Expo Go / iOS | **NOT RUN** | No device runtime here |
| Native drag latency / FPS | **NOT RUN** | Requires phone profiling |
| APK | **NOT RUN** | Explicitly excluded by user request |

The single skipped test depends on unavailable runtime packages. The manifest shims were **removed** before packaging; they contained no real dependency versions. Run the suite again against local Termux manifests before merging.

## Manual desktop / tablet / mobile acceptance checklist

- [ ] **Desktop >=1120px:** Sidebar expands to 264px and collapses to 72px on command; icon navigation remains complete; active state follows each destination. Switch workspaces and projects without losing data.
- [ ] **Tablet/laptop 880–1119px:** Compact rail does not clip toolbar or projects; project drawer opens in front of rail; no horizontal page overflow except intended Kanban/Timeline scrolling.
- [ ] **Mobile <880px:** Bottom five tabs usable with touch, menu exposes all nonprimary screens, menu and task sheets don't overflow top/bottom safe areas.
- [ ] **Breakpoint resize:** Open Timeline, cross 880px back and forth; page retains its state and doesn't jump to Overview. Verify screen-title and search placement.
- [ ] **Search/project selection:** Global search opens filtered Tasks; clear works. Switching project closes old task sheet and doesn't carry stale filters.
- [ ] **Overview, Tasks, Sprints, Scheduling, Releases, Specifications, Testing, Collaboration, Settings:** Open each; all sections/actions reachable; no clipped forms or unexpected horizontal scrolling.
- [ ] **Kanban:** Multiple boards, empty lists, long labels, nested/large cards, mobile long-press drag, cross-column moves, list reordering, drag auto-scroll, filter during drag. Confirm saved task positions after app restart.
- [ ] **Timeline:** Initial open stays on Timeline, task labels on desktop, zoom Days/Weeks/Months, horizontal scroll, task moves, left/right duration resize, dependencies, critical path, milestones, Today jump, unscheduled list. Verify no dropped gestures.
- [ ] **Sheets and errors:** Trigger a controlled validation refusal inside Board, Sprint, Task Sheet, Diagnostics and project drawers; ensure inline notice visible and dismissible. Verify background dimming and back/close.
- [ ] **Light/dark:** Toggle both themes, every available accent, focus order on web keyboard, readable text and reduced-motion preference.
- [ ] **Persistence:** Export full backup, inspect it (do not overwrite original), change a test task, restart, recover and compare task IDs and workspace selections.
- [ ] **Performance:** Run diagnostics on Android and web; record first navigation time, longest JS delay, Board/Timeline render counts/max durations; compare to existing 0.5.30 device baseline before claiming an improvement.

**Release gate:** do not merge `work` into `main` until manual device acceptance, especially native gestures and first-open Timeline, passes. Rollback by restoring the v0.5.30 committed source; no app data migration is involved.
