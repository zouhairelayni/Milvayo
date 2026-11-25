# Check for 0.8.40: bring a deleted task back (two DIFFERENT accounts; B must be a manager)

Status of this version: Planner-tested only. Nothing counts as working until you have seen it on both devices. Use a test task.

1. A edits a task title but stays offline. B deletes that task. A goes back online. The Cloud screen says the change needs review; opening it says someone deleted the task.
2. Press **"Bring the task back"**. The task is back on A and, within about a minute, on B, with A's new title. The conflict is gone and the counter says 0.
3. The restored task has no parent, dependencies, sprint or release (expected). Write down anything else that is missing (list, labels, comments?).
4. Repeat step 1, but press "Keep cloud version (drop my edit)". The task stays deleted (unchanged behaviour).
5. As a contributor-only account, a "Bring the task back" attempt is refused with a plain message.
6. Recovery: Settings, Cloud, Recovery. Choose a backup file made before the delete, type the task ID, press "Bring this task back from the backup". The task appears on both devices. Try it on a task that is alive: it says it already exists and changes nothing.

Write down for each step: as described, not as described, or unclear, and what you saw.
