# Milvayo v0.5.33 — installation

**Overlay, not a complete source replacement.** Apply ONLY on top of v0.5.31 DESKTOP HF2 already installed in `~/Milvayo`.

```sh
cd ~/Milvayo
git switch work
unzip -o ~/storage/downloads/Milvayo-v0.5.33-MERGE-OVERLAY.zip
node scripts/apply-np-v0.5.33.cjs --dry-run
node scripts/apply-np-v0.5.33.cjs
node scripts/set-np-version-0533.cjs
node --test tests/ui/selective-merge-0533.test.cjs
npm test
npx expo start --clear
```

The version command updates all three manifests, including the root version inside `package-lock.json`. Does not reinstall packages or resolve versions.

Test Web portrait desktop rail, large-width task headers, Overview Releases/Testing, Kanban drag, Timeline gestures, data persistence. Keep v0.5.31/HF2 checkpoint for rollback; do not clear app storage.

Read `CHG-NP-0.5.33.md` and `NP-QA-0.5.33.md` for scope, verified tests and untested device risks.
