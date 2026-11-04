# NP-QA-v0.5.48 — source validation

**Basis:** full editable source assembled from the verified v0.5.47 source ZIP. Historic release records were recovered from the user-provided v0.5.32 source archive.

## Tests

- Local full Node regression suite: **617 total, 616 passed, 0 failed, 1 skipped**.
- v0.5.48 focused checks: shared header controls, Timeline initial focus guard, sheet dismissal affordance, action confirmations, four appearance modes, accent palettes and documentation structure.
- JavaScript/CommonJS syntax parsed on the source tree (see local validation log).

## Verification limits

- No Expo Go/Android runtime or physical gesture checks were executed here.
- No real mobile-browser portrait/desktop-mode screenshots were captured for this source release.
- No build or publish/commit to GitHub was performed.
- The shared Sheet swipe-down touch handler depends on React Native and browser touch-event delivery; check with actual scrolling text fields and nested scroll views.
- The Timeline initial-position effect depends on native ScrollView measurements; confirm that opening the Timeline lands on the earliest task scheduled for today, and that scrolling is not overridden.

## Documentation provenance

- Original legacy and modern release notes were consolidated into `docs/changelog/CHANGELOG.md` without creating additional changelog copies.
- Four version numbers have no standalone changelog in the available historical source: **v0.4.0, v0.4.1, v0.5.22 and v0.5.32**. Their presence is recorded without fabricated implementation descriptions.
- Historical reports are under `docs/qa/legacy` and `docs/qa/modern`; user guides and the unique `.niyav` format specification are under `docs/instructions`.
