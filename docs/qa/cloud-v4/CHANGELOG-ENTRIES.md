# Changelog entries for the owner to file (nothing here touches docs/changelog/CHANGELOG.md)

## Firebase v4.0 — Cheaper presence (2026-11-18, version not bumped)

- Presence now uses one small room per screen resource (task, Canvas board, conversation) at `presence/{org}/{workspace}/{project}/{resourceKey}/{uid}/{session}`. Clients listen for per-person child events instead of downloading the whole project room on every heartbeat.
- The heartbeat is 120 seconds (was 25), entries live 300 seconds, expired people are dropped by local time with no network traffic, and a changed typing/editing state is published on the open session without re-subscribing. A hidden screen removes its entry; a visible one publishes again. The disconnect hook is unchanged.
- One shared server-clock listener per client; the screen is only told when the set of people actually changed; `presenceAuthorize` is skipped when access was refreshed in the last four minutes.
- Database rules (approved by the owner): the resource level is required (22 URL-safe characters), the old path shape is refused, the entry lifetime limit is 330 s (was 90 s). Who may read or write is unchanged.
- Tests: sandbox tests run the real `client.js` against an in-memory database (10), the core (4), session wiring (2); a new rules emulator suite (9 cases). The two RTDB client harnesses now meter child events and expect the new heartbeat. Emulator run: Not run yet.
