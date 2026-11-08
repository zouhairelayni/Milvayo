# Risk register

| Risk / evidence | Consequence | Required next gate |
| --- | --- | --- |
| Project-wide validation reads; 135 reads for a small task fixture | Expensive large-project mutations | Measure trusted narrow-operation validators without weakening graph/workflow checks |
| Workspace sequence serializes mutations | Contention under heavy collaboration | Bounded real multi-client load and transaction-retry measurements |
| Full snapshot copies in local journal generations | Write amplification and storage growth | Physical Android measurements, compaction preserving all pending intent |
| Cross-tab local workspace writers remain baseline single-writer | Competing same-origin tabs can race | Web Locks/lease strategy and real tab tests before supported multi-tab sync |
| 100-record mutation/restore bound | Large atomic edits need a fresh workspace; staged complete recovery is implemented | Physical interruption and large-archive soak; in-place replacement remains bounded |
| Canvas 1,000-object existing limit | Cannot claim thousands-per-board support | Preserve limit; larger workloads remain simulations |
| Legacy Canvas/local author markers | Attribution differs from cloud actor | Trusted audit actor remains authoritative; design identity migration separately |
| Scoped recovery journals contain private pending work | Device storage is part of confidentiality boundary | Explicit encrypted cache/retention threat model; no shared-device guarantee |
| Auth uses memory persistence; restart requires emulator sign-in | A borrowed cloud view cannot be reopened offline after restart | Deliberate fail-closed behavior; evaluate a durable Auth/cache policy with device security acceptance |
| Borrowed-view recovery lease | Startup/logout restores local source; edits retained in scoped journal | Physical crash, storage exhaustion and account-switch acceptance |
| Production rules/indexes/packaging unverified | Emulator behavior is insufficient for release | Separate Milvayo project, review and owner-authorized deployment later |
| PRoot file watcher / DevTools EACCES | Fast Refresh cannot be accepted here | Owner Termux/Expo Go validation; do not modify stable Metro just for host testing |
| Existing onboarding Web SVG warning | Runtime console remains noisy on first tour | Track unchanged TourArtwork path separately from cloud work |
| Commercial/enterprise monitoring, storage UI and device acceptance incomplete | Full v1 handoff definition of done not met | See readiness matrix; do not label this full production v1 |

No high-risk finding is waived by cheap reads or simulated tests. Existing local exports remain the reversible source of truth.

## v0.8.5 risk disposition

- Independent field scan: resolved for supported A fields; six reads constant through 2,000 tasks. Structural/Canvas scans remain.
- Central sequence: retained; ten-request host stress yielded eight acknowledgments/two timeouts. Not an enterprise concurrency pass.
- Journal amplification: measured improvement; v2 reader required until pending work is recovered before rollback.
- Browser writers: coordinated single owner/takeover; no concurrent same-origin writing. Unsupported Web Locks fails closed.
- Conflict editor: implemented field comparison and authorized revision-checked local/remote choices; deletion conflicts deliberately remain in recovery.
- Privacy/mobile/production: memory-only Auth preserved; plaintext pending device data and physical offline/background/Expo Go/Fast Refresh gates remain.

See [085 evidence](../qa/cloud-085/REPORT.md). Historical risks above describe the v0.8.4 baseline.
