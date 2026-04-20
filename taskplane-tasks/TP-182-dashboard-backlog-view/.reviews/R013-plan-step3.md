## Plan Review: Step 3: Frontend implementation

### Verdict: REVISE

### Summary
The Step 3 plan is directionally correct, but it is still too thin in two places that matter for correctness: shell/navigation integration and explicit frontend state handling. As written, it could produce a backlog panel that renders rows but still misses the IA-required view switching/default behavior and the clean empty/partial/error handling already exposed by the server payload.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-182-dashboard-backlog-view/STATUS.md:49-52` does not explicitly cover how the backlog view integrates into the dashboard shell as a primary view with predictable entry/default behavior. TP-181 defines lightweight primary navigation plus default landing rules (`docs/specifications/operator-console/ux-ia.md:136-167`), including Backlog as the default when there is no active batch and one-click switching when there is. Without adding that outcome to the plan, the worker could satisfy the current checkboxes with a standalone panel bolted onto the existing page, which would not fully meet the intended frontend behavior or the “avoid clutter/regression” requirement. Add an explicit Step 3 item for view-state/navigation integration in the existing shell.
2. **[Severity: important]** — The plan does not explicitly include rendering backlog empty/partial/error states or wiring scope/filter behavior from the new payload. The server now emits `backlog.loadState`, `backlog.errors`, and workspace/repo scope metadata (`dashboard/server.cjs:1776-1795`), and TP-181 requires guided empty/fallback behavior plus repo filtering that applies consistently to Backlog (`docs/specifications/operator-console/ux-ia.md:187-205`). If Step 3 only focuses on rows/cards plus optional search, the frontend can easily miss a required user-facing outcome even though Step 4 later tests it. Add a plan item for load-state/error rendering and repo-filter/scope integration for the backlog view.

### Missing Items
- Explicit shell/view-state work for Backlog vs Live Batch entry/default behavior.
- Explicit handling for `ready`/`empty`/`partial`/`error` backlog states.
- Explicit reuse of the existing repo/workspace filter semantics for backlog content.

### Suggestions
- Keep the first pass lightweight: tabs/view-state plus backlog rendering is enough; task detail can remain a selection/drill-in scaffold rather than a full detail implementation.
- Reuse the existing viewer/detail patterns where possible so backlog task selection aligns with later Task Detail work instead of inventing a second drill-in mechanism.
