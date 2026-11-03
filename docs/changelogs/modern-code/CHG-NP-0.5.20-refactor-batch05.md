# Refactor batch 05 (ponytail audit 1-5)
- Snapshot size budget runs on every edit (was: only when snapshots changed).
- Web picker rejects files over 5 MB before reading them.
- Removed dead exports in governance/data.js; Delivery/Sprints share addDays from store/data.js.
- package.json version line (yours): "version": "0.5.20",
Tests: 477, 0 fail. Device run: Not run. Undo: restore the batch 04 zip.
