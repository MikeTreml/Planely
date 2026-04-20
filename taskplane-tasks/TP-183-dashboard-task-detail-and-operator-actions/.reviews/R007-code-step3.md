## Code Review: Step 3: Frontend/server implementation

### Verdict: APPROVE

### Summary
The Step 3 implementation delivers the intended first operator-control surface without bypassing the existing orchestrator paths: the task detail view now renders state-aware actions, copy fallbacks remain server-driven, and direct execution is mediated through a tightly scoped `/api/actions` endpoint that shells into the existing `/orch` and `/orch-integrate` flows. I did not find a blocking correctness issue in the changed frontend/server code, and basic syntax checks for `dashboard/server.cjs` and `dashboard/public/app.js` pass.

### Issues Found
1. **None.** No blocking correctness issues found for Step 3.

### Pattern Violations
- None that block this step.

### Test Gaps
- **[dashboard/server.cjs:2395-2469]** Minor — There is still no focused server test for `/api/actions` request validation and action execution outcomes (unknown action, disabled action, confirmation-required, runtime failure, successful start/integrate). That leaves the new endpoint largely unpinned until Step 4 verification lands.
- **[dashboard/public/app.js:554-616,1613-1724]** Minor — The new task-detail action interactions do not appear to have browser-level regression coverage yet, especially for copy-mode actions, pending state rendering, and success/error notices after `/api/state` refresh.

### Suggestions
- Consider adding a small helper/allowlist for runnable action IDs in `handleDashboardAction()` so future expansion beyond `start`/`integrate` stays explicit instead of relying on the `promptText` ternary.
- If Step 4 includes smoke testing, explicitly exercise the “copy fallback while disabled for direct execution” UX for retry/skip so the shipped behavior is documented as intentional rather than looking like an accidentally enabled button.
- The action runtime currently surfaces raw stdout/stderr back into the detail panel; if noisy output becomes an issue, consider trimming or summarizing it in a follow-up.
