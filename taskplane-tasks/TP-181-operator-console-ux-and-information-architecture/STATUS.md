# TP-181: Operator Console UX and Information Architecture — Status

**Current Step:** Step 2: View models
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 1
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read TP-180 outputs
- [x] Inventory current dashboard panels
- [x] Identify reusable vs missing views

---

### Step 1: Information architecture
**Status:** ✅ Complete
- [x] Define primary views
- [x] Define navigation hierarchy
- [x] Define filter and scope behavior

---

### Step 2: View models
**Status:** 🟨 In Progress
- [ ] Define backlog view model
- [ ] Define task detail view model
- [ ] Define summary/action view models

---

### Step 3: Interaction flows
**Status:** ⬜ Not Started
- [ ] Define start-batch flow
- [ ] Define inspect-task flow
- [ ] Define retry/skip/integrate flow
- [ ] Define guardrails

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify incremental implementation path
- [ ] Flag required new APIs or commands
- [ ] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| TP-180 outputs confirm v1 must preserve current live runtime strengths while adding backlog, task detail, approvals, history, and planning-aware navigation as derived views over file-backed Taskplane state. | Use as IA baseline for new specs in Steps 1-3. | `docs/specifications/operator-console/product-brief.md`; `docs/specifications/operator-console/domain-model.md` |
| Current dashboard already provides reusable runtime-monitoring surfaces: header batch chrome, summary bar, supervisor panel, lanes/tasks, merge agents, runtime agents, mailbox messages, history summary, repo filter, and terminal/status viewers. | Reuse as the live-batch workspace layer in the IA. | `dashboard/public/index.html`; `dashboard/public/app.js`; `dashboard/public/style.css` |
| Current dashboard is missing operator-planning views: backlog, task detail workspace, approvals inbox, project/workspace navigation, and explicit next-action summaries. | Specify as new v1 views layered on top of existing runtime panels. | `dashboard/public/index.html`; `docs/specifications/operator-console/*.md` |
| Minimum v1 navigation can stay lightweight: global workspace selector/filter + primary tabs for Backlog, Live Batch, Approvals, and History, with task detail opening as a scoped drill-in from any list. | Use as the navigation skeleton in `ux-ia.md`; avoids a full frontend rewrite. | `dashboard/public/index.html`; `dashboard/public/app.js`; `docs/specifications/operator-console/ux-ia.md` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 16:23 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 16:23 | Step 0 started | Preflight |
| 2026-04-20 16:28 | Reviewed TP-180 outputs | Product brief and domain model captured Operator Console goals, constraints, and canonical-vs-derived rules for this IA task. |
| 2026-04-20 16:31 | Inventory current dashboard | Confirmed reusable live panels and identified missing operator-facing views and navigation needs. |
| 2026-04-20 16:33 | Defined minimum nav model | Chose lightweight primary tabs plus scoped drill-in detail rather than a dashboard rewrite. |
| 2026-04-20 16:38 | Authored UX IA spec | Added primary view definitions for Backlog, Task Detail, Live Batch, History, and Approvals. |
| 2026-04-20 16:39 | Defined navigation hierarchy | Documented top-level tabs, entry points, breadcrumbs, and drill-in behavior in `ux-ia.md`. |
| 2026-04-20 16:39 | Defined filter and scope behavior | Captured workspace, repo, batch, and task scoping rules plus empty-state fallback behavior in `ux-ia.md`. |

---

## Blockers

*None*

---

## Notes

IA task for the Operator Console v1 UI layer.
- TP-180 baseline: preserve the current runtime monitor strengths, keep Taskplane as execution authority, and add operator-friendly backlog/detail/approval/history projections rather than a second source of truth.
- Current dashboard IA starts as a single live-batch surface with optional history inspection and a viewer drawer; it already supports runtime-centric supervision well, so v1 should extend it rather than replace it.
- Proposed minimum navigation for v1: workspace/repo scope in the header, primary nav for Backlog / Live Batch / Approvals / History, and a task-detail drill-in reachable from backlog rows, live tasks, messages, and history.
| 2026-04-20 16:25 | Review R001 | plan Step 1: APPROVE |
