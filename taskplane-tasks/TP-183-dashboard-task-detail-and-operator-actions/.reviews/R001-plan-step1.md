## Plan Review: Step 1: Task detail view

### Verdict: APPROVE

### Summary
The Step 1 plan is appropriately scoped to the stated outcome: introduce a task-scoped detail surface that surfaces enough packet and STATUS context to make the dashboard useful beyond list triage. It also aligns with the prompt and operator-console specs by covering both the content of the detail view and navigation into it from backlog, live batch, and history.

### Issues Found
1. **[Severity: minor]** — No blocking gaps found for Step 1. The plan covers the required outcome-level work for the detail view.

### Missing Items
- None that block this step.

### Suggestions
- Call out preserving parent context/back navigation explicitly during implementation, since the interaction spec treats Task Detail as a drill-in state rather than a dead-end top-level view.
- Make sure the detail view can render partial data when live batch or history context is absent; the view-model spec expects packet identity and STATUS evidence to remain usable even without runtime context.
- Prefer extending the existing derived backlog/state payloads in `dashboard/server.cjs` rather than introducing a second task-parsing path, to keep detail and list state consistent.
