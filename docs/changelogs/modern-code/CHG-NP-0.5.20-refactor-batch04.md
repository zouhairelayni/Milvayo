# Refactor batch 04 (audit fixes 8, 9, 10)
- 8: restore-entire-workspace now checks the 5 MB limit (bytes). Import path already did.
- 9: `parseBackupJson()` rejects null, numbers, strings and arrays with "Expected a Niyarvo backup".
- 10: removed governance/theme.js and governance/ui.js pass-through files.
Tests: 475, 0 fail. Device run: Not run. Undo: restore the previous zip.
