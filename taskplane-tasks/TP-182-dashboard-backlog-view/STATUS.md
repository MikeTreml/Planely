# TP-182: Dashboard Backlog View — Status

**Current Step:** Step 2: Server implementation
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 2
**Iteration:** 1
**Size:** L

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read TP-180 and TP-181 outputs
- [x] Trace current dashboard data flow
- [x] Decide backlog data source and payload strategy

---

### Step 1: Backlog data contract
**Status:** ✅ Complete
- [x] Define backlog row shape
- [x] Map canonical states to backlog statuses
- [x] Include task-detail navigation metadata
- [x] Add server-side shaping tests
- [x] Treat activeTask.status = succeeded as backlog completion
- [x] Keep non-batch in-progress packets from claiming active-batch waiting

---

### Step 2: Server implementation
**Status:** 🟨 In Progress
- [ ] Add backlog loading/shaping
- [ ] Expose backlog payload to frontend
- [ ] Handle workspace and malformed-task cases

---

### Step 3: Frontend implementation
**Status:** ⬜ Not Started
- [ ] Add backlog panel/view
- [ ] Render rows/cards and selection behavior
- [ ] Preserve existing dashboard usability

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Test empty/mixed/workspace states
- [ ] Perform manual smoke verification
- [ ] Update docs if shipped
- [ ] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| R001 | plan | 1 | APPROVE | `.reviews/R001-plan-step1.md` |
| R002 | code | 1 | REVISE | `.reviews/R002-code-step1.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 16:38 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 16:38 | Step 0 started | Preflight |
| 2026-04-20 16:51 | Step 1 started | Backlog data contract |
| 2026-04-20 17:10 | Step 2 started | Server implementation |
| 2026-04-20 16:57 | Backlog row shape drafted | Added server-side `buildBacklogItem` projection skeleton covering task identity, area/repo, readiness, execution context, last activity, and summary counts for the dashboard backlog view. |
| 2026-04-20 17:03 | Backlog status mapping drafted | Added `buildBacklogDisplayStatus` to project batch-state, STATUS.md, dependency blockers, and `.DONE` markers into dashboard-facing ready/blocked/running/waiting/done/failed/stalled/skipped states. |
| 2026-04-20 17:05 | Backlog navigation metadata added | Extended backlog rows with prompt/status/task-folder paths plus a reusable task navigation object so later task-detail drill-in can open canonical packet artifacts. |
| 2026-04-20 17:09 | Backlog contract tests added | Added `extensions/tests/dashboard-backlog-contract.test.ts` and passed targeted dashboard contract/history tests for ready/blocked/running/done status shaping plus navigation metadata. |
| 2026-04-20 17:16 | Review fix 1 applied | Added batch-state precedence for `activeTask.status = succeeded` and covered it with a contract test so freshly completed tasks do not regress to `ready` before packet artifacts update. |
| 2026-04-20 17:19 | Review fix 2 applied | Narrowed `readiness.waitingOn = active-batch` to rows with actual active-task membership and added a regression test for standalone `🟡 In Progress` packets. |
| 2026-04-20 16:46 | Preflight readout | Reviewed TP-180/TP-181 outputs plus current dashboard data flow: server serves `/api/state` from `.pi/batch-state.json` + runtime/telemetry/mailbox sidecars and `/api/history*`; frontend boots from `/api/state`, polls history separately, and streams live updates via SSE only for batch-centric data. |
| 2026-04-20 16:50 | Backlog strategy chosen | Implement backlog as a derived server projection over task packet folders from `.pi/taskplane-config.json` task areas, enriched with STATUS.md, `.DONE`, active batch membership, and batch-history hints, exposed additively in dashboard payloads (prefer `/api/state` + SSE) rather than a second source of truth or DB. |

---

## Blockers

*None*

---

## Notes

First implementation task in the Operator Console initiative.

Preflight decisions:
- Keep backlog file-backed and read-only: scan configured task packet directories instead of inventing dashboard-owned state.
- Reuse live batch data for running/in-batch status and batch history for recent completion/activity hints.
- Prefer additive payload expansion on `/api/state`/SSE so the frontend can switch tabs without stitching multiple independent requests.
| 2026-04-20 16:42 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 16:48 | Review R002 | code Step 1: REVISE |
