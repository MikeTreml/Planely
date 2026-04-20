# TP-187: Project Sidebar and Navigation — Status

**Current Step:** Step 1: Sidebar UX contract
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 0
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read Operator Console specs/tasks
- [x] Inventory current dashboard layout
- [x] Determine minimum project identity data needed
- [x] Identify whether project data is available now or requires TP-188 registry support

---

### Step 1: Sidebar UX contract
**Status:** 🟨 In Progress
- [ ] Define sidebar sections and row content
- [ ] Define selection and empty states
- [ ] Define archive visibility behavior

---

### Step 2: UI implementation
**Status:** ⬜ Not Started
- [ ] Add sidebar shell/layout
- [ ] Render sectioned project list
- [ ] Add project selection behavior
- [ ] Preserve narrower-layout usability

---

### Step 3: Integration behavior
**Status:** ⬜ Not Started
- [ ] Wire selection into dashboard loading/state
- [ ] Handle missing/stale data gracefully
- [ ] Keep archived projects accessible but de-emphasized

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify active vs archived navigation
- [ ] Verify no regression to existing monitoring
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
| Current dashboard shell is single-column (`.content` flex column) with header, summary bar, two top-level tabs, and stacked panels; adding a sidebar will require restructuring the main shell rather than dropping a list into an existing rail. | Use a new split layout that keeps the current panels inside the main content region. | `dashboard/public/index.html`, `dashboard/public/style.css`, `dashboard/public/app.js` |
| Current `/api/state` payload is scoped to one open root and returns batch/backlog/runtime data but no multi-project registry payload. | Step 3 will likely need TP-188-style registry data or a safe temporary sidebar model added in `dashboard/server.cjs`. | `dashboard/server.cjs` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 19:43 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 19:43 | Step 0 started | Preflight |
| 2026-04-20 19:49 | Step 0 completed | Specs reviewed; current dashboard is single-project and lacks project registry payload |
| 2026-04-20 19:49 | Step 1 started | Sidebar UX contract |

---

## Blockers

*None*

---

## Notes

Sidebar/navigation task for multi-project operator UX.
- Step 0 findings: minimum sidebar identity should stay lightweight and grounded in TP-188 fields — stable `id`, display `name`, reopenable `rootPath`/`configPath`, `mode`, explicit `archived`, and activity timestamps (`lastOpenedAt`, `lastBatchAt`) so the UI can derive Active/Archived/Recent plus missing-path warnings without inventing UI-only truth.
- Current dashboard shell uses header + summary + primary tabs over a single `.content` column. The least disruptive sidebar insertion point is a new split body where the sidebar owns project navigation and the existing backlog/live/history/task-detail panels remain in the main pane.
