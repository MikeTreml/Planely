## Plan Review: Step 1: Query/refresh contract

### Verdict: REVISE

### Summary
The Step 1 notes show good grounding in the existing dashboard refresh model and correctly separate local view filters from true server actions. However, the proposed contract still leaves one core behavior mismatch unresolved and one key query behavior undefined, so the implementation could easily ship controls that either duplicate the same action or behave inconsistently with the existing backlog filters.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-189-dashboard-query-and-refresh-controls/STATUS.md:61-62,76,92` proposes both **`Refresh now`** and **`Re-scan backlog`** as real server actions, but the discovered architecture already rebuilds backlog discovery on every `buildDashboardState()` / `/api/state` call (`dashboard/server.cjs:1136-1154`, `2617-2699`, `3413-3419`). As written, the plan does not define any real contract difference between those two controls, so the UI risks implying two distinct behaviors that the server does not actually support. Step 1 should explicitly resolve this by either collapsing them into a single action, or defining a concrete distinction that maps to real code paths.
2. **[Severity: important]** — The `Pending/All` query toggle is named, but its semantics are still underspecified in the plan (`taskplane-tasks/TP-189-dashboard-query-and-refresh-controls/STATUS.md:62,92-93`). Step 1 needs to define what counts as “pending” in backlog terms and how that toggle composes with the existing repo/search/status filters already wired in the client (`dashboard/public/app.js:881-896,2142-2185`, `dashboard/public/index.html:76-88`). Without that contract, Step 2 can easily produce a filter that conflicts with the current status dropdown or yields ambiguous counts/tests.

### Missing Items
- A concrete contract for whether `Refresh now` and `Re-scan backlog` are distinct actions or the same action presented once.
- A precise definition of the `Pending` filter predicate and its interaction with the existing search/status/repo filters.

### Suggestions
- If plan refresh is deferred, say so explicitly in Step 1 so the shipped control bar has a crisp v1 scope.
- Consider documenting operator feedback text for manual refresh in terms of “requesting a fresh snapshot” rather than implying a persistent background refresh job.
