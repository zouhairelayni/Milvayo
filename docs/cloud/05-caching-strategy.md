# Three cache layers

A — Device: existing AsyncStorage plus scoped confirmed/optimistic journal records. No browser-persistence assumption on Expo Go. Chunk generations retain one prior successful journal snapshot; pending operations are never LRU-evicted. Corrupt/missing chunks and incompatible schemas stop cloud sync. A borrowed remote view restores its local source on logout/revocation/crash; the session clears its in-memory client. Scoped recovery journals retain unsent work and must be treated as private device data. IndexedDB persistence and cross-tab writing are not enabled.

B — Shared read models: per-project task count, status counts and Canvas-object count. Initial import builds them once; record commits adjust them incrementally in the same transaction. Direct clients cannot write them. Summaries are returned only for readable projects. No organization-wide summary aggregates confidential project content. Existing main dashboard calculations are preserved; the cloud summaries are exposed in Settings for comparison.

C — Server: bounded 32-entry, ten-second record-response cache keyed by tenant, workspace, actor, grant/generation, sequence and cursor. Every hit still checks active membership and current grants. An unchanged pull avoids a record query entirely. There is no paid cache or Redis dependency. No private data is sent to a public CDN.

Measured 129-record fixture: cold content pull 132 instrumented reads; unchanged warm pull 3; cached hydration 3; summary pull 4. Cache hydration transfers the same authorized content bytes; it reduces database reads, not response size. See machine-readable benchmarks for timing and heap samples. Actual backend mutation validation remains the dominant read cost; caching must not hide that cost or skip authorization.

## v0.8.5 cache and journal changes

Cold/warm/cached pulls retain 132/3/3 reads and fresh authorization. Shared summaries update only when task count/status or Canvas-object count changes. Immutable content-addressed local chunks reuse unchanged journal rows and preserve current+previous generations; partial publication/corruption fails closed. No pending work is evicted. Scoped drafts/journals remain plaintext private device data, not encrypted caches. Browser store initialization holds an origin-wide Web Lock; a competing tab blocks instead of racing shared storage. No paid cache, persistent Auth or schema migration. [Evidence and rollback](../qa/cloud-085/journal.md).
