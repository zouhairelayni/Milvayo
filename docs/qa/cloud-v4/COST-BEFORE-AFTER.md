# Firebase v4 sandbox cost comparison: before (legacy commit) and after (field patch)

Instrumented document reads (R) and writes (W) per edit from the in-memory transactional fake. Not billing, not the emulator, not production. Reproduce: `node tests/helpers/bench-v4-sandbox.cjs`.

| Workflow | Size | Before | After |
| --- | --- | --- | --- |
| Title / priority edit | 100 tasks | 6 R / 6 W | 5 R / 1 W |
| Title / priority edit | 500 tasks | 6 R / 6 W | 5 R / 1 W |
| Title / priority edit | 2000 tasks | 6 R / 6 W | 5 R / 1 W |
| Status change | 100 tasks | 8 R / 7 W | 6 R / 1 W |
| Status change | 500 tasks | 8 R / 7 W | 6 R / 1 W |
| Status change | 2000 tasks | 8 R / 7 W | 6 R / 1 W |
| Start and due dates | 100 tasks | 109 R / 6 W | 5 R / 1 W |
| Start and due dates | 500 tasks | 509 R / 6 W | 5 R / 1 W |
| Start and due dates | 2000 tasks | 2009 R / 6 W | 5 R / 1 W |
| Labels, estimate, progress | 100 tasks | 109 R / 6 W | 5 R / 1 W |
| Labels, estimate, progress | 500 tasks | 509 R / 6 W | 5 R / 1 W |
| Labels, estimate, progress | 2000 tasks | 2009 R / 6 W | 5 R / 1 W |
| Delete a task (no relations) | 100 tasks | 110 R / 7 W | 8 R / 1 W |
| Add a dependency | 100 tasks | 109 R / 8 W | 9 R / 2 W |
| Delete a task (no relations) | 500 tasks | 510 R / 7 W | 8 R / 1 W |
| Add a dependency | 500 tasks | 509 R / 8 W | 9 R / 2 W |
| Delete a task (no relations) | 2000 tasks | 2010 R / 7 W | 8 R / 1 W |
| Add a dependency | 2000 tasks | 2009 R / 8 W | 9 R / 2 W |
| Create a task | 100 tasks | 110 R / 6 W | 7 R / 1 W |
| Add a comment | 100 tasks | 110 R / 5 W | 7 R / 1 W |
| Log a time entry | 100 tasks | 111 R / 5 W | 7 R / 1 W |
| Create a task | 500 tasks | 510 R / 6 W | 7 R / 1 W |
| Add a comment | 500 tasks | 510 R / 5 W | 7 R / 1 W |
| Log a time entry | 500 tasks | 511 R / 5 W | 7 R / 1 W |
| Create a task | 2000 tasks | 2010 R / 6 W | 8 R / 1 W |
| Add a comment | 2000 tasks | 2010 R / 5 W | 7 R / 1 W |
| Log a time entry | 2000 tasks | 2011 R / 5 W | 7 R / 1 W |
| Move a Canvas object | 10 objects | 22 R / 6 W | 5 R / 1 W |
| Delete a Canvas object | 10 objects | 23 R / 7 W | 9 R / 1 W |
| Move a Canvas object | 100 objects | 112 R / 6 W | 5 R / 1 W |
| Delete a Canvas object | 100 objects | 113 R / 7 W | 9 R / 1 W |
| Move a Canvas object | 500 objects | 512 R / 6 W | 5 R / 1 W |
| Delete a Canvas object | 500 objects | 513 R / 7 W | 9 R / 1 W |
| Move a Canvas object | 1000 objects | 1012 R / 6 W | 5 R / 1 W |
| Delete a Canvas object | 1000 objects | 1013 R / 7 W | 9 R / 1 W |

Not optimized yet (still the legacy full-validation path): sprint operations, Canvas add and text edit (they can grow a board past its 2 MB limit, which cannot be checked without reading it), project-level operations. Deletes and dependency edits with many related records (more than 100 related rows, 200 downstream tasks, 300 upstream tasks, or 100 changed records) are refused by the field patch and fall back to the full editor.
