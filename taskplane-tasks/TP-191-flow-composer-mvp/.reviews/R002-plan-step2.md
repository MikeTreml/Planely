## Plan Review: Step 2: Block model

### Verdict: APPROVE

### Summary
The Step 2 plan is appropriately aligned to the outcomes required by `PROMPT.md`: it covers the primitive and container block taxonomy, per-block metadata, validation/safe defaults, and explicit v1-vs-deferred scoping. In combination with the preflight discoveries already captured in `STATUS.md`, this is sufficient for a bounded MVP block-model spec without drifting into a second runtime or over-designing implementation details.

### Issues Found
1. **[Severity: minor]** — No blocking issues found. The planned outcomes are complete for this step and proportionate to a product/spec task.

### Missing Items
- None.

### Suggestions
- Make the block taxonomy explicitly distinguish between blocks that map cleanly to existing Taskplane lifecycle concepts (`Plan`, `Implement`, `Review`, `Test`, `Approve`, `Integrate`) and blocks that are primarily UX/control wrappers (`Sequence`, `Parallel`, `Loop`, `Wait for Human`, `Notify`) so Step 3 has a cleaner compile story.
- When defining metadata and validation rules, call out which fields are operator-authored versus system-derived at compile/runtime time; that will help avoid the UI becoming a shadow source of truth for execution state.
- For `Loop` and `Parallel`, document MVP-safe constraints directly in the block-model spec—e.g. bounded iteration only, no dynamic fan-out, and no ambiguous completion conditions—so the later compile-model step can inherit those limits instead of inventing them.
- Reuse the Step 0 discovery from `STATUS.md` that open-ended loops and runtime-mutating behavior are deferred; that makes the v1/deferred boundary more concrete in this document.
