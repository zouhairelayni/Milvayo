MILVAYO — FIREBASE v4.0: DECISIONS MADE ON THE OWNER'S BEHALF (2026-11-10)

You said you are not a developer and that making these choices is the reason Claude builds the product. So Claude chose, using the safest option that keeps the product working. Every choice below is a working default: it is reversible, nothing was deployed, and you can overrule any of them in one sentence. Your standing rules are unchanged: no deploy, no commit, push or merge, never `git add .`, and security checks are never weakened to save reads.

| # | Question (plain words) | Decision | Why |
| --- | --- | --- | --- |
| D1 | Two people edit the same task at nearly the same time. Who wins? | Neither silently. The server refuses an edit made from out-of-date data and says so. The app then re-applies the edit by itself if the other person changed different fields and shows a review screen only if the same fields clash or the edit was made offline. | Nobody loses work without noticing, and harmless overlaps cost no extra taps. |
| D2 | How long do deleted items stay recorded in the cloud? | 90 days. A device that was offline longer than that downloads the project fresh before syncing. | Long enough for any realistic holiday or broken phone, short enough to keep storage small. |
| D4 | Project totals (task counts per status). | Not stored per edit; counted when needed. | It removes one write from every status change. |
| D5 | Wording of messages shown when a change cannot be saved (revoked access, deleted task, storage full, outage). | Claude drafts the wording with the sync screens (Gate 4) and shows it to you before release. | You should approve what users read, not invent it now. |
| D6 | How much work may be lost in a disaster, and how long may recovery take? | Lose at most 24 hours, recover within a working day: a daily automatic backup plus point-in-time recovery switched on, and a restore rehearsal before any real user data. | Standard for a small product; stronger targets cost more and can be bought later. |
| D7 | The 10-minute window after a failed access removal. | Keep 10 minutes while there are no real users. Before launch, shorten it and add automatic repair of failed removals. Failed removals are already retried three times and shown to the administrator. | Tightening it now only adds cost to testing. |
| D9 | Should every chat message be logged in an audit trail? | No. Only security-relevant actions are logged (permission changes, exports, restores, bulk deletes, administration). | Messages are already stored; a second copy doubles the writes. |
| D10 | May Gate 3 (the new way devices learn about changes) start? | Yes, starting with a small test of the design in your emulators before building the full thing. | It is the biggest unknown; prove it cheaply first. |
| D11 | The experimental faster-but-looser access check. | Stays off and experimental. It is never used for real users unless the benchmark shows it matters and the security review accepts it. | Speed must not cost security. |

Security-related choices Claude made without asking, because they only close gaps: revoked administrators lose their role, operation IDs are tied to their exact content, chat obeys the write freeze, internal error text is hidden, invitations are capped and need a real workspace.

What still needs a person rather than a decision: running the tests on your phone and sending the results.
