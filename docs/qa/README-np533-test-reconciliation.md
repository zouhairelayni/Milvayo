# v0.5.33 Test Reconciliation — guarded overlay

This is **not** another redesign or full source ZIP. Use only after 0.5.33 selective merge and HF1/HF2 portrait desktop support are installed.

In Termux:

```sh
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NP-0533-TEST-RECONCILIATION.zip
node scripts/reconcile-np-0533-tests.cjs --dry-run
node scripts/reconcile-np-0533-tests.cjs
npm test
```

The script saves the old Sonnet tests and HF1 test to `docs/qa/historical-sonnet-0532/` for reference, and moves root release notes under `docs/qa/release-notes/`. It preserves the 320px Web portrait desktop contract. See the changelog for validation scope and risks.
