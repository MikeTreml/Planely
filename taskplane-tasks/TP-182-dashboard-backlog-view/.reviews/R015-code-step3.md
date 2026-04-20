## Code Review: Step 3: Frontend implementation

### Verdict: REVISE

### Summary
The backlog UI additions are directionally good: the new shell controls, selection panel, and no-batch summary make the dashboard much more useful when no live batch is running. However, this step also adds a `View STATUS.md` action from backlog selection that is not actually supported for most backlog items, because the existing endpoint only resolves tasks from the active batch state.

### Issues Found
1. **[dashboard/public/app.js:509-514, dashboard/public/app.js:1441-1444] important** — The new backlog selection action always calls `viewStatusMd(taskId)`, which fetches `/api/status-md/:taskId`. That endpoint still requires a current batch and only looks up tasks inside `loadBatchState()` (`dashboard/server.cjs:2039-2054`). In the primary no-batch/backlog case, or for backlog tasks not present in the active batch, the button will return 404 (`No batch state` / `Task not found`). This introduces a broken operator-facing action in the new backlog UI. Either hide/disable this button unless `item.execution?.batchId` is present and the task is known to the live batch, or add a backlog-aware status endpoint that serves `item.navigation.statusPath` directly.

### Pattern Violations
- None noted beyond the broken backlog-to-viewer wiring above.

### Test Gaps
- There is no behavioral coverage for the new backlog selection action. The added test only checks for string presence in the HTML/JS, so it would not catch that `View STATUS.md` fails for idle backlog items or completed tasks outside the active batch.

### Suggestions
- Consider adding a small affordance for the scope line when repo filtering is active and the clear button only resets search/status filters, so operators are not surprised that repo scoping remains in effect.
