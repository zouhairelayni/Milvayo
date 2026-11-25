# Check for 0.8.29: a stuck edit must not freeze the others (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.
Edits are still sent in a background round, so after a Canvas move or a rename elsewhere wait up to 60 seconds, not 10.

1. **Make a conflict on purpose.** On the phone and on the web open the same task, call it X. On the web change the title to "Web" and press Save. Then on the phone change the title to "Phone" and press Save. The phone should now show a conflict ("1 need review" in the Cloud screen).
2. **Do other edits on the phone.** Rename a different task Y. In Canvas move one note a little. Do NOT touch task X.
3. **Wait up to 60 seconds, then look at the web.** You should see Y renamed and the note moved. Task X on the web still says "Web".
4. **Open Sync status on the phone.** It should say 1 waiting, 1 need review, and the line "A conflict is waiting for your decision. It does not hold back edits to other records." It should not say "HELD".
5. **Edit task X again on the phone** (change its priority). Wait 60 seconds. This one is expected NOT to arrive: edits of the same task wait behind its conflict. Sync status should now say "HELD: 1 later edit(s)...".

Write down for each step: as described, not as described, or unclear, and what you saw. Steps 3 and 4 are the ones that matter.

Not fixed here, so do not report them as new bugs: the counter still counts the conflict (0.8.31), a conflict on a deleted task still cannot be resolved (0.8.30), edits can still take up to about 50 seconds to leave the phone (0.8.32).
