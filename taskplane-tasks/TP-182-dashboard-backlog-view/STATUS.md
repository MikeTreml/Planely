# TP-182: Dashboard Backlog View — Status

**Current Step:** Step 4: Verification & Delivery
**Status:** ✅ Complete
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 16
**Iteration:** 2
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
**Status:** ✅ Complete
- [x] Add backlog loading/shaping
- [x] Expose backlog payload to frontend
- [x] Handle workspace and malformed-task cases
- [x] Support legacy YAML config fallback for backlog task-area discovery
- [x] Make JSON config authoritative over legacy YAML for backlog discovery
- [x] Follow pointer-resolved config roots for workspace backlog discovery
- [x] Resolve pointer roots from JSON-backed workspace metadata
- [x] Preserve workspace backlog scope without an active batch
- [x] Keep JSON workspace metadata authoritative over legacy workspace YAML
- [x] Resolve task-area scan roots relative to the config source

---

### Step 3: Frontend implementation
**Status:** ✅ Complete
- [x] Integrate backlog into dashboard shell/view state
- [x] Add backlog panel/view
- [x] Render rows/cards and selection behavior
- [x] Add lightweight filtering/search affordances
- [x] Render backlog empty/partial/error and scope states
- [x] Preserve existing dashboard usability
- [x] Make backlog task detail action degrade safely outside the active batch

---

### Step 4: Verification & Delivery
**Status:** ✅ Complete
- [x] Test empty/mixed/workspace states
- [x] Perform manual smoke verification
- [x] Update docs if shipped
- [x] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| R001 | plan | 1 | APPROVE | `.reviews/R001-plan-step1.md` |
| R002 | code | 1 | REVISE | `.reviews/R002-code-step1.md` |
| R003 | code | 1 | APPROVE | `.reviews/R003-code-step1.md` |
| R004 | plan | 2 | APPROVE | `.reviews/R004-plan-step2.md` |
| R005 | code | 2 | REVISE | `.reviews/R005-code-step2.md` |
| R006 | code | 2 | REVISE | `.reviews/R006-code-step2.md` |
| R007 | code | 2 | REVISE | `.reviews/R007-code-step2.md` |
| R008 | code | 2 | REVISE | `.reviews/R008-code-step2.md` |
| R009 | code | 2 | REVISE | `.reviews/R009-code-step2.md` |
| R010 | code | 2 | REVISE | `.reviews/R010-code-step2.md` |
| R011 | code | 2 | REVISE | `.reviews/R011-code-step2.md` |
| R015 | code | 3 | REVISE | `.reviews/R015-code-step3.md` |
| R016 | code | 3 | APPROVE | `.reviews/R016-code-step3.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Backlog task inspection currently reuses the live-batch STATUS viewer path, so non-batch tasks need a dedicated backlog-aware detail endpoint before the button can become universally available. | Follow-up gap noted; current UI degrades to a hint outside active batch membership. | `dashboard/public/app.js`, `dashboard/server.cjs` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 16:38 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 16:38 | Step 0 started | Preflight |
| 2026-04-20 16:51 | Step 1 started | Backlog data contract |
| 2026-04-20 17:10 | Step 2 started | Server implementation |
| 2026-04-20 17:35 | Step 3 started | Frontend implementation |
| 2026-04-20 16:57 | Backlog row shape drafted | Added server-side `buildBacklogItem` projection skeleton covering task identity, area/repo, readiness, execution context, last activity, and summary counts for the dashboard backlog view. |
| 2026-04-20 17:03 | Backlog status mapping drafted | Added `buildBacklogDisplayStatus` to project batch-state, STATUS.md, dependency blockers, and `.DONE` markers into dashboard-facing ready/blocked/running/waiting/done/failed/stalled/skipped states. |
| 2026-04-20 17:05 | Backlog navigation metadata added | Extended backlog rows with prompt/status/task-folder paths plus a reusable task navigation object so later task-detail drill-in can open canonical packet artifacts. |
| 2026-04-20 17:09 | Backlog contract tests added | Added `extensions/tests/dashboard-backlog-contract.test.ts` and passed targeted dashboard contract/history tests for ready/blocked/running/done status shaping plus navigation metadata. |
| 2026-04-20 17:16 | Review fix 1 applied | Added batch-state precedence for `activeTask.status = succeeded` and covered it with a contract test so freshly completed tasks do not regress to `ready` before packet artifacts update. |
| 2026-04-20 17:19 | Review fix 2 applied | Narrowed `readiness.waitingOn = active-batch` to rows with actual active-task membership and added a regression test for standalone `🟡 In Progress` packets. |
| 2026-04-20 17:32 | Backlog loading added | Added task-area config loading, PROMPT/STATUS packet parsing, dependency resolution, summary computation, and `loadBacklogData()` server shaping over file-backed task folders. |
| 2026-04-20 17:33 | Backlog payload exposed | Wired backlog projection into `buildDashboardState()` so `/api/state` and SSE snapshots now carry additive `backlog` data even when no active batch exists. |
| 2026-04-20 17:34 | Workspace/malformed handling covered | Backlog scope now reports repo-aware workspace context and partial/error load states while malformed or unreadable task packets are surfaced as non-fatal backlog errors. |
| 2026-04-20 17:48 | Review fix 3 applied | Added legacy `task-runner.yaml` / `task-orchestrator.yaml` fallback parsing for task-area discovery and covered the regression with a YAML-backed backlog loader test. |
| 2026-04-20 17:54 | Review fix 4 applied | Made `taskplane-config.json` authoritative when present and added a precedence regression test so stale legacy YAML cannot override JSON-backed backlog discovery. |
| 2026-04-20 18:04 | Review fix 5 applied | Added pointer-aware dashboard config root resolution plus a workspace pointer regression test so backlog task-area discovery follows the same config chain as the rest of Taskplane. |
| 2026-04-20 18:12 | Review fix 6 applied | Extended pointer resolution to read workspace repo metadata from JSON-backed config as well as legacy YAML, with a regression test for pointer discovery without `taskplane-workspace.yaml`. |
| 2026-04-20 18:19 | Review fix 7 applied | Backlog scope now infers workspace mode from config-backed repo context when idle, and tests verify workspace mode/repo metadata remain present without an active batch. |
| 2026-04-20 18:27 | Review fix 8 applied | Workspace repo discovery now treats JSON config as authoritative over legacy workspace YAML, with a regression test for pointer scope precedence when both files exist. |
| 2026-04-20 18:35 | Review fix 9 applied | Backlog task-area scanning now resolves relative to the config source root, and pointer tests cover the canonical polyrepo layout where packets live beside the pointed config repo. |
| 2026-04-20 18:49 | Frontend shell integration added | Added primary Backlog/Live Batch view tabs plus view-state syncing so the dashboard defaults to Backlog without an active batch and supports one-click switching when a batch is running. |
| 2026-04-20 19:05 | Backlog UI completed | Added backlog scope header, clearable filters, richer empty/partial/error messaging, selectable task detail scaffolding, and no-batch summary bar updates while preserving live-batch panels. |
| 2026-04-20 19:07 | Targeted backlog tests passed | Passed `dashboard-backlog-ui`, `dashboard-backlog-contract`, and `dashboard-backlog-load` targeted Node tests after the frontend implementation changes. |
| 2026-04-20 19:14 | Review fix 10 applied | Backlog selection now only exposes `View STATUS.md` for tasks present in the active batch and otherwise shows a non-broken hint, with targeted UI/contract/load tests still passing. |
| 2026-04-20 19:16 | Dashboard smoke verified | Launched `taskplane dashboard --no-open --port 8137`, fetched `/` and `/api/state`, and confirmed the backlog payload rendered without an active batch (`backlogTotal=194`, `loadState=ready`). |
| 2026-04-20 19:18 | Dashboard docs updated | Documented the backlog-first idle view, Backlog/Live Batch switching, and shared repo-filter behavior in `docs/tutorials/use-the-dashboard.md` and README dashboard copy. |
| 2026-04-20 19:23 | Full extension suite passed | Ran `cd extensions && npm ci` to restore the declared `yaml` dependency, then passed the full Node test suite (`tests/*.test.ts`). |
| 2026-04-20 16:46 | Preflight readout | Reviewed TP-180/TP-181 outputs plus current dashboard data flow: server serves `/api/state` from `.pi/batch-state.json` + runtime/telemetry/mailbox sidecars and `/api/history*`; frontend boots from `/api/state`, polls history separately, and streams live updates via SSE only for batch-centric data. |
| 2026-04-20 16:50 | Backlog strategy chosen | Implement backlog as a derived server projection over task packet folders from `.pi/taskplane-config.json` task areas, enriched with STATUS.md, `.DONE`, active batch membership, and batch-history hints, exposed additively in dashboard payloads (prefer `/api/state` + SSE) rather than a second source of truth or DB. |
| 2026-04-20 17:36 | Worker iter 1 | done in 3461s, tools: 220 |

---

## Blockers

*None*

---

## Notes

First implementation task in the Operator Console initiative.
- R015 suggestion: if backlog actions stay scoped to live-batch tasks, make repo-filter persistence more explicit near the scope line/clear button in a follow-up.

Preflight decisions:
- Keep backlog file-backed and read-only: scan configured task packet directories instead of inventing dashboard-owned state.
- Reuse live batch data for running/in-batch status and batch history for recent completion/activity hints.
- Prefer additive payload expansion on `/api/state`/SSE so the frontend can switch tabs without stitching multiple independent requests.
| 2026-04-20 16:42 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 16:48 | Review R002 | code Step 1: REVISE |
| 2026-04-20 16:50 | Review R003 | code Step 1: APPROVE |
| 2026-04-20 16:52 | Review R004 | plan Step 2: APPROVE |
| 2026-04-20 16:57 | Review R005 | code Step 2: REVISE |
| 2026-04-20 17:01 | Review R006 | code Step 2: REVISE |
| 2026-04-20 17:04 | Review R007 | code Step 2: REVISE |
| 2026-04-20 17:10 | Review R008 | code Step 2: REVISE |
| 2026-04-20 17:15 | Review R009 | code Step 2: REVISE |
| 2026-04-20 17:19 | Review R010 | code Step 2: REVISE |
| 2026-04-20 17:23 | Review R011 | code Step 2: REVISE |
| 2026-04-20 17:27 | Review R012 | code Step 2: APPROVE |
| 2026-04-20 17:29 | Review R013 | plan Step 3: REVISE |
| 2026-04-20 17:30 | Review R014 | plan Step 3: APPROVE |
| 2026-04-20 17:44 | Review R015 | code Step 3: REVISE |
| 2026-04-20 17:47 | Review R016 | code Step 3: APPROVE |
