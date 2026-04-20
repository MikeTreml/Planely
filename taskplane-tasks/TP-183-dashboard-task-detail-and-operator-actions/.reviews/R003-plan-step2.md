## Plan Review: Step 2: Operator actions contract

### Verdict: APPROVE

### Summary
The Step 2 plan is scoped to the right outcomes for this task: define how dashboard affordances map onto real orchestrator capabilities, keep those controls state-aware, and add confirmation/guardrail behavior before the UI becomes clickable. It also aligns with the prompt, the Step 0 findings in `STATUS.md`, and the operator-console specs by preferring existing command/supervisor paths over bespoke dashboard-side mutations.

### Issues Found
1. **[Severity: minor]** — No blocking gaps found for Step 2. The plan covers the required contract-level work needed before implementation.

### Missing Items
- None that block this step.

### Suggestions
- Make the contract explicit about how each priority action is represented: launch selected tasks, retry task, skip task, and integrate batch should each have a defined `enabled/disabled` outcome and a clear fallback when direct invocation is unavailable.
- Reuse a shared affordance shape across task detail and any other action surface, including fields like confirmation requirement, disabled reason, and command preview/backing, so Step 3 does not invent separate gating logic in the frontend.
- Preserve the spec’s “informative when unavailable” behavior: unsupported actions should still explain why they are disabled rather than disappearing, especially for retry/skip/integrate.
- Define selection identity on the server side for launch flows (packet/task path resolution for selected backlog items) so the dashboard never trusts client-supplied command strings directly.
