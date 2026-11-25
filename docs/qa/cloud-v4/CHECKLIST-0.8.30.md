# Check for 0.8.30: a task someone else deleted (phone + web)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices.
Use a test task you do not need. Nothing here brings a deleted task back; that is not built.

1. **Set it up.** On the phone and on the web open the same test task, call it X. Put the phone in airplane mode. On the phone change X's title and press Save. On the web delete X. Then turn airplane mode off on the phone. The phone must still show X when you turn it back on.
2. **Wait up to 60 seconds.** The phone sends its edit and the cloud refuses it because X is deleted. In the Cloud screen the phone shows "1 conflict".
3. **Open the conflict.** In Cloud, press "Review conflicts". You should read: "Someone deleted this record. Your edit cannot bring it back yet...". You should see only ONE button: "Keep cloud version (drop my edit)". There must be no "Keep my changed fields" button on this card.
4. **Press "Keep cloud version (drop my edit)".** The conflict card disappears, the counter says 0 pending and 0 conflicts, and task X is gone on the phone too. It stays deleted on the web.
5. **Normal conflict still works.** Make an ordinary conflict: change the same task's title on both devices (web first, save, then phone, save). In Review conflicts you should still see BOTH buttons, and "Keep cloud version" should make the phone show the web's title.

Write down for each step: as described, not as described, or unclear, and what you saw. Steps 3 and 4 are the ones that matter.

Not fixed here, so do not report them as new bugs: bringing a deleted task back, the counter wording (0.8.31), edits taking up to about 50 seconds to leave the phone (0.8.32).
