# Milvayo cloud backend: security, isolation, integrity and disaster-recovery audit

Date: 2026-11-09. Subject: Milvayo 0.8.5 + Firebase v3.1.2 security baseline + v4 Gate 2 `patch` (source as delivered). No production system, no live Firebase project and no penetration test were involved.

Evidence labels: EXECUTED = reproduced by running code in the sandbox; CODE-READ = established by reading source only; NOT ASSESSED = outside this audit. Severity: High = privilege escalation or loss of isolation; Medium = real weakness that needs a decision before production; Low = hardening.

## 1. Verdict

Tenant and project isolation is well designed and consistently enforced: every API request re-reads membership, grant and workspace state, Firestore and Storage rules are deny-by-default, explicit project denials override workspace roles, and cache keys include user and grant version. One confirmed privilege-persistence bug (S1) should be fixed before any real user is invited. Disaster recovery does not exist yet at production level: only user-triggered exports and emulator snapshots. The backend is hard-locked to the local emulator, so nothing here is production-certified.

## 2. Findings

Remediation status (2026-11-09): S1, S2, S3, S9 and the operation-ID and chat-freeze findings from the independent review are FIXED and regression-tested (see GATE2-FIXES-REPORT.md); S13 is mitigated (RTDB retries) but the 10-minute decision remains open; S11 is partly accepted; everything else is open as listed.

| ID | Severity | Evidence | Finding | Recommendation |
| --- | --- | --- | --- | --- |
| S1 | High | EXECUTED | Revoking a member keeps their organization role (`{...member, active:false}`), and accepting an invitation restores it (`role: member.role || default`). A revoked admin or billing user who is re-invited as a viewer returns as admin and can then grant themselves any workspace role. Reproduced: after revoke `{active:false, role:'admin'}`, after re-invite `{active:true, role:'admin'}`. | On revoke clear or downgrade the role; on accept never inherit a stored role for an inactive member (use the invitation's role or the default). Add the reproduction as a regression test. |
| S2 | Medium | CODE-READ | A platform `security` role can assign any platform role including `owner`, and can demote other owners when more than one exists; only the last owner is protected. | Only owners assign or remove owners; require a second approver or an audit alert. |
| S3 | Medium | CODE-READ | Callers can read `e.message` of internal errors: the entry point returns it for every failure with HTTP 400. Reproduced: `history` on a missing record returns "Cannot read properties of undefined (reading 'projectId')". Every success response also carries `telemetry` (CPU, heap, timing) to any authenticated caller. | Map unknown errors to a generic message with a request ID, log details server-side, return telemetry only to platform roles. Fix the `history` null check. |
| S4 | Medium | CODE-READ | No App Check, no per-user or per-organization rate limits, no quotas on organizations created per user or invitations per workspace, CORS allows any origin. `maxInstances` is only a cost cap. | Production: App Check, per-uid throttling, quotas, restrict CORS to the app origin. |
| S5 | Medium | CODE-READ | `verifyIdToken` is called without revocation checking, so a disabled Auth account keeps a valid token up to about one hour. Data access still ends when membership is revoked, because every request rechecks Firestore. | Accept with documentation, or add a cheap per-user "tokens valid since" check instead of a network revocation check on every request. |
| S6 | Medium | CODE-READ | The platform listing reads every organization (unbounded) and returns names to operations, billing, security and owner roles. | By design for platform staff; cap and page it, and log access. |
| S7 | Low | CODE-READ | Storage rules do not check that the workspace is active, offer no manager deletion of abusive uploads, and attachments are not scanned. Storage `delete` is limited to the uploader. | Add state check, manager delete, size/type review, optional scanning. |
| S8 | Low | CODE-READ | Hosting sends nosniff, frame, referrer and permissions headers but no Content-Security-Policy. | Add a CSP before web release. |
| S9 | Low | CODE-READ | An invitation can name a workspace that does not exist; invitations are unlimited. Invitation tokens themselves are good (24 random bytes, stored hashed, 24 h expiry, bound to one uid, single use). | Validate the workspace, cap pending invitations. |
| S10 | Low | CODE-READ | The simulated billing webhook signature uses a fixed fixture key. | Replace with the provider's signature check on the raw body before any payment feature ships. |
| S11 | Low | CODE-READ | v4 `patch` does not refuse edits to tasks inside a soft-deleted project (same as the legacy commit). | Check the project tombstone when the configuration is read. |
| S12 | Policy | CODE-READ | v4 removes routine history and audit. Attribution is reduced to `updatedBy` on the last write, so who changed what earlier, and malicious insider edits, cannot be reconstructed from Firestore. | Owner decision. Consider non-content security events (permission changes, exports, bulk deletes, restores stay audited) and GCP data-access audit logs where acceptable. |
| S13 | Known | Owner-verified | ACL expiry: stale RTDB authorization for up to 10 minutes after a failed revoke write; the attached-listener behavior is only a diagnostic (risks R1, R2). | Already carried into the v4 plan. |
| S14 | Limitation | CODE-READ | Revocation cannot erase data already stored on a user's device (local journal and exports). | Document; keep the offline-data policy in the v4 UI work. |

NOT FOUND: hard-coded production secrets (only the emulator fixture password and public emulator key; a diagnostics redactor exists); client-side bypass of project isolation; cross-user cache leakage in `pull`; cross-tenant document paths (all paths are built from validated segments).

## 3. Isolation and permission model (what holds)

- Path isolation: organization and workspace IDs pass a strict segment check; all data lives below `orgs/{org}/workspaces/{ws}`.
- Every handler re-reads `members/{uid}`, `grants/{uid}` and the workspace document inside the transaction; revoked or inactive users are refused immediately (EXECUTED in acl-signal and patch tests).
- Role resolution: a project entry overrides the workspace role; `'none'` denies; unknown roles grant nothing. The 320-case equivalence test shows the new patch path cannot grant more than the legacy path.
- Firestore rules: clients may only read; reads are checked against membership, workspace state and the same project rules; versions, receipts, invitations, messages and administration data are not client-readable.
- RTDB: ACL and heads are server-written; heads now require unrestricted workspace read (12 emulator cases passed).
- Directory, notifications and messages filter by the caller's project access.
- Last-owner protection for organization and platform roles; role changes are owner-only; seats enforced for editors.

## 4. Data integrity

Strong: transactions on every write path; revision checks and stale handling; idempotent commits (legacy) and operation IDs (v4); soft deletes only (no physical delete path); bulk changes capped at 100; restore needs the manager role; import is digest-verified end to end and finalized atomically; record envelopes, sizes and keys are validated against forged paths.
Gaps: backups use an unkeyed SHA-256 (detects accidents, not tampering); no schema-level protection against an authorized user making many valid but destructive single edits (policy: rely on backups); tombstones are never purged and retention is "configured, not enforced" (no right-to-erasure path).

## 5. Disaster recovery

State today: the only recovery assets are (a) `backup`, a user export, and (b) emulator snapshots. Production backups, point-in-time recovery and cloud IAM are documented as "Not run".

| ID | Severity | Gap |
| --- | --- | --- |
| D1 | High (before launch) | No production DR: no scheduled Firestore backups or PITR, no RTDB backup, no Storage versioning or soft-delete, no Auth export, no deletion protection, single region, no stated RPO/RTO. |
| D2 | High | With v4 removing versions, undoing a bad bulk edit or an account takeover depends entirely on independent backups. Gate 5 must exist before launch. |
| D3 | Medium | The `backup` action reads the whole workspace in one transaction and returns it inline: unmeasured at scale, subject to function time, memory and response limits, and it bills a read per record. |
| D4 | Medium | A backup contains records and chat extras only. It does not contain grants, members, subscription, summaries, RTDB state, attachments or configuration, so restore cannot reproduce permissions. `restoreNew` makes the importer the sole manager. |
| D5 | Medium | Backups are plain JSON on the user's device, integrity-checked but not encrypted or signed. |
| D6 | Medium | A plain Firestore export is not a consistent snapshot unless PITR or a write pause is used; the recovery point must also record rules, indexes and RTDB/Storage state. |
| D7 | Medium | The server refuses to run outside the emulator, so production hardening (service accounts, secrets, monitoring, budget alerts) has not started. |
| D8 | Low | Restore has never been drilled end to end into production-like infrastructure. |

## 6. Recommended order

1. Now (small, local): fix S1 with a regression test; make errors generic (S3); null-check `history`; check project tombstone in `patch` (S11).
2. Before Gate 3 ends: decide S12 (security events), S2, D2 scope and RPO/RTO (plan decision D6).
3. Gate 5: scheduled Firestore backups plus PITR, RTDB and Storage protection, signed and encrypted exports including grants and members, restore drill with timings.
4. Before first public release: S4, S5, S7, S8, S10, D7, a dependency audit (`npm audit` could not run without network), and an external review of production IAM.

## 7. Not assessed

Production IAM and service accounts, Firebase Auth configuration (providers, email verification, enumeration protection), mobile and web client code beyond the cloud layer, dependency vulnerabilities, load and abuse behavior, the Firestore and RTDB emulators' fidelity to production, and anything requiring a live project.
