# IAM and effective permissions

Membership is required in addition to a resource grant. Organizational hierarchy never grants project access implicitly. A project override, including none, overrides the workspace role. Organization owners/admins may explicitly manage grants; they do not automatically read workspace content. Platform roles never confer content permission.

| Resource role | Read | Create/edit | Comment | Manage/approve/export/delete/restore |
| --- | --- | --- | --- | --- |
| none | No | No | No | No |
| viewer | Yes | No | No | No |
| commenter | Yes | No | Create comments | No |
| contributor | Yes | Yes | Yes | No |
| manager | Yes | Yes | Yes | Yes |

Project metadata/configuration requires manage. Verification/merge/release approvals require approve and domain evidence gates. Commenters cannot rewrite existing comments/threads. Authoritative mutation actors come from Auth tokens and audit records; legacy owner/author labels and Canvas local-owner sentinel are never permissions.

Org owner/admin: member invitations, grant administration and simulated billing. Org billing: simulated subscription changes, billing history and licensed-seat allocation/release. Platform owner/security/operations/billing/release/support: authorized worker/configuration/audit metadata only. Platform owner/security may manage application platform roles; owner/security/release may change local feature/release configuration. Last-owner checks protect organization and platform administration. These are application roles, not Google Cloud IAM. Additional PMO/portfolio/team titles currently map to explicit resource grants rather than special hidden inheritance.

Direct client durable writes are denied, including users, roles, entitlements, audit, summaries, nested collections and versions. The Admin SDK bypasses rules, so every HTTP operation independently checks membership, resource permission, canonical validation and relevant transition gates. Queries are authorized before returning records. Confidential project overrides also suppress shared hierarchy records during hydration and direct SDK reads. Durable receipts are server-only, preventing their saved result from bypassing later revocation. Workspace metadata requires organization administration; response read counts are hidden from non-admins when they could disclose inaccessible content.

RTDB ACLs are separate, versioned, short-lived projections. A deny phase prevents an older grant update from restoring access after a newer update. Membership revocation increments all grant versions, releases seats and denies presence before returning success. Partial infrastructure failure is reported; ACLs also expire. Presence authorization renews only from fresh active Firestore membership/grants. Cached cloud data is partitioned by host/user/org/workspace/local-workspace, and permission versions reset record caches. No automatic support access is implemented.

Prototype rules require review before broad sharing. See the emulator-backed security report and remaining production gates.
