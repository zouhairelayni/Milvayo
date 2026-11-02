# NP-QA-0.5.28 — Backup protection levels

| Check | Result |
|---|---|
| `node tests/run-all.cjs` | Pass: 553 run, 552 pass, 0 fail, 1 skipped |
| Round trip Low / Medium / High | Pass (Node reference primitives) |
| Legacy 600,000 file opens | Pass |
| Wrong password, forged count, corrupt/truncated file | Pass |
| Iteration limits refused before key derivation | Pass |
| Cancellation (codec level) | Pass |
| JSX parse, 3 changed files | Pass |
| Timing, memory, main-thread blocking | **Not verified** (no device) |
| Expo Go / web / Android UI | **Not run** |

## Android check (about 5 minutes, Termux + Expo Go)
1. Settings > Backup > `.niyav` > Add a password. Level selector shows Low/Medium/High, Medium selected, description changes per level.
2. Pick High, leave the screen, return: High is still selected (app restart too).
3. Make the same backup at Low, Medium, High; note seconds for each (Cancel button and progress bar must work; tap Cancel mid-way: "No backup file was created").
4. Import each file: password prompt only, no level question; all open. Wrong password gives "Wrong password, or the file has been changed."
5. Import an older 0.5.24–0.5.27 protected file (600,000): opens.
6. Back up must not freeze taps: scroll while the bar moves.
Record the three times here; expected roughly 1 : 2 : 3.
