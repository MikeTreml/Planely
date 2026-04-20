## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
The new backlog loader and additive `/api/state`/SSE payload wiring are directionally correct, and the malformed-packet handling is a good fit for the step goals. However, the server currently only reads `.pi/taskplane-config.json` to discover task areas, which breaks backlog loading for still-supported projects that rely on the legacy YAML fallback config chain.

### Issues Found
1. **[dashboard/server.cjs:1331-1340] [important]** `loadTaskplaneTaskAreas()` returns `{}` unless `.pi/taskplane-config.json` exists. Per the project config contract, `taskplane-config.json` is canonical but `.pi/task-runner.yaml` / `.pi/task-orchestrator.yaml` remain supported fallbacks. On repos that have not migrated yet, the dashboard backlog will incorrectly report `empty`/no packets even though valid task areas exist. Add fallback loading for the legacy config files (or reuse the existing config-loader path) so backlog discovery remains backward-compatible.

### Pattern Violations
- Backlog task-area discovery bypasses the project's documented config loading chain by treating missing `taskplane-config.json` as "no task areas" instead of falling back to legacy config sources.

### Test Gaps
- `extensions/tests/dashboard-backlog-load.test.ts` only covers the JSON config path. Add a regression test proving backlog loading still works when task areas are defined via the legacy YAML fallback configuration and no `taskplane-config.json` is present.

### Suggestions
- Once the fallback behavior is fixed, consider adding a tiny test for the "no configured task areas" case so `loadState.kind` semantics stay intentional and don't regress during Step 3.
