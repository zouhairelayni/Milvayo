# NP-QA v0.5.56 — Color correction and AMOLED legibility

## Scope
Focused appearance-only correction based on the user's Android screenshot. The screenshot showed Dark selected, meaning the prior Daylight-only Amber and Orange shades were not visible as active controls. The picker also used unchanged static palette stops, which gave misleading feedback.

## Updated colors

| Item | Before | After | Scope |
| --- | --- | --- | --- |
| Amber primary | `#A88100` | `#C58F00` | Daylight only; true golden amber rather than brown |
| Claude Orange primary | `#E57351` | `#EB805E` | Daylight only; slightly brighter coral-orange |
| AMOLED background | `#000000` | `#000000` | Unchanged absolute black |
| AMOLED card multiplier | 0.20 | 0.92 | Against each accent's Dark card RGB |
| AMOLED alternate multiplier | 0.20 | 0.88 | Against each accent's Dark background RGB |
| AMOLED border | `#0C0C0C` | `#33383A` | Distinguishable from card and black canvas |
| AMOLED button accent multiplier | 0.47 | 0.86 | Against each accent's Dark primary RGB |

Original accent IDs, all Dark primary hues, all other eight Daylight primaries, typography, jobs, encrypted backups, project logic, status colors and local data storage remain unchanged.

## Acceptance checks

1. Settings → Appearance → Daylight → Amber: verify cards and CTA fills are golden, not brown; color picker preview matches the selected shade.
2. Daylight → Orange: confirm a slightly brighter Claude coral-orange, not generic orange.
3. Dark → Amber and Dark → Orange: confirm they retain original accents.
4. AMOLED in Mint and Orange: black area is pure `#000000`, with distinct visible cards/inputs/borders and legible button text.
5. Test theme switching and app reload to confirm preferences persist; inspect Board, Timeline and Settings screens.

## Validation
Source checks and Node suite should pass on a fresh extracted archive. Real Android, iOS and Web screenshot/color calibration still require on-device testing; this environment has not rendered the app on physical hardware.
