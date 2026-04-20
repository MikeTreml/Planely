## Plan Review: Step 1: Query/refresh contract

### Verdict: APPROVE

### Summary
The revised Step 1 plan now cleanly matches the current dashboard architecture. It resolves the two blocking gaps from the prior review by collapsing refresh/re-scan into a single `/api/state`-backed action and by defining `Pending` as a local non-terminal subset that composes with the existing repo/search/status filters.

### Issues Found
1. **[Severity: minor]** — `taskplane-tasks/TP-189-dashboard-query-and-refresh-controls/STATUS.md:93-96` and `dashboard/public/app.js:2142-2239` describe the intended empty/loading/error distinctions, but the plan does not yet name whether the manual refresh success/error feedback should be transient or sticky. This is not blocking for Step 1, but Step 2 should choose a deterministic behavior so the control bar does not leave stale success/error text on screen.

### Missing Items
- None.

### Suggestions
- The prior REVISE findings appear addressed: the Step 1 contract now explicitly uses one manual refresh action instead of two duplicate controls, and it defines how `Pending/All` intersects with existing filters.
- In Step 2, preserve the current SSE-first model by framing the button as “request fresh snapshot now” rather than as a separate background refresh mode.
- When implementing `Pending`, make sure the UI copy distinguishes “no pending tasks exist” from “pending tasks were filtered out by repo/search/status filters,” since the current backlog renderer already supports filter-sensitive empty states.
