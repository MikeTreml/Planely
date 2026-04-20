## Code Review: Step 1: Backlog data contract

### Verdict: REVISE

### Summary
The new backlog projection helpers are a solid start and the added contract test gives Step 1 useful coverage for ready/blocked/running/done shaping plus navigation metadata. However, the current contract still misclassifies some canonical runtime states from the orchestrator, so the backlog payload is not yet reliable enough to be the stable server-side data contract promised by Step 1.

### Issues Found
1. **[dashboard/server.cjs:1367-1377] [important]** `buildBacklogDisplayStatus()` does not handle `activeTask.status === "succeeded"`, even though the orchestrator emits `succeeded` as a canonical lane task status (`extensions/taskplane/types.ts:927`, `extensions/taskplane/persistence.ts:205`). If Step 2 feeds an active/current task outcome with `succeeded` before `.DONE` or a completed STATUS string is observed on the packet, this function falls through and can report the task as `ready` instead of done. Add an explicit `succeeded` branch with batch-state precedence, and cover it with a contract test.
2. **[dashboard/server.cjs:1460-1466] [important]** `readiness.waitingOn` treats every `status.key === "waiting"` as `"active-batch"`, but `buildBacklogDisplayStatus()` also uses `waiting` for packets that are merely `🟡 In Progress` outside the active batch (`dashboard/server.cjs:1409-1416`). That produces incorrect contract data: the row says it is waiting on an active batch when no active batch membership exists. Split queued/in-batch waiting from out-of-band in-progress work, or derive `waitingOn` from `currentTask` presence rather than the coarse status key.

### Pattern Violations
- None noted beyond the contract mismatches above.

### Test Gaps
- Missing a case for `activeTask.status: "succeeded"` to ensure batch-state completion wins deterministically.
- Missing a case for `statusData.status: "🟡 In Progress"` with no `activeTask`, asserting `readiness.waitingOn` does **not** claim `active-batch`.

### Suggestions
- Consider making the status contract terminology consistent across key/label pairs (`done` vs `succeeded`) before the frontend starts consuming it, to avoid leaking internal naming mismatches into later API/UI work.
