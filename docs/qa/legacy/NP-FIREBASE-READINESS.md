# Niyarvo Projects Firebase readiness (planning only)

User-reported Firebase project name: `niyarvoprojects`.
Android application ID in `app.json`: `com.niyarvo.projects` (verified against source).
iOS bundle identifier: `com.niyarvo.projects` (present in source; iOS provisioning not verified).

**No Firebase SDK, credentials, service account, deployment or remote sync is included in v0.2.8.** Before cloud work, confirm the *actual* Firebase project ID in console (`niyarvoprojects` may be the display name). Ensure this is a distinct backend from RIVNA and Niyarvo Control Center. Do not import existing engineering roadmaps.

Next backend milestones: explicit environment-based initialization; Firebase Auth; owner/workspace/role-scoped Firestore rules tested in Emulator; Firebase Storage rules and file-size/type validation; offline mutations, conflict/revision policy and restore path; scoped Auth claims; App Check where supported; hosting preview then staged deployment. Start with deny-all rules and verified emulator tests, not permissive production rules.

Suggested local verification: `firebase projects:list` (after Firebase CLI login). Deploy only after local QA is accepted and Firestore/Storage security tests pass.
