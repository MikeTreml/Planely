## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
The backlog loader, additive `/api/state` wiring, and the follow-up fixes for YAML fallback, JSON precedence, and pointer-aware config roots are all good progress, and they address the earlier R005–R007 findings. However, the new pointer lookup still depends on the legacy workspace YAML file, so the dashboard can miss backlog config in JSON-first workspace setups even though the rest of Taskplane treats `taskplane-config.json` as authoritative.

### Issues Found
1. **[dashboard/server.cjs:1381-1407] [important]** `resolveDashboardPointerConfigRoot()` only attempts pointer resolution when `REPO_ROOT/.pi/taskplane-workspace.yaml` (or `REPO_ROOT/taskplane-workspace.yaml`) exists, and it derives the repo map solely by parsing that YAML. That means a workspace using JSON-first config semantics can still fail backlog discovery: if the workspace metadata is sourced through the canonical `taskplane-config.json` path rather than legacy workspace YAML, the dashboard returns `null` here and falls back to `REPO_ROOT`, producing an empty backlog or task-area-not-found errors. Reuse the shared workspace/config resolution chain instead of a dashboard-specific YAML parser, or add support for the JSON workspace metadata path so pointer resolution works in canonical JSON-first workspaces too.

### Pattern Violations
- The dashboard now partially reimplements config/workspace resolution in `server.cjs` instead of following the same shared loader behavior as the rest of Taskplane.
- Pointer resolution currently treats legacy workspace YAML as required for backlog config lookup, which conflicts with the repo’s JSON-first config contract.

### Test Gaps
- Missing regression coverage for a workspace where pointer resolution succeeds without relying on `taskplane-workspace.yaml`, using the canonical JSON-backed workspace/config chain.

### Suggestions
- If feasible, call into the existing config-loader/workspace helpers rather than maintaining bespoke parsers in the dashboard; that should prevent future drift in precedence, pointer, and workspace-mode behavior.
