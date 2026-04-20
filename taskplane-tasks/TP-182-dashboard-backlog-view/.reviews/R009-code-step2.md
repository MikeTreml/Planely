## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
The backlog loader, additive `/api/state` wiring, and the follow-up fixes for YAML fallback, JSON precedence, and pointer-aware config resolution are solid progress, and they address the earlier R005–R008 findings. However, the server still derives backlog workspace scope from active batch state only, so an idle workspace dashboard misreports itself as repo mode and loses the repo-filtering context this step was supposed to preserve.

### Issues Found
1. **[dashboard/server.cjs:1766-1769] [important]** `loadBacklogData()` sets `scope.mode` to `state?.mode || "repo"`. When the dashboard is opened on a workspace root with no active batch (`buildDashboardState()` passes `state = null`), the backlog payload is therefore emitted as repo mode even though task areas and repo IDs were discovered from workspace config. That breaks the “workspace mode/repo filtering remains coherent” requirement for the backlog-only/idle-dashboard case: the frontend cannot reliably know it should offer workspace-aware filtering or badges until a batch exists. Derive backlog scope from workspace/config context as well as batch state — for example, detect workspace mode from workspace config / pointer resolution / multiple configured repos and only fall back to `state.mode` when batch state is present.

### Pattern Violations
- Workspace-vs-repo mode is inferred from live batch state only, even though backlog discovery now has its own config-backed workspace context.

### Test Gaps
- Missing regression coverage for a workspace root with no active batch state where backlog discovery succeeds and `backlog.scope.mode` still reports `workspace`.

### Suggestions
- Since this code already has custom config/pointer detection, consider centralizing a small `resolveDashboardWorkspaceContext()` helper so mode, repo list, and config-root decisions stay aligned instead of being inferred from different sources.
