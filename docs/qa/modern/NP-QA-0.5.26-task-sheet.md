# NP-QA-0.5.26 Task Sheet UX

Source baseline: v0.5.25 user upload. 2026-11-02.

| Check | Result |
|---|---|
| Full `npm test` | 527 pass; 1 skip; 0 fail |
| Task title and ID visibility | Source assertions pass; IDs remain stable and appear in task footer only |
| Standard/Advanced mode and field preservation | Static assertions pass; manual acceptance pending |
| Markdown parsing: bold/italic/lists/headings/code, raw HTML as text | Node tests pass |
| 24 label colors, fallback, invalid color normalization | Node tests pass |
| Project JSON normalization/import preserves labels and label colors | Node tests pass |
| Plain gzip `.niyav` and password-protected AES `.niyav` round-trip | Node tests pass via existing Node reference primitives |
| Modified JSX syntax | Parse PASS via TypeScript JSX parser |
| Expo Web / physical Android / iOS UI | Not run |
| Native drag, scroll, keyboard behavior | Not run |
