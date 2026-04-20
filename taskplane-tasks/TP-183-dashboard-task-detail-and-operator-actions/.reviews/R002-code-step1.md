## Code Review: Step 1: Task detail view

### Verdict: APPROVE

### Summary
The implementation delivers the Step 1 outcome: the dashboard now exposes a dedicated task detail surface, the server enriches backlog packets with the additional PROMPT/STATUS metadata needed to power it, and navigation into the shared detail view works from backlog, live lanes, and history. The changes are scoped cleanly to the dashboard UI/server and do not appear to disturb the existing monitoring flows.

### Issues Found
1. **None.** No blocking correctness issues found for Step 1.

### Pattern Violations
- None observed.

### Test Gaps
- No automated coverage was added for the new markdown parsing helpers in `dashboard/server.cjs` (`parseStatusExecutionLog`, mission/dependency/file-scope extraction) or for task-detail selection/rendering behavior in the dashboard UI.
- A lightweight regression check around selecting a history-only/live-only task would help guard against future detail-panel/render-state drift.

### Suggestions
- `dashboard/public/app.js:1648` — Consider separating “selected backlog card” state from “selected task for detail” state. As written, when the chosen task is not present in the filtered backlog list, the UI falls back to highlighting `filtered[0]` while the detail panel still renders the originally selected task, which can create a mild selection mismatch.
- `dashboard/server.cjs:163-192` / `1603-1670` — The new markdown section/bullet parsing is reasonable; if this surface grows further, consolidating the duplicate section/bullet helpers into one shared pair would reduce drift risk.
