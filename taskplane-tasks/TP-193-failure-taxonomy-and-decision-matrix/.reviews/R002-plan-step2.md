## Plan Review: Step 2: Decision matrix

### Verdict: REVISE

### Summary
The Step 2 plan covers the core idea of mapping failure classes to actions and distinguishing retry/redirect/replan paths, but it does not yet cover all of the prompt's required outcomes for this step. In particular, the current STATUS items omit batch-level decision guidance and one of the named action branches, so the worker could complete the listed plan and still miss required content from PROMPT.md.

### Issues Found
1. **[Severity: important]** — The current Step 2 plan does not explicitly include the prompt requirement to define **conditions for pausing, aborting, or restarting the batch**. `PROMPT.md` makes this a required Step 2 outcome, and without it the decision matrix would not fully support supervisor/operator recovery decisions. Suggested fix: add an outcome-level item covering when the correct response escalates from task-level handling to batch-level pause/abort/restart.
2. **[Severity: important]** — The plan says “Define retry vs redirect vs replan conditions,” but Step 2 in `PROMPT.md` also requires conditions for **retry-after-fix, skip, and split-task**. Those are materially different recovery actions; if they are not called out, the matrix may collapse distinct operator choices or defer them incorrectly into later steps. Suggested fix: expand the Step 2 plan so the decision matrix explicitly distinguishes retry, retry-after-fix, skip, replan, and split-task conditions.

### Missing Items
- Explicit batch-level guidance for pause vs abort vs restart decisions.
- Explicit coverage of skip, retry-after-fix, and split-task as distinct decision branches.

### Suggestions
- Carry forward the evidence-oriented framing from Step 1 so each matrix branch is keyed to observable signals, not just abstract categories.
- Keep doc-drift/planning-mismatch handling visibly separate from implementation failures, since those are the most likely cases where archive/review or replanning is the right answer instead of more execution.
- If concise, add a note about escalation thresholds: when repeated task-level failures should stop being treated as isolated incidents and instead trigger batch-level intervention.
