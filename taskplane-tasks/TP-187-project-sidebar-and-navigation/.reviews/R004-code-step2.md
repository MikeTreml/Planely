## Code Review: Step 2: UI implementation

### Verdict: APPROVE

### Summary
The Step 2 implementation achieves the UI outcomes it set out to deliver: the dashboard now has a split workspace layout, a sectioned project sidebar, selection affordances, and responsive fallback to a single-column layout on narrower screens. The main-content reset behavior on project switch is also wired sensibly, and the server/frontend contract is sufficient to support the new navigation surface without disturbing the existing backlog/live/history panels.

### Issues Found
1. **[extensions/tests/dashboard-project-sidebar.test.ts:14-45] [minor]** — The new test coverage is purely string-presence based, so it will not catch malformed DOM structure, broken section rendering, or selection-flow regressions as long as the helper/function names remain in the source. This is not blocking for Step 2 correctness, but a follow-up behavioral test around `/api/projects/select` state shape and rendered section data would make the sidebar change much safer to evolve.

### Pattern Violations
- None noted.

### Test Gaps
- No behavioral test exercises `buildProjectSidebar()` output ordering/sectioning (active/recent/archived) from realistic registry input.
- No server test covers `/api/projects/select` success/failure behavior.
- No frontend interaction test verifies that project switching clears repo/task/history UI state and falls back from Live Batch to Backlog when the next project has no active batch.

### Suggestions
- Consider adding `aria-current` or a similar accessibility affordance to the selected sidebar row in addition to the visual `.selected` styling.
- When Step 3 continues, add an explicit regression test for missing/stale project roots so the warning-state behavior from the UX contract stays grounded in code.
