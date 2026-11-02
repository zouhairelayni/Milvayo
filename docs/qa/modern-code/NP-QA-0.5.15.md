# NP-QA-0.5.15

| Check | Result |
|---|---|
| Node tests (with node_modules) | PASS: 446 / 446 |
| Node tests (without node_modules) | PASS: 445, 1 skipped (library guard) |
| Node tests with the user's real package.json | PASS: 446 / 446 |
| RNGH 3.3.0 source read: mode initialization, wrapper selection, setMode, worklet detection | CONFIRMED (guarded by test) |
| JS/JSX syntax of changed files | PASS (TypeScript parser) |
| Dependency compatibility (`npx expo install --check`) | NOT RUN (no dependency changes) |
| Android first-open Timeline stays put | NOT RUN (needs device) |
| Android Timeline drag, resize, link after the change | NOT RUN (needs device) |
| Web build | NOT RUN (web path unchanged: fragment host) |
