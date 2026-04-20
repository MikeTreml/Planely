## Plan Review: Step 1: Sidebar UX contract

### Verdict: REVISE

### Summary
The step plan captures the required sidebar groupings and keeps the data model lightweight and grounded in the TP-188 registry fields, which is the right direction for this dashboard change. However, the current plan does not define how a project switch should interact with existing dashboard-scoped state such as the active primary view, repo filter, selected task, and viewer/history selections, so the UX contract is still underspecified in a way that can cause stale or misleading content after switching projects.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-187-project-sidebar-and-navigation/STATUS.md:24-26` covers sections, row content, and empty states, but it does not specify the state-reset/preservation rules when the user switches projects. The existing dashboard keeps project-scoped UI state in memory (`dashboard/public/app.js:443-466`, `dashboard/public/app.js:472-511`) for primary view selection, repo filter, backlog selection, and detail/viewer state. Without an explicit contract here, Step 2/3 can easily leave the UI showing stale task detail, an invalid repo filter, or a preserved “Live Batch” selection for a project with no active batch. Add an outcome-level item defining what resets vs persists on project change (e.g. clear repo/task/viewer/history selection, preserve current top-level view only when still valid, otherwise fall back deterministically to Backlog/History).

### Missing Items
- Define project-switch state behavior: which UI state is cleared, which may persist, and what deterministic fallback applies when the selected project has no live batch or no history.

### Suggestions
- Anchor the row contract to the registry-derived fields already called out in the notes (`id`, `name`, `rootPath`/`configPath`, `archived`, `lastOpenedAt`, `lastBatchAt`) and explicitly treat badges such as running-batch or missing-path as derived, optional decorations.
- Record a default ordering rule for Step 1 so implementation does not improvise later: current/open project first, then active recents, then other active projects, with archived in a collapsed/de-emphasized section, consistent with `docs/specifications/operator-console/project-registry.md`.
- If Recent may be deferred pending TP-188 payload support, state that deferment explicitly and define the fallback sidebar shape for the first shipped iteration.
