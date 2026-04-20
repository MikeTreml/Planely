# Task: TP-189 - Dashboard Query and Refresh Controls

**Created:** 2026-04-19
**Size:** M

## Review Level: 2 (Plan + Code)

**Assessment:** Adds operator-facing refresh/discovery controls to the dashboard and likely touches server payloads plus frontend state refresh behavior. Moderate blast radius, incremental UX improvement.
**Score:** 4/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-189-dashboard-query-and-refresh-controls/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Add dashboard/app controls so an operator can query and refresh Taskplane state without dropping to CLI/slash commands for common discovery flows. The first version should support a practical control bar or equivalent UI that covers:
- refresh current dashboard state
- refresh/re-scan task discovery
- query pending vs all tasks
- optionally trigger a plan refresh if the current architecture supports it safely

The goal is to make the interface feel like a real control plane, not just a passive monitor.

## Dependencies

- **TP-182** — backlog/task listing groundwork
- **TP-183** — operator action model
- **TP-187** — sidebar/navigation may influence placement, but not strictly required

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `docs/reference/commands.md` — /orch-plan, /orch, status semantics
- `extensions/taskplane/discovery.ts` — discovery behavior
- `extensions/taskplane/extension.ts` — planning/start surfaces if relevant
- `docs/specifications/operator-console/ux-ia.md`
- `docs/specifications/operator-console/interaction-flows.md`

## Environment

- **Workspace:** `dashboard/`, `extensions/taskplane/`
- **Services required:** None

## File Scope

- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `dashboard/server.cjs`
- tests as appropriate for dashboard/server behavior
- `docs/tutorials/use-the-dashboard.md` if user-facing controls ship

## Steps

### Step 0: Preflight

- [ ] Review current dashboard refresh/poll/SSE model
- [ ] Identify what is already refreshed automatically vs what needs explicit operator control
- [ ] Define the safest set of manual controls that map to real Taskplane behavior
- [ ] Decide which controls are true actions vs view/filter state only

### Step 1: Query/refresh contract

- [ ] Define the control set (Refresh, Re-scan, Pending/All toggle, etc.)
- [ ] Define expected behavior and operator feedback for each control
- [ ] Define empty/loading/error states
- [ ] Ensure controls do not imply unsupported background behavior

### Step 2: Server/client implementation

- [ ] Add any minimal server-side endpoints or handlers needed
- [ ] Add frontend control bar and wiring
- [ ] Ensure refresh updates backlog/task state coherently
- [ ] Keep existing dashboard polling/SSE behavior intact

### Step 3: Verification & Delivery

- [ ] Test refresh after task file changes
- [ ] Test pending/all filtering behavior
- [ ] Test graceful handling when discovery/refresh fails
- [ ] Update docs if shipped user-facing
- [ ] Log follow-up gaps

## Documentation Requirements

**Must Update:**
- `docs/tutorials/use-the-dashboard.md` — if controls ship

**Check If Affected:**
- `README.md` — only if this becomes a notable dashboard feature immediately

## Completion Criteria

- [ ] Operator can refresh/query task state from the UI
- [ ] Common discovery refresh flows no longer require CLI for normal use
- [ ] Existing dashboard live-state behavior still works
- [ ] Error/empty/loading states are clear

## Git Commit Convention

- **Step completion:** `feat(TP-189): complete Step N — description`
- **Bug fixes:** `fix(TP-189): description`
- **Hydration:** `hydrate: TP-189 expand Step N checkboxes`

## Do NOT

- Reimplement orchestrator logic inside the dashboard
- Add vague controls that do not map to real behavior
- Break current SSE/live monitoring to add manual refresh
- Expand into a generalized admin console

---

## Amendments (Added During Execution)
