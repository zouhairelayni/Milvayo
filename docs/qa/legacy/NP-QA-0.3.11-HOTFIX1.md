# Milvayo v0.3.11-HOTFIX1 — Android/Web navigation QA

This hotfix fixes **navigation only**. Keep the imported Atlas project and stored workspace intact. Before extraction, checkpoint changes and export a JSON workspace if valuable.

## Quick tests

- [ ] Android: tap hamburger; navigation opens and **Close navigation** stays visible.
- [ ] Android: swipe upward **inside the navigation list**, then select Costs / Collaboration / Reports / Settings below Resources. Verify routing and that the overlay closes.
- [ ] Android: tap close, reopen and tap the backdrop, then reopen and use hardware Back. All three close the menu.
- [ ] Web: shrink the viewport to mobile width and repeat navigation scroll, close/backdrop, and Escape key.
- [ ] Web: check desktop-wide viewport sidebar still navigates and its lower items scroll on short screens.
- [ ] Verify the Atlas Board, Timeline, Sprints, task editor, JSON import, Power-Ups and accent settings are not affected.
- [ ] Restart and verify local data remains unchanged.

## Source checks performed

- PASS — 283/283 `npm test` Node tests.
- PASS — `App.js` JSX parsed without diagnostics.
- PASS — ZIP integrity and clean source-extraction test.
- NOT RUN — Expo Go/Android runtime and Web browser runtime; acceptance depends on your device/browser tests.

## Escalation if still blocked

Send a Web screenshot with the menu open and after tapping the backdrop, and Expo Go logs (if any). Note whether the close icon can be pressed, whether tapping outside closes, and whether the nav links can scroll independently of the underlying screen.
