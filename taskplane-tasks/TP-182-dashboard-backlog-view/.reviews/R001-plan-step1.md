## Plan Review: Step 1: Backlog data contract

### Verdict: APPROVE

### Summary
The Step 1 plan is appropriately scoped to the task’s required outcomes: it defines the backlog row contract, commits to mapping canonical file/runtime state into operator-facing statuses, preserves room for later task-detail navigation, and includes server-side shaping tests. The preflight notes in `STATUS.md` also show a sound architectural direction: derive backlog data from task packet folders and enrich it additively through existing dashboard payloads rather than creating a second source of truth.

### Issues Found
1. **[Severity: minor]** — No blocking issues found for this step. The planned outcomes cover the essential contract work required by `PROMPT.md` Step 1.

### Missing Items
- None.

### Suggestions
- In the contract notes, make the status precedence explicit when multiple signals disagree (for example: active batch membership vs `.DONE` vs `STATUS.md`), so Step 2 implementation stays deterministic and resumable.
- Define `lastActivity` fallback behavior up front (for example: prefer active batch/runtime timestamps, then batch-history hints, then packet file mtimes or null) to avoid ad hoc UI handling later.
- Capture whether backlog rows carry raw source fields alongside display-ready labels; that will make later task-detail drill-in and filtering easier without revisiting the payload shape.
