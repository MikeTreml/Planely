## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
The Step 2 server work is close: backlog loading is now wired into `buildDashboardState()`, malformed packets are surfaced non-fatally, and R005’s YAML fallback gap was addressed. However, the new config loader now violates the project’s config-precedence contract by falling back to legacy YAML even when `taskplane-config.json` is present, which can make the dashboard read stale or unintended task areas.

### Issues Found
1. **[dashboard/server.cjs:1402-1421] [important]** `loadTaskplaneTaskAreas()` falls through to `task-runner.yaml` / `task-orchestrator.yaml` whenever `taskplane-config.json` exists but does not return a non-empty `taskRunner.taskAreas` object. Per the repo contract, legacy YAML is a fallback **only when JSON is absent**; if JSON is present, it should win even if the task-area section is empty/missing. As written, a migrated repo that still has stale YAML checked in can show the wrong backlog entirely. Fix by treating the presence of `taskplane-config.json` as authoritative: return its parsed `taskRunner.taskAreas ?? {}` (or surface a config error), and only consult legacy YAML when the JSON file is not present at all.

### Pattern Violations
- Config loading does not follow the documented precedence chain: `.pi/taskplane-config.json` should take precedence over legacy YAML rather than deferring to it when the JSON file is present.

### Test Gaps
- `extensions/tests/dashboard-backlog-load.test.ts` covers the YAML fallback path, but it does not cover the precedence case where both JSON and legacy YAML exist. Add a regression test proving that a present JSON config suppresses legacy YAML task-area discovery, even when the YAML file also defines areas.

### Suggestions
- Since R005 already pushed this code toward config-compatibility, consider reusing the existing config-loader behavior instead of maintaining a bespoke precedence parser in the dashboard.
