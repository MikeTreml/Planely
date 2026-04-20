## Code Review: Step 2: Operator actions contract

### Verdict: REVISE

### Summary
The server now emits a coherent action contract shape for backlog tasks and batch-level integration, and the added tests exercise the new payload fields at a basic level. However, the start-action gating does not match the actual orchestrator contract: it disables launch whenever any batch state exists, including phases where `/orch` explicitly allows starting a fresh batch.

### Issues Found
1. **[dashboard/server.cjs:1980] [important]** — `buildTaskActionContract()` disables `start` for every non-null `batchState` (`Batch ... is ...`), but the real `/orch` handler only blocks concurrent execution while the batch is actively running and explicitly allows new starts from `completed`, `failed`, and `stopped` states (`extensions/taskplane/extension.ts:2005-2010`). As written, the dashboard contract will incorrectly tell the frontend that launch is unavailable after a completed/failed/stopped batch, which violates the step’s “respect batch/task state rules” outcome. Fix by reusing the same busy-phase check for start gating (or otherwise mirroring the `/orch` phase allowlist) instead of treating any existing batch as blocking.

### Pattern Violations
- None beyond the state-rule mismatch above.

### Test Gaps
- Add a contract test covering `buildTaskActionContract()` when `batchState.phase` is `completed`, `failed`, and `stopped` to ensure `start.enabled` stays aligned with `/orch` semantics.
- Add a negative case for an actively running phase (`launching`/`executing`) so the allowed-vs-blocked boundary is explicit.

### Suggestions
- Consider centralizing the phase-gating rules for dashboard actions so the server contract cannot drift from the extension’s command semantics over time.
- For consistency, decide whether command previews should use slash-command form or supervisor-tool form across all actions and document that choice in the contract.
