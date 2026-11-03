# Niyarvo Projects v0.3.11 — Mobile/Web acceptance

**Target:** user Termux Expo Go and Web runtime, independently.

## Required before acceptance

- [ ] Export local workspace JSON; preserve `work` checkpoint and verify source files.
- [ ] Run `npm test` (278 tests expected in this release).
- [ ] Run `npx expo install --check` and `npx expo start`.
- [ ] On Android: import Atlas, switch boards, open/close tasks, verify safe-area bounds.
- [ ] Drag tasks between status columns via full-card long-press; check stable ordering.
- [ ] Test Add card from each lane; verify preselected status and board.
- [ ] Verify one short list does **not** stretch to height of another.
- [ ] Enable Power-Ups on Main, then switch to a separate board: selections must be independent.
- [ ] Calendar: verify dated unfinished tasks due in next 30 days show; Done tasks excluded.
- [ ] Aging: verify old unfinished tasks show age and Done tasks do not.
- [ ] Checklist: verify passed/total bar accurate and not duplicated.
- [ ] GitHub: add, reject duplicate, reject malicious host, remove, disable/re-enable without data loss.
- [ ] GitHub: manually refresh public PR; verify actual title/state/author/labels if API permits. Test offline error handling.
- [ ] Export and re-import project; verify Power-Up settings and GitHub references survive.
- [ ] Timeline Atlas regression (no native crash); Board, Sprints, Settings, project switching, backup recovery.

## Explicitly not verified in delivery environment

Android and Web live rendering, drag gesture dynamics, physical device memory use, GitHub HTTP success, private-repository authorization, scheduled sync. No GitHub credentials are accepted or stored.
