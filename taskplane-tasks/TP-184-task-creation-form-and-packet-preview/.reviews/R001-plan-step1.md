## Plan Review: Step 1: Creation data model and preview contract

### Verdict: REVISE

### Summary
The step is close, and the server-authored preview approach in STATUS.md is the right direction for keeping the UI aligned with canonical packet generation. However, the Step 1 plan does not yet cover how the form/preview contract will produce the required complexity assessment fields that current task packets and the `create-taskplane-task` skill treat as mandatory.

### Issues Found
1. **[Severity: important]** — The planned form shape only includes `area, title, mission, size, review level, dependencies, context refs, file scope` (`PROMPT.md:75`), while canonical packets also require `Assessment` and the scored `Score` breakdown fields (`skills/create-taskplane-task/references/prompt-template.md:16-19`). The skill explicitly requires scoring complexity before packet creation (`.../prompt-template.md:5-6`), but the preflight notes currently assume the server can simply derive “score labels” without defining the source inputs or derivation rules (`STATUS.md:91`). Add an explicit outcome for the review/scoring contract: either collect blast-radius / pattern-novelty / security / reversibility inputs in the form, or define a deterministic server-side rubric/input set that can generate `Assessment`, `Score`, and `Review Level` without guessing.

### Missing Items
- Define how Step 1 will represent or derive the full complexity assessment contract (`Assessment`, per-dimension score breakdown, and resulting review level) so generated `PROMPT.md` files remain canonical.

### Suggestions
- In the preview payload, include both rendered markdown and structured derived metadata (taskId, slug, score breakdown, review label, validation errors) so the same contract can support UI rendering and Step 2 writes.
- Make validation distinguish between operator-fixable field errors and server-side generation errors; that will help keep the UI feedback clear once the write path is added.
