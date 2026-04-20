# TP-189: Dashboard Query and Refresh Controls — Status

**Current Step:** Step 2: Server/client implementation
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 2
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Review current refresh/poll/SSE model
- [x] Identify auto vs manual refresh needs
- [x] Define safe manual controls
- [x] Separate true actions from local view/filter controls

---

### Step 1: Query/refresh contract
**Status:** ✅ Complete
- [x] Resolve whether refresh and re-scan are distinct or a single action
- [x] Define Pending vs All query semantics and how they compose with repo/search/status filters
- [x] Define operator feedback and empty/loading/error states
- [x] Confirm final controls map to real Taskplane behavior

---

### Step 2: Server/client implementation
**Status:** 🟨 In Progress
- [ ] Add minimal server support for explicit manual refresh if needed
- [ ] Add frontend control bar and manual refresh wiring
- [ ] Add Pending vs All query filtering without breaking existing filters
- [ ] Keep existing live behavior intact

---

### Step 3: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Test task-file change refresh behavior
- [ ] Test pending/all filtering
- [ ] Test graceful error handling
- [ ] Update docs if shipped
- [ ] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Dashboard state is already pushed via `/api/stream` SSE with a 2s server-side `broadcastState()` poll, an initial one-shot `/api/state` fetch on boot, and targeted 2s polling only for viewer/history panels. | Use this as the baseline so new controls supplement rather than replace live updates. | `dashboard/server.cjs`, `dashboard/public/app.js` |
| Backlog/task discovery is already rebuilt on each `buildDashboardState()` / `/api/state` request by rescanning configured task areas, while current manual controls are limited to local repo/search/status filters and existing task action buttons. | Add operator controls for explicit refresh/re-scan without implying a separate long-running discovery service. | `dashboard/server.cjs`, `dashboard/public/app.js`, `dashboard/public/index.html` |
| `orch-plan` already supports `--refresh`, but it is a true orchestrator command with side effects limited to plan generation and should stay explicitly gated if surfaced from the dashboard. | Prefer a safe first-control set of `Refresh now`, `Re-scan backlog`, and a local `Pending/All` query toggle; treat plan refresh as optional and clearly labeled. | `extensions/taskplane/extension.ts`, `dashboard/server.cjs` |
| Existing backlog repo/search/status controls are purely client-side view filters, while dashboard task actions (`start`, `integrate`, copy-only retry/skip) are true operator actions that call or represent orchestrator commands. | Keep new query toggles local-only in the UI and separate them visually from action buttons that execute server work. | `dashboard/public/app.js`, `dashboard/server.cjs` |
| Step 1 contract decision: v1 should collapse `Refresh now` and `Re-scan backlog` into one manual refresh action because `/api/state` already rebuilds backlog discovery during every state fetch. | Ship one explicit refresh action that requests a fresh snapshot and backlog re-scan in the same server round-trip; defer a separate plan-refresh control. | `dashboard/server.cjs`, `dashboard/public/app.js` |
| Step 1 query contract: `Pending` means backlog items whose display status is not terminal (`succeeded` or `skipped`), and the new query toggle composes by intersecting with existing repo/search/status filters. | Implement `Pending/All` as a coarse local subset above existing filters; incompatible combinations should yield a clear empty-state message instead of silently changing the existing status filter. | `dashboard/public/app.js`, `dashboard/public/index.html` |
| Step 1 feedback contract: manual refresh should expose idle/loading/success/error messages in the control bar, while backlog empty states should distinguish “no tasks exist”, “no tasks match current filters”, and “backlog scan failed”. | Reuse the current backlog `loadState` plus a small client-only request state so operators can tell whether a fresh snapshot is in flight or whether filters simply produced zero results. | `dashboard/public/app.js`, `dashboard/public/index.html` |
| Final v1 contract maps directly to existing Taskplane behavior: one manual `/api/state` refresh action, one local `Pending/All` backlog query toggle, and no separate plan-refresh control unless it is later surfaced with explicit `orch-plan --refresh` semantics. | Implementation can stay minimal, preserve SSE, and avoid suggesting unsupported background discovery or plan orchestration in the dashboard. | `dashboard/server.cjs`, `dashboard/public/app.js`, `extensions/taskplane/extension.ts` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 21:03 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 21:03 | Step 0 started | Preflight |
| 2026-04-20 21:10 | Reviewed live refresh model | Confirmed `/api/stream` SSE + 2s server poll + boot-time `/api/state` fetch + viewer-specific polling |
| 2026-04-20 21:14 | Mapped automatic vs manual refresh | Confirmed backlog discovery already re-scans task areas per state build; only local filters/search and task actions are operator-driven today |
| 2026-04-20 21:18 | Scoped safe controls | Selected `Refresh now`, `Re-scan backlog`, and local `Pending/All` query as the safe baseline; `orch-plan --refresh` remains optional/gated |
| 2026-04-20 21:19 | Separated control types | Classified query toggles as local view state and refresh/re-scan as real server actions so UI can present them distinctly |
| 2026-04-20 21:27 | Revised control contract | Collapsed refresh + re-scan into one explicit manual snapshot refresh because `/api/state` already re-runs backlog discovery |
| 2026-04-20 21:29 | Defined Pending/All semantics | `Pending` = backlog items not in terminal `succeeded`/`skipped` states; query toggle intersects with repo/search/status filters |
| 2026-04-20 21:31 | Defined feedback states | Manual refresh will show loading/success/error messages; backlog empty states will differentiate empty repo, empty filter result, and scan failure |
| 2026-04-20 21:33 | Validated v1 scope against real behavior | Finalized a one-action refresh + local Pending/All contract and deferred plan refresh to avoid unsupported dashboard semantics |

---

## Blockers

*None*

---

## Notes

Adds UI-side query/refresh affordances for normal operator use.
- Current dashboard data model is already live-first: `handleSSE()` sends an immediate snapshot, `broadcastState()` pushes rebuilt state every 2s, and the client reconnects automatically on SSE errors.
- Automatic refresh already covers the main data plane (`batch-state.json`, backlog task folders, status parsing). Missing operator affordances are explicit refresh/re-scan cues and clearer query controls over the already-loaded backlog.
- Safe first-pass controls should map to existing semantics: refresh the current snapshot, force a backlog re-read/discovery pass, and apply a local `Pending` vs `All` task query without inventing background jobs.
- New controls should be split into two groups: view-only filters/toggles that never hit the server, and action buttons that explicitly request server work or orchestrator commands.
- Reviewer note: if v1 defers plan refresh, say so explicitly; operator feedback should describe manual refresh as requesting a fresh snapshot, not starting a persistent background refresh mode.
- Step 1 contract decision: a single `Refresh now` control will call a fresh `/api/state` load and therefore covers both state refresh and backlog re-scan; no second discovery button is needed in v1.
- `Pending` is a coarse local backlog query for non-terminal tasks (`ready`, `blocked`, `running`, `waiting`, `failed`, `stalled`); repo/search/status filters still apply afterward, even if that yields an intentionally empty intersection.
- Operator feedback should be explicit: `Refreshing…` while `/api/state` is in flight, a brief success indicator when a fresh snapshot lands, and an inline error when the manual request fails while SSE/live updates remain connected or reconnecting independently.
- Backlog rendering should keep three distinct zero-data cases: source empty (`No task packets found`), filter empty (`No tasks match current query/filter`), and load failure (`Backlog scan failed`).
| 2026-04-20 21:07 | Review R001 | plan Step 1: REVISE |
| 2026-04-20 21:09 | Review R002 | plan Step 1: APPROVE |
