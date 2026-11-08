# Saving task changes

Task details uses the same Save action for ordinary task fields and Planning & delivery.

Typing a title, description, effort, custom field or verification text saves a scoped draft on this device. Text entry does not send a cloud request per keystroke. Leaving a completed title or verification field commits its draft through the existing domain rules. Save validates the combined draft, waits for local storage, consolidates compatible queued task edits and requests synchronization immediately. Done follows the same save path before closing. Invalid drafts stay available for correction.

The default editing checkpoint is 45 seconds. Connected workspaces can choose 30, 45 or 60 seconds in Settings → Firebase emulator → Periodic editing checkpoint. Status and owner selection request synchronization promptly. Offline edits remain pending; foreground polling replays them after connectivity returns. The separate ten-minute policy is available to the benchmark API, rather than being the default collaboration policy.

“Draft saved on this device” acknowledges draft persistence. “Saved on this device · cloud synchronization pending” describes queued work. “Cloud acknowledged all queued changes” appears only after a trusted-server response and an empty pending queue. A failed or conflicting request never becomes a cloud acknowledgment.

When another update changes a field before a local draft is committed, Task details shows both values and offers Use my draft or Keep current task. For conflicts in the durable synchronization queue, open Settings → Firebase emulator → Resolve sync conflicts → Review conflicts. Compare your changed fields with the latest authorized cloud version, then deliberately keep either version. The resolution receives a new mutation ID and current revision. Original queued intent remains in Export sync recovery. If the remote version changes after the comparison, compare again. Deleted records require the existing authorized recovery workflow; the retained edit is not silently discarded.

Draft keys include the local workspace, project, task and connected Firebase account/backend identity. They do not enable persistent authentication or automatically reopen borrowed cloud work after restart. Retained draft and journal contents remain plaintext local recovery data; shared-device encryption and deliberate retention policies remain production gates.

Reversible update: export a local backup and sync recovery before updating. Install the update in place without clearing storage. Revert application source if necessary and retain cloud journal/draft keys until all pending work is recovered. The workspace schema and JSON/niyav formats are unchanged.
