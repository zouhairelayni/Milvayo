# Niyarvo Projects 0.3.1 — local QA checklist

## Tests in Termux

```sh
cd ~/NiyarvoProjects
git switch work
git status --short
# Back up or commit any earlier changes before replacing files.
unzip -o ~/storage/downloads/NiyarvoProjects-v0.3.1-LOCAL-QA.zip -d .
npm test
npx expo install --check
npx expo start
```

## Accent & brand

- [ ] Settings offers 10 swatches and Orange is default on a clean local profile.
- [ ] Changing accent recolors Niyarvo mark, primary buttons, selected navigation, and Gantt controls, not error/validation/success semantics.
- [ ] Change to Aqua; restart Expo Go/app; Aqua persists. Change back to Orange.
- [ ] Browser favicon changes on Web; installed PWA/Android/iOS icon remains default orange.
- [ ] Project export/import does not change selected accent or project records.

## Hierarchical Gantt

- [ ] Timeline → Tree shows nested parent/subtask layout; collapsing parent hides descendants without deleting them.
- [ ] Parent summary bar uses span from scheduled children and progress from leaf-effort rollup.
- [ ] Tap a parent summary to open task; leaf bars still drag and resize.
- [ ] Links remain editable and workflows/scheduling stay unchanged in Status and Stage modes.

## Regressions

- [ ] Kanban full-card long press / sideways auto-scroll.
- [ ] Gantt pinch zoom, dependency drag, remove link, reschedule preview/apply.
- [ ] Task CRUD, custom fields, saved views, project archive/restore, JSON backup, release verification.
- [ ] Android portrait and landscape safe-area margins; no clipped toolbar or modal buttons.

**No deployment or merge until Android and Web acceptance.**
