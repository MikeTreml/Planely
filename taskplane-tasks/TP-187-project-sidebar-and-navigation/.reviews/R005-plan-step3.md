## Plan Review: Step 3: Integration behavior

### Verdict: REVISE

### Summary
The Step 3 plan is close to the right scope for an integration pass: it covers dashboard-state wiring, grounded badges, graceful missing/stale handling, and archived-project discoverability. However, it still misses one important outcome from the sidebar/registry contract: a successful project switch needs to refresh the project’s recency metadata (or explicitly defer Recent with justification), otherwise the “Recent” section can become stale or incorrect even if the UI wiring itself works.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-187-project-sidebar-and-navigation/STATUS.md:41-46` does not include any outcome for updating or preserving canonical project-recency metadata when the operator switches projects. That is part of the registry behavior TP-187 depends on: `docs/specifications/operator-console/project-registry-adoption.md:70-75` says successful open/switch should refresh `lastOpenedAt`, and the UX/IA depends on Recent being derived from `lastActivityAt = max(lastOpenedAt, lastBatchAt)`. Without an explicit Step 3 outcome here, the implementation can wire selection into the dashboard view but still leave Recent stale or empty after actual project switching. Add an outcome-level item covering successful switch/upsert behavior for recency timestamps (and that failed/missing-path switches do **not** mutate recency), or explicitly document that Recent is deferred for this iteration.

### Missing Items
- Explicit integration outcome for how project switching interacts with registry recency data (`lastOpenedAt` / `lastBatchAt`) so the Recent section stays grounded in real project activity rather than static seed data.

### Suggestions
- When implementing “Wire selection into dashboard loading/state,” treat that as applying to all selected-project-backed reads, not just the first state payload — especially history/SSE follow-up loads that should re-scope cleanly after a switch.
- Keep the Step 1 reset/fallback rules visible during implementation: clear stale task/history/viewer state on project change, but preserve the top-level primary view only when it remains valid in the next project (`docs/specifications/operator-console/ux-ia.md:192-198`).
