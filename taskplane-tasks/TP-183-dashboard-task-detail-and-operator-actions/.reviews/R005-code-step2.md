## Code Review: Step 2: Operator actions contract

### Verdict: APPROVE

### Summary
The Step 2 contract work now matches the orchestrator’s current phase semantics: task rows expose a consistent action descriptor shape, batch-level integration affordances are included in the dashboard state, and the earlier start-gating mismatch from R004 has been corrected. The added regression tests cover the main boundary that mattered here (`completed`/`failed`/`stopped` vs active phases) and the implementation stays within the “contract first, safe fallbacks for unsupported actions” scope expected for this step.

### Issues Found
1. **None.** No blocking correctness issues found for Step 2 after the R004 follow-up.

### Pattern Violations
- None that block this step.

### Test Gaps
- `dashboard/server.cjs:1986-2035` — There is still no focused contract test for retry/skip copy-fallback messaging across paused/stopped/failed vs active phases, so future edits could drift from `orch_retry_task` / `orch_skip_task` semantics without immediate coverage.
- `dashboard/server.cjs:2039-2052` — A small test for the `null` batch-state branch of `buildBatchActionContract()` would help pin the top-level no-batch dashboard contract now that `batchActions` is always present.

### Suggestions
- `dashboard/server.cjs:1969-2037` — As noted in R004, consider centralizing the dashboard action phase rules in one helper/constant shared across start/retry/skip gating so Step 3 UI work cannot accidentally reintroduce phase drift.
- `dashboard/server.cjs:2008-2034` — Before Step 3 consumes this payload, consider whether the action field names should align more closely with the operator-console affordance vocabulary (`disabledReason` / `commandBacking` / confirmation flag + copy) to reduce frontend translation logic.
