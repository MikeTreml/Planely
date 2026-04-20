# TP-189: Dashboard Query and Refresh Controls — Status

**Current Step:** Step 1: Query/refresh contract
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 0
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
**Status:** 🟨 In Progress
- [ ] Define control set and behaviors
- [ ] Define operator feedback and states
- [ ] Define empty/loading/error states
- [ ] Confirm controls map to real Taskplane behavior

---

### Step 2: Server/client implementation
**Status:** ⬜ Not Started
- [ ] Add minimal server support if needed
- [ ] Add frontend control bar and wiring
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
