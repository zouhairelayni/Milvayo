# Smart Save and conflict verification

Implementation: `src/screens/tasks/taskDraft.cjs`, TaskSheet/TaskFields, the store draft factory, `src/cloud/session.cjs`, and CloudConflicts. Existing domain validators remain authoritative. No dependency or Metro change is required.

## Pass — deterministic tests

`tests/cloud/task-draft.test.cjs` covers many keystrokes consolidated into one combined standard/advanced commit, draft restart, validation rejection, same-field concurrent changes, disk failure, cancellation/no-op, account/environment scoping, corrupt draft retention, and edits arriving while a save is in flight.

`tests/cloud/session.test.cjs` preserves the original five account/revocation/recovery checks and adds ten independent captures consolidated into one compact cloud mutation, simultaneous Save requests, acknowledgment completion, configurable batching limits, same-field conflict comparison, current-revision resolution, and retention of the original conflict.

New wire payloads are prepared once in the journal and frozen before sending. Existing v0.8.4 frozen full-record payloads replay byte-equivalent logical content with their original mutation IDs. The session send layer does not re-encode retries.

Save waits for draft writes and the canonical local workspace writer, then the durable journal, then trusted-server acknowledgment. It checks pending/conflict status afterward. A failed network drain leaves pending status visible. The local draft clears only after domain acceptance and a successful local workspace flush.

## Runtime evidence

See `task-save-web.json` and `task-save-web.png` for the actual Expo Metro Web checks, if present. Browser source checks alone are not runtime acceptance. The independent journal two-tab experiment is documented separately. Physical Android Expo Go and Fast Refresh: **Not run** in this environment. CI Metro intentionally disables watchers. Real cloud conflict UI with two signed-in browser accounts: **Not run** in this pass; deterministic session tests exercise its actual resolution API and the emulator security suite verifies the trusted backend.

## Limits and recovery

Conflict resolution retains the original queue entry in `resolvedConflicts` until deliberate recovery/retention policy is introduced. Deleted remote records require authorized restoration; the comparison UI explains this and retains the original edit. Current revision/sequence and local actor are available in the comparison; authoritative remote actor history remains in server versions/audit rather than being guessed by the client.

Raw drafts are separate scoped local records and do not change the workspace schema. Their successful write is acknowledged; an operating-system kill before an asynchronous storage write finishes cannot be certified as durable. Device termination/72-hour offline acceptance remains a physical-device gate. Shared-device encryption and expiration of retained private journal/draft data remain production policy gates. Memory-only Firebase authentication remains unchanged.

The ten-minute batching API accepts 600,000 ms for controlled experiments; the user-facing policy remains 30–60 seconds. This limits routine collaboration staleness while retaining a measurable long-batch comparison.
