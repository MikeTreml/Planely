## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
The new backlog loader, additive `/api/state` payload wiring, and config-precedence fixes are solid progress, and they address the earlier YAML-compatibility findings from R005/R006. However, this implementation still breaks the backlog in workspace/polryepo setups that rely on the workspace pointer, because the dashboard now reads config but only searches under `REPO_ROOT` instead of following the same pointer-based config resolution chain as the rest of Taskplane.

### Issues Found
1. **[dashboard/server.cjs:1331-1425,1558-1570,2125-2132] [important]** `loadTaskplaneTaskAreas()` resolves config exclusively from `REPO_ROOT/.pi` or `REPO_ROOT/`, and `main()` explicitly documents that no pointer resolution is performed. That assumption was fine when the dashboard only consumed runtime sidecars, but Step 2 now depends on project config to discover backlog task areas. In workspace mode, canonical config can live in a pointed config repo (`.pi/taskplane-pointer.json` → `<config-repo>/.taskplane/...`), so the current code will incorrectly return an empty backlog or `task area not found` even though valid task areas exist. Fix by reusing the existing config-root/pointer resolution behavior (or equivalent helper logic) before loading `taskplane-config.json` / legacy YAML, and add a regression test covering pointer-resolved workspace config.

### Pattern Violations
- The dashboard’s new config lookup bypasses the project’s established config-resolution chain instead of following the same pointer-aware rules used by task-runner/orchestrator.
- The comment in `main()` saying the dashboard does not perform pointer resolution is now outdated for backlog discovery.

### Test Gaps
- Missing regression coverage for workspace mode where `.pi/taskplane-pointer.json` redirects config loading to a config repo / `.taskplane` directory.

### Suggestions
- If feasible, centralize this lookup on a shared config-loader entry point rather than maintaining a bespoke JSON/YAML parser in `dashboard/server.cjs`.
