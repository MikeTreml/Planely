## Plan Review: Step 2: Server/client implementation

### Verdict: APPROVE

### Summary
The Step 2 plan is appropriately scoped to the contract established in Step 1: one explicit manual refresh action backed by the existing `/api/state` rebuild path, one local Pending/All backlog query toggle, and preservation of the dashboard's SSE-first behavior. It covers the required implementation outcomes without over-specifying code-level mechanics, and it aligns with the current server/client architecture.

### Issues Found
1. **[Severity: minor]** — `taskplane-tasks/TP-189-dashboard-query-and-refresh-controls/STATUS.md:33-36` still phrases server support as "if needed," even though the Step 1 contract already settled on reusing `/api/state` rather than introducing a separate discovery endpoint (`STATUS.md:65-68`, `dashboard/server.cjs:3413-3419`). This is not blocking, but the implementation should keep that scope narrow so the UI does not imply a second refresh mechanism.

### Missing Items
- None. The plan covers the needed Step 2 outcomes: minimal server work, client controls, coherent backlog refresh behavior, and preservation of live updates.

### Suggestions
- In the control bar copy, frame the action as requesting a fresh snapshot now, not enabling a separate background refresh mode; that matches the existing `/api/state` + SSE model (`dashboard/server.cjs:3413-3419`, `dashboard/public/app.js:2661-2685`).
- Implement Pending/All as an additional client-side subset layered on top of the current repo/search/status filters rather than mutating those existing controls, which keeps the behavior consistent with the current filtering path (`dashboard/public/app.js:881-897`, `dashboard/public/app.js:2161-2240`, `dashboard/public/index.html:76-88`).
- Make the manual refresh feedback deterministic (loading/success/error, with success likely transient) so the control bar does not leave stale action feedback behind after SSE updates resume.
