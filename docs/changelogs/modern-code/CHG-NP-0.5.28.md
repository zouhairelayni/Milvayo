# CHG-NP-0.5.28 — Backup protection levels (Low / Medium / High)

## Baseline
0.5.27 Task Sheet merge. Commit status: Not committed. No APK, no deploy.

## New
- Protected `.niyav` backups offer **Low (200,000)**, **Medium (400,000, default)** and **High (600,000)** PBKDF2-HMAC-SHA256 rounds. All three use AES-256-GCM; the level only changes how costly password guessing is. The Backup screen says so.
- The last chosen level is remembered (`src/store/backupLevel.js`, key `niyarvo.backupLevel`; no password is stored there).
- WebCrypto fast path for key derivation in browsers, checked once against a known answer; falls back to the chunked JavaScript derivation on any doubt. Android/iOS (Hermes, Expo Go) have no `crypto.subtle`, and `expo-crypto` has no PBKDF2, so they keep the JavaScript path.

## Compatibility
- File format unchanged: the iteration count was already in header bytes 8–11. Opening a file reads that count, so nobody has to remember a level. Old 600,000 files open as before. Plain gzip and JSON files untouched.
- Reader limit lowered from 10,000,000 to **1,000,000** iterations (hostile headers cannot stall a phone). Floor stays 100,000. Header checks run before any key derivation.
- `encode()` accepts `level`; an explicit `iterations` still wins (tests).
- Low and Medium are below the OWASP 2023 figure of 600,000. That is the requested trade-off for speed; use High or a long password for sensitive data.

## Tests
- New `tests/store/niyav-levels-0528.test.cjs` (12 tests): three round trips, stored count, default Medium, legacy 600k, wrong password, forged count, hostile counts (no derivation happens), truncated/corrupt file, cancellation, key equals Node PBKDF2.
- `node tests/run-all.cjs`: **553 tests, 552 pass, 0 fail, 1 skipped** (same skipped case as before: needs `node_modules`).
- JSX parse of the 3 changed `.js` files: 0 errors.
- Expo Go / web / Android device, benchmarks: **Not run / Not verified**.

## Known limits
- No timings measured: `node_modules` is not available here. Measure on the phone (see QA).
- WebCrypto derivation cannot be cancelled mid-way (cancel is honoured before and after).
- Remaining 0.5.27 plan: workspaces, import modes, Atlas fixtures, audit findings, Ponytail audit.
