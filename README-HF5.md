# Milvayo 0.5.33 — Theme & UI polish (HF5)

Patch source for an installed 0.5.33 checkout with HF4 already applied. Preserves the non-negotiable HF1/HF2 desktop mode, mobile browser detection, Gantt colors, gestures, and data.

**Install**

```sh
cd ~/Milvayo
unzip -o ~/storage/downloads/NP-0.5.33-THEME-UX-HF5.zip
node scripts/apply-np-0533-hf5.cjs --dry-run
node scripts/apply-np-0533-hf5.cjs
node --test tests/ui/np533-hf5-interface.test.cjs
npm test
npx expo start --clear
```

Do not continue after a dry-run refusal; it means local source differs. No npm install, version bump, or Git commit is required.

For detailed changes, risks and testing, see `docs/qa/CHG-NP-0.5.33-THEME-UX-HF5.md`.
