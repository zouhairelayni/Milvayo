# Conversation refresh review

Before-audit, in required order: spacing: existing 12/8/4 grid; color: themed controls and neutral text; icons: unchanged; copy: bounded history controls already explicit; typography: existing T roles; layout: existing Fold preserved; details: 3-second interval overlaps slow requests and ignores hidden pages; visuals: content only; motion: none added.

Product: precise independent-project workspace and authorized conversations.
Character: calm, exact, dependable.
World: quiet planning instruments and technical workbenches.
Moments: meaningful project/task messages and verified progress.
Signature: user-selected accent and meaningful status colors.

Unslop review standard by Damir Sokolovsky, CC BY 4.0, [bundled original](../../../.opencode/skills/unslop/SKILL.md). The existing visual language is preserved. Scope is refresh scheduling only; no schema migration.

Open conversations now use sequential polling, starting at 3 seconds, doubling to a 30-second unchanged ceiling, or 120 seconds while backgrounded/hidden. Foreground return refreshes immediately. Message saves and manual refresh retain immediate refresh. Closed conversations retain zero polling. Existing server authorization and 50-message paging remain unchanged. Workspace scheduling uses the shared delay policy with its own lifecycle.

This deliberately accepts up to 30-second remote conversation visibility delay on an unchanged open conversation and up to 60 seconds for workspace content. These are configured bounds, not network delivery guarantees. No permanent broad Firestore listener, paid cache, or Firestore typing/presence writes are introduced. RTDB presence remains ephemeral; future authorized event signaling can reset the same policy.
