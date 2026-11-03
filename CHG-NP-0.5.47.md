# Niyarvo Projects — consolidated change log

**Release:** 0.5.47  
**Baseline:** user-supplied complete v0.5.34 source (originally merged v0.5.33).  
**Format:** one cumulative release ZIP at project root, no separate installer or `/docs` duplicates.  
**Data:** backward-compatible task, board, project and workspace normalization; no migration or automatic data deletion.

## Patch history — v0.5.35 through v0.5.47

| Version | Implemented change |
|---|---|
| **0.5.35** | Removed Settings > Workspace data duplicate. Backup creation shows live password match/mismatch before invoking slow AES-256 key derivation; forms for Project, Portfolio and Program creation/editing now use task-sheet-style panels. |
| **0.5.36** | Moved Task configuration from hamburger navigation to Tasks; organized filters, tags, saved views and schema settings in one sheet. |
| **0.5.37** | Switched menu Niyarvo branding to original-logo alpha masks tinted by the selected theme accent. Wordmark follows high-contrast appearance colors. |
| **0.5.38** | PROJECTS lettering is approximately twice its previous display height and is right-aligned under the final O of niyarvo; monochrome light/dark treatment. |
| **0.5.39** | Removed Board/Timeline descriptive subtitles, renamed Board tools to Tools, fixed Tools ahead of a horizontally scrollable single-row board switcher. |
| **0.5.40** | First Timeline open targets the earliest task active today; if none, it targets the next scheduled task; subsequent user scrolling is not overridden. |
| **0.5.41** | Removed screen title/header containers while retaining actions; theme-toggle control moved to the hamburger navigation. |
| **0.5.42** | New task is a draft-only sheet. Closing/dismissing never persists; Save task creates one canonical task with its drafted description/status/priority. |
| **0.5.43** | Description is still editable by pressing its preview (no redundant Edit button); Duplicate and Delete are adjacent in the Task Sheet footer and both require confirmation. |
| **0.5.44** | Mobile tab bar handles left/right swipes across the bar, moving one primary destination at a time; keeps existing tap-intent validation and Kanban/Timeline gesture areas separate. |
| **0.5.45** | Kanban initially displays 10 cards per list with explicit Show more (10 at a time); a per-board Tools setting controls whether new tasks enter at the top or bottom (default bottom), without altering existing tasks on preference change. |
| **0.5.46** | Replaced hamburger Close X with the light/dark appearance button; menu still dismisses using the outside overlay, Android back, or choosing a destination. |
| **0.5.47** | Restored original pre-RIVNA Claude Orange `#D97757` for Orange accent; all nine other RIVNA accent choices and existing background/surface palettes remain intact. |

## Package and documentation hygiene

- This is a **complete source ZIP** extracted directly into the working tree, not an installer or scripted overlay.
- Only **this changelog** is included. There is no `/docs` tree or duplicate changelog in the source package.
- Kept the independent protected `.niyav` file format specification in `reference/niyav-format.md`, rather than losing unique cryptography-format documentation.
- Removed old compatibility installers and obsolete HF5 READMEs.
- Synchronized `package.json`, `package-lock.json` and `app.json` to **0.5.47**.
- Global design rule: no decorative vertical accent bars on buttons, tabs or selected navigation items.

## Verification and limitations

- Domain and source regression suite on fresh-extracted full ZIP: **609 passed, 0 failed, 1 skipped** (610 total).
- JavaScript/CommonJS syntax parsing: **227 files, 0 syntax errors**.
- Web/mobile visual checks and touch interactions in Brave/Expo Go: **not run on the user's phone**; acceptance is required before committing.
- Existing encrypted backup passwords cannot be verified instantly without deriving the key. The instant green/red password check in this release confirms that **two passwords entered for a *new* encrypted backup match**; it is not a shortcut for decrypting previously encrypted backups.
- Full ZIP extraction does not remove legacy files from an existing checkout. The user may delete the old `/docs` folder after extracting. Preserve any local-only source modifications before overwriting.
