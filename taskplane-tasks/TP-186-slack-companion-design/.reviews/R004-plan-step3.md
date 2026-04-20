## Plan Review: Step 3: Safety model

### Verdict: REVISE

### Summary
The Step 3 plan is directionally aligned with the task, but it does not yet cover all required safety outcomes from `PROMPT.md`. In particular, the current checklist drops explicit treatment of rate limiting, authorization/identity constraints, and the rationale for why Slack can never own canonical run state, all of which are important to make `slack-safety-model.md` implementable and consistent with the earlier docs.

### Issues Found
1. **[Severity: important]** — The current Step 3 checklist omits the prompt’s explicit requirement to define which actions require **rate limiting** (`PROMPT.md:83-87`; `STATUS.md:38-42`). Confirmation and deferral are planned, but rate limiting is a separate control for preventing repeated stop/approval spam or accidental rapid retries of interactive actions. Add an outcome covering which Slack actions are rate-limited, at what scope (user/target/channel), and what fallback response is shown when limits are hit.
2. **[Severity: important]** — The safety-model plan does not call out **authorization / Slack identity mapping constraints**, even though the task explicitly says not to assume auth/identity is solved (`PROMPT.md:117-122`), and the Step 2 contracts already depend on actor identity and an `unauthorized` outcome (`docs/specifications/operator-console/slack-companion.md:51-58`; `docs/specifications/operator-console/slack-message-contracts.md:413-417`, `431-436`). Without a planned section on how Slack user identity is trusted, matched to operator permissions, or rejected/deferred when unresolved, the safety model will miss a core gate on approve/reject/stop actions.

### Missing Items
- Explicitly cover **why Slack must never own canonical run state** in the Step 3 plan, not just in earlier docs. That is a required Step 3 deliverable in `PROMPT.md:83-87`, and the current `STATUS.md:38-42` checklist no longer names it.

### Suggestions
- Reuse the action boundaries already established in `slack-companion.md` so the safety doc can classify each v1 action as read-only, one-click allowed, confirmation-required, rate-limited, dashboard-only, or deferred.
- Tie failure/fallback behavior to the response states already named in `slack-message-contracts.md` (`already_resolved`, `expired`, `unauthorized`, `requires_dashboard_confirmation`, `not_supported`, `failed`) so the safety model and contract doc stay consistent.
- Include a short principle that stale Slack payloads must always re-read canonical Taskplane state before mutation; that will reinforce both the no-shadow-state rule and the audit expectations.
