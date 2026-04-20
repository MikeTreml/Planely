## Plan Review: Step 1: Planning artifact schema

### Verdict: REVISE

### Summary
The step plan covers the basic deliverables from the prompt — artifact types/fields, linking, and audit/history — but it is still too high-level on the most failure-prone part of this task: preserving source-of-truth boundaries between planning files and runtime artifacts. Without making that boundary explicit in the plan, the resulting schema could accidentally duplicate task, batch, or run authority and force rework in later storage and console tasks.

### Issues Found
1. **[Severity: important]** — The plan does not explicitly call out the canonical-vs-derived boundary for schema fields. `PROMPT.md` and `docs/specifications/operator-console/domain-model.md:18-22, 252-268` make this a core invariant: planning artifacts may add intent, but must not duplicate runtime authority already held by task packets, batches, runs, approvals, or produced artifacts. Add an outcome that each artifact definition identifies which fields are canonical planning data versus references/projections to execution objects.
2. **[Severity: important]** — The linking-model item is too generic to ensure a durable relationship contract. `STATUS.md` notes that links should favor stable IDs/paths over embedded copies, but Step 1’s plan does not say that the schema will standardize how ideas/specs/initiatives/milestones reference task packets and batches. Add an explicit outcome covering reference shape/cardinality (for example: IDs/paths, one-to-many relationships, and whether batch links are direct evidence links or derived/reporting links).

### Missing Items
- Explicit source-of-truth rules for schema fields so planning artifacts cannot redefine execution status/history.
- Explicit reference strategy for linking to task packets and batches using stable identifiers/paths rather than copied runtime data.

### Suggestions
- Reuse the status vocabularies and relationship expectations already sketched in `docs/specifications/operator-console/domain-model.md` so Step 1 stays aligned with TP-180.
- Include a short “non-goals / not stored here” section in the schema spec to make duplicate-authority boundaries obvious to later implementation tasks.
