# Journal efficiency and same-origin writer coordination

Status: **Pass** for focused automated tests, the comparable in-memory storage benchmark, and actual Chromium primitive tests. Store integration and full-app two-tab acceptance are reported separately by the main v0.8.5 report. Physical Android storage performance and forced OS process termination: **Not run**.

## Observed baseline and change

The v0.8.4 journal serialized and copied the complete journal into new 100,000-character chunks on every durable save, then retained the previous complete copy. A 1,000-operation queue caused about 886.5 MB of cumulative storage writes in the repeated local fixture despite only about 3.53 MB remaining resident.

The v0.8.5 journal keeps row-aligned, content-addressed immutable chunks. It writes changed chunks and atomically swaps the manifest after all chunks finish. The manifest retains the complete previous generation descriptor; garbage collection removes only chunks referenced by neither current nor previous generation. SHA-256 verifies every v2 chunk and the ordered list of chunk references. UTF-16 surrogate pairs are never split across storage rows. Queue snapshots are deeply frozen before persistence, allowing safe reuse of serialized immutable entries; mutable caller values are serialized again.

The same 1,000-edit fixture measured:

| Metric | v0.8.4 comparable run | v0.8.5 | Reduction |
| --- | ---: | ---: | ---: |
| Capture wall time | 7,718.5 ms | 2,372.9 ms | 69.3% |
| Resident bytes | 3,527,018 | 1,793,141 | 49.2% |
| Cumulative bytes written | 886,530,500 | 42,817,377 | 95.2% |
| Storage writes | 10,355 | 3,016 | 70.9% |
| Largest storage row | 100,000 bytes | 56,224 bytes | 43.8% |

These measurements use actual baseline HEAD modules and current implementation with the same AsyncStorage-compatible in-memory adapter, fixture, and successful restart assertion. They measure host CPU/storage-call behavior, not Android disk, cloud billing, UI frame rate, or production network latency. Host load varies; the machine-readable evidence is [journal-benchmark.json](journal-benchmark.json). Reproduce with `node tests/helpers/cloud-journal-085.cjs`.

Explicit consolidation of the fixture's 1,000 compatible unsent title edits produces one pending logical mutation. Consolidation preserves the first and final task values and records all contributing operation IDs/timestamps. Sent, retried, conflicted, message, destructive, structural, and unrelated task operations form barriers. Only contiguous changes to the same task qualify: title, description, priority, custom values and absolute start/due dates, including the editor’s timestamp and false-only verification/merge resets. Date consolidation does not widen the server independent-field classifier: the final scheduling mutation still runs canonical project validation. Ordering, workflow, assignment, hierarchy/dependency and multi-record scheduling operations remain separate atomic boundaries. The actual editor example (five title edits, one description, two priorities and one deadline) consolidates nine accepted local edits into one canonical mutation. The previous generation deliberately retains pre-compaction pending work until the next valid generation; compaction is not permission to erase unacknowledged work.

## Durability and corruption tests

Focused tests cover termination at every chunk/manifest write boundary, failed storage cleanup, restart recovery, old inline and v1 sharded migration, invalid manifest paths including previous-generation references, checksum corruption, missing chunks, surrogate boundaries, mutation of generic caller data, and safe reuse of previously unverified retained chunks. Invalid current generations fail closed with an error; they never silently become an empty queue or silently roll back to a potentially stale previous queue. A previous generation is retained for deliberate recovery, since automatic rollback could discard accepted offline edits.

Lost cloud acknowledgments preserve the exact durable operation ID and payload. Wire compaction is selected once before the first send and persisted in `sent`; pre-upgrade full-record payloads replay verbatim, so a lost v0.8.4 acknowledgment does not cause receipt-hash reuse after upgrading. Conflict resolution archives the complete original operation in `resolvedConflicts`, inserts a fresh pending operation with its own ID, validates the resulting local workspace, and leaves authorization/revision checks to the trusted backend. The old payload remains available after restart. It does not mark the resolution synchronized before server acknowledgment.

## Acknowledgment cursor optimization

A successful mutation acknowledgment now advances the durable cursor only when the trusted server’s `committedSequence` marker equals `sequence`, that sequence is exactly the journal’s current cursor plus one, and acknowledgment records include effects from that sequence. Record reconciliation, cursor advancement, and queue removal persist atomically. The immediate unchanged refresh can then perform only three fresh authorization/workspace reads rather than rereading the acknowledged task.

A gap retains the old cursor so intermediate collaborator changes are fetched. No-op acknowledgments never advance the cursor: another actor may have updated multiple records at the reported sequence while the no-op returns only one of them. Legacy receipts without the marker and message acknowledgments also retain the old cursor. Lost acknowledgments replay the durable identity; duplicate commit receipts can advance only the same contiguous sequence. A delayed older acknowledgment cannot replace a higher-sequence record already installed by a concurrent refresh.

Deterministic tests cover contiguous persistence/restart, gaps, the multi-record collaborator/no-op counterexample, lost acknowledgment plus reconnect, messages, legacy receipts, and a refresh racing a delayed acknowledgment. These operation savings are unit/integration measurements; emulator server behavior and production billing remain separately measured.

## Web writer policy

`acquireLocalWriter(localId)` uses a browser Web Lock held for the store/workspace lifetime. A simultaneous second tab receives `workspace-in-use` before writing. Tab termination releases the lock through the browser; another tab can then acquire it and resume the durable pending queue. Web Locks unavailable: fail closed with `workspace-coordination-unavailable`, rather than using a racy localStorage lease. Native has one application writer and a no-op release function. The helper supports separate lock names per workspace; the store may hold a broader index/store lock because creating/deleting/switching workspaces also mutates shared index state.

The isolated real-browser test uses two Chromium tabs on one local origin, real Web Locks/localStorage, and the actual journal storage implementation. It checks simultaneous acquisition, exclusion, termination, takeover, preservation of the first tab's pending edit, append from the successor, and checksum-valid reread. Evidence: [journal-tabs.json](journal-tabs.json). Reproduce with `node tests/helpers/cloud-journal-tabs-085.cjs`. This is a real browser primitive/integration check; full application navigation and two-tab UX require the separate application acceptance run.

## Privacy and rollout

No persistent Firebase authentication, credentials, remote schema migration, paid service, or Metro change was introduced. Account/organization/backend/local-workspace journal scope keys remain unchanged. Retained offline journals still contain private plaintext content; production shared-device policy should require explicit account sign-in, retain unsynchronized intent for deliberate recovery, and consider separately reviewed device encryption/erasure without deleting unacknowledged edits. There is no claim of device encryption in this patch.

Migration is automatic when a validated inline/v1 journal is next saved. Before updating, disconnect cloud synchronization after acknowledgments and export a local backup plus any unresolved journal. To revert, retain the v0.8.5 journal reader or export/read pending v2 intent before restoring v0.8.4 code; the old reader cannot consume v2 manifests. Never delete journal keys as an update step. Interrupted staging can leave orphan chunks; they do not replace current work. An orphan sweep must be explicitly scoped and proven against current/previous manifests before future implementation.
