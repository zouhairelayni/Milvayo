# CHG-NP-0.5.24 — `.niyav` compressed backups with optional password protection

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | NiyarvoProjects_v0_5_23.zip |
| Scope | Backup screen, export/import helpers, `.niyav` format. Versions not bumped (project rule) |
| Dependencies | **Four new packages**, see section 5. `package.json` and `package-lock.json` are not in the ZIP |
| Source status | `npm test`: 507 pass, 0 fail, 1 skipped (needs `node_modules`). JSX syntax clean |
| Runtime status | Android, iOS, web: **Not run**. `npx expo install --check`: **Not run** |

## 1. What changed

- **Export format choice** in Backup: `.json` (readable, as before but compact) or `.niyav` (compressed).
- **Password protection** for `.niyav`: AES-256-GCM, key from the password by PBKDF2-HMAC-SHA256 (600,000 iterations). Minimum 12 characters, entered twice, never stored, never logged. See `docs/niyav-format.md`.
- **Import** (project and whole workspace) opens `.json`, `.niyav` and protected `.niyav`. A protected file asks for its password, with a Cancel. Wrong password and a modified file give one message: "Wrong password, or the file has been changed."
- **Compact JSON.** Exports are no longer indented: about 40% smaller. Old files still import.
- **Recovery snapshots are left out of backups by default**, with a switch to include them. They are whole older copies of the workspace: they were more than half of the file and can hold data deleted on purpose. This changes what a default `.json` backup contains.

## 2. Measured, with the Northstar workspace

| | `.json` | `.niyav` | protected `.niyav` |
|---|---|---|---|
| Before this change | 1,950 KB | n/a | n/a |
| With recovery snapshots | 1,142 KB | 150 KB | 150 KB |
| **Without snapshots (new default)** | **526 KB** | **69 KB** | **69 KB** |

`.niyav` uses gzip. It does **not** reach 35 KB. Getting near 30 KB needs brotli or lzma, which have no small, Expo Go safe pure-JS implementation; the header has a compression id so one can be added later.

## 3. Safety design

- The format logic (`src/store/niyav.cjs`) is pure and takes its crypto primitives as parameters, so it is tested here against Node's real zlib and crypto, including an independent decoder written only from the documented layout.
- Tested: wrong password, every header byte flipped, ciphertext and tag flipped, truncation, forged iteration counts (refused before any key derivation), compression bomb, unique salt and nonce per file, Unicode-equivalent passwords, empty password never produces an unprotected file.
- A protected export proves the file can be opened (with the key already in memory) before it is saved.
- In the app, `src/store/niyavPrimitives.js` runs known-answer tests (PBKDF2, AES-GCM, gzip) once before any protected file is made or opened, and refuses if a library misbehaves.
- Inflating is streamed and capped at 5 MB, like imports.

## 4. Limits, stated plainly

- **The password-derivation time on a phone is not measured.** 600,000 PBKDF2 iterations take about 0.1 s in Node but run as JavaScript on the phone (Hermes) and could take many seconds. The screen stays responsive and shows a message. If it is too slow, change `DEFAULT_ITERATIONS` in `src/store/niyav.cjs`; files record their own iteration count, so old files keep opening. Do not go below 100,000.
- Protects the exported file only, not data inside the running app.
- Not run on any device: file picking of `.niyav`, sharing a binary file, the password screens, the primitives libraries.
- A cancelled or failed system pick still reports "No file selected." (SDK 58 reports failures as cancels).
- Existing `.json` files from earlier versions import unchanged.

## 5. Install (required before running)

```
npm install fflate@0.8.2 @noble/hashes@1.8.0 @noble/ciphers@1.3.0
npx expo install expo-crypto
```
Without them Metro cannot bundle the Backup screen. The versions are pinned to the APIs the code was written against. If Metro reports an unresolved import, send the message.

USER AFTER TESTING: 
added by me the user/developper because the above packages werent enough and the app couldnt bundle:

```
npm install @noble/hashes@1.4.0 @noble/ciphers@1.0.0
```

## 6. Acceptance sequence

1. After installing, `npx expo start -c`, open Backup.
2. `.json`, entire workspace: file opens as JSON, about 0.5 MB.
3. `.niyav` without a password: file is much smaller; import it back (Import project, then Choose workspace file).
4. `.niyav` with a password: short password is refused; mismatched repeat is refused; export works; note how long it took.
5. Import the protected file: asks for the password; wrong password shows the message and allows retry; correct password imports.
6. Check the restored workspace: projects, programs, portfolios.
7. Turn on "Include recovery snapshots" and confirm the file grows.

## 7. Rollback
Restore `src/screens/workspace/Backup.js`, `src/store/importFiles.cjs`, `src/store/store.js`, `src/ui/downloadText.js`, `src/ui/uiControls.js` from v0.5.23 and delete `src/store/niyav.cjs`, `src/store/niyavPrimitives.js`. The four packages can stay installed.
