## Plan Review: Step 3: Frontend/server implementation

### Verdict: APPROVE

### Summary
The Step 3 plan is appropriately scoped to ship the first usable dashboard action surface on top of the Step 2 contract: it covers UI affordances, minimal server glue, and clear handling for success/failure/disabled/unsupported states. Combined with the Step 0 notes in `STATUS.md` and the already-approved Step 2 contract, this is enough to achieve the task’s frontend/server implementation outcome without over-prescribing the exact UI wiring.

### Issues Found
1. **[Severity: minor]** — No blocking gaps found for Step 3. The plan is consistent with the prompt’s safety constraints and the earlier contract work.

### Missing Items
- None that block this step.

### Suggestions
- Make sure the Step 3 implementation explicitly renders both direct-trigger actions and copy-fallback actions from the existing `invokeMode`/`commandPreview` contract so retry/skip can remain informative even if they are not directly executable yet.
- Keep command execution server-mediated and allowlisted as noted in `STATUS.md`, especially for launch/integrate flows, so the frontend never constructs trusted command strings on its own.
- If “launch selected set” is not feasible in this pass and Step 3 ships only per-task start plus batch integrate, call that limitation out clearly in Step 4 docs/discoveries so the delivered surface matches the task’s v1-safest-increment language.
- Reuse the server-provided disable reasons and confirmation copy directly in the UI rather than re-deriving phase rules in the browser; that will preserve the Step 2 fix for `/orch` phase alignment.
