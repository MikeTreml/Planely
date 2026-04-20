## Plan Review: Step 3: Interaction flows

### Verdict: REVISE

### Summary
The Step 3 plan is aligned with the overall Operator Console direction from `PROMPT.md` and the Step 1-2 specs: it covers the core operator flows for launch, inspection, action handling, and safety guardrails. However, the current plan in `STATUS.md` drops one of the explicitly required Step 3 outcomes from the prompt, so it risks producing an interaction-flow spec that is incomplete for the intended operator journey.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-181-operator-console-ux-and-information-architecture/STATUS.md:40-43` plans start-batch, inspect-task, retry/skip/integrate, and guardrails, but it does **not** explicitly include the required flow from `PROMPT.md:82-87` / `PROMPT.md:86` for navigating from a notification or history entry to the underlying task or batch. That path is also a stated product requirement in `docs/specifications/operator-console/product-brief.md:71-77` and `:145-146`. Add an explicit Step 3 plan item for deep-link/navigation flows from notifications/messages and history rows into History detail, Task Detail, and Live Batch context.

### Missing Items
- Explicit coverage for the notification/history deep-link flow required by `PROMPT.md`, including how the operator lands in the correct scoped destination and preserves parent context when drilling further into task or batch evidence.

### Suggestions
- When defining the retry/skip/integrate flow, tie each operator action back to the Step 2 affordance model (`commandBacking`, `enabled`, `disabledReason`, `evidenceHint`) so the flow spec stays honest about which actions already have real Taskplane backing.
- For start-batch and inspect-task flows, call out empty/partial-data branches from `view-models.md` so the interaction spec handles file-backed incompleteness rather than assuming perfect data availability.
- In the guardrails section, distinguish between destructive actions, high-blast-radius actions, and merely confusing navigation transitions so follow-on implementation can apply the right confirmation, evidence, or warning pattern to each.
