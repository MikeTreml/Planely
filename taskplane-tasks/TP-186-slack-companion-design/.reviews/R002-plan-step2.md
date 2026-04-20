## Plan Review: Step 2: Message/action contracts

### Verdict: REVISE

### Summary
The Step 2 plan covers the core notification and approval pieces, but it is not yet broad enough to satisfy the task’s stated goal of an implementable Slack companion design for notifications, approvals, **status lookup**, and lightweight control. As written, the step could produce good push-notification and approval docs while still leaving the contract undefined for other in-scope v1 interactions already established in Step 1.

### Issues Found
1. **[Severity: important]** — The plan does not explicitly cover a contract for **status lookup responses**, even though the task mission requires “notifications, approvals, status lookup, and deep-linking” (`PROMPT.md:25`) and Step 1 already makes status lookup a supported v1 action (`docs/specifications/operator-console/slack-companion.md:130-139`). If the worker follows only the current Step 2 checklist (`STATUS.md:29-33`, `PROMPT.md:75-79`), `slack-message-contracts.md` could omit the shape of slash-command/message-action responses for `batchId`/`taskId` lookups. Add an outcome covering compact status-response contracts, including what identifiers and summary fields they must return.
2. **[Severity: important]** — The plan narrows “action contracts” to approval/rejection payloads, but Step 1 also scoped a bounded **cancel/stop request** as a supported v1 action (`docs/specifications/operator-console/slack-companion.md:157-165`). Even if the implementation remains conservative, the contract doc should either define that action’s request/confirmation shape or explicitly state that it is intentionally deferred pending the Step 3 safety model. Otherwise the design will not fully match the previously approved v1 action surface.

### Missing Items
- Define compact **status lookup** request/response shapes for active-batch, `batchId`, and `taskId` lookups.
- Either define the **bounded stop/cancel request** contract or explicitly mark it as unresolved/deferred in this step so the final design remains internally consistent.
- Include an **approval-focused deep-link target** alongside task/batch destinations, since Step 0 already identified `approvalId`-based routing as a minimum linkable target (`STATUS.md:100`).

### Suggestions
- Reuse the subject taxonomy implied by Step 1 and the domain model: make each contract explicitly batch-, task-, or approval-scoped so later implementation does not have to infer routing rules.
- For idempotency, distinguish between repeated Slack deliveries, repeated button clicks, and stale actions after the canonical approval has already been resolved; those are different operator-visible cases even if they share the same backend protection.
