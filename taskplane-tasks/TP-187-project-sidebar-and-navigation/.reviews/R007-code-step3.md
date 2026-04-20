## Code Review: Step 3: Integration behavior

### Verdict: APPROVE

### Summary
This change cleanly wires successful project selection into the server-side dashboard state model by switching the active root before rebuilding state, and it updates registry recency only when the selected project is a real registry entry with an existing path. That addresses the Step 3 integration outcome I previously called out in plan review R005/R006: recent-project ordering now stays grounded in canonical registry data rather than a UI-only assumption.

### Issues Found
1. **[extensions/tests/dashboard-project-sidebar.test.ts:38] [minor]** — The added coverage is still source-shape validation rather than behavioral coverage of `/api/projects/select` and registry recency updates. This does not block Step 3 correctness, but it leaves the switch/refresh contract under-protected against future regressions.

### Pattern Violations
- None blocking.

### Test Gaps
- No automated test currently exercises selecting a project and asserting that the returned dashboard state is re-scoped to the new root.
- No automated test verifies that a successful selection updates `lastOpenedAt`/`updatedAt` in the registry while a missing-path selection does not.

### Suggestions
- Add a focused server-level test around `handleProjectSelection`/`buildDashboardState` so future refactors cannot silently break cross-project state scoping.
- If this registry file may be written by multiple dashboard processes in practice, consider a follow-up hardening pass for concurrent writes to `projects.json`.
