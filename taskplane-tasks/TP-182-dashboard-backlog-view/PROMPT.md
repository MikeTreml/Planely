# Task: TP-182 - Dashboard Backlog View

**Created:** 2026-04-19
**Size:** L

## Review Level: 2 (Plan + Code)

**Assessment:** Adds a significant new operator-facing dashboard capability spanning server-side data shaping and frontend rendering. Moderate blast radius with UI/data contract changes.
**Score:** 4/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-182-dashboard-backlog-view/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Implement the first Operator Console feature: a backlog view in the dashboard that surfaces discovered task packets as a planning/launchable list, not just as live batch state. The backlog should help an operator answer: what work exists, what is ready, what is blocked, what is running, and what has completed.

This should build on the current dashboard architecture, not replace it.

## Dependencies

- **TP-180** — Product framing
- **TP-181** — UX / IA blueprint

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/ux-ia.md`
- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `extensions/taskplane/discovery.ts` — task discovery semantics
- `extensions/taskplane/types.ts` — batch/task state shapes

## Environment

- **Workspace:** `dashboard/`, `extensions/taskplane/`
- **Services required:** None

## File Scope

- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `extensions/tests/*` (add/adjust tests where appropriate)
- `docs/tutorials/use-the-dashboard.md` (if behavior becomes user-facing enough to require docs)

## Steps

### Step 0: Preflight

- [ ] Read TP-180 and TP-181 outputs
- [ ] Trace how the dashboard currently loads live batch and history data
- [ ] Identify where standalone task discovery/backlog data should come from
- [ ] Decide whether backlog data is polled from files directly, derived from discovery, or exposed via a new server endpoint

### Step 1: Backlog data contract

- [ ] Define backlog row shape: task ID, title, area, repo, dependency status, execution status, readiness, last activity
- [ ] Map file-backed task states to user-friendly backlog statuses (ready, blocked, running, done, etc.)
- [ ] Include enough metadata for later task detail navigation
- [ ] Add tests for the server-side shaping logic

### Step 2: Server implementation

- [ ] Add server-side loading/shaping for backlog data
- [ ] Expose backlog data to the frontend without breaking existing dashboard payloads
- [ ] Ensure workspace mode/repo filtering remains coherent
- [ ] Handle projects with no tasks or malformed tasks gracefully

### Step 3: Frontend implementation

- [ ] Add backlog panel/view to the dashboard shell
- [ ] Render rows/cards with status, dependency/readiness signals, and quick context
- [ ] Add filters/search if lightweight and justified by TP-181; otherwise structure for easy follow-up
- [ ] Allow selecting a task for later detail/action flows
- [ ] Preserve current live batch views and avoid clutter/regression

### Step 4: Verification & Delivery

- [ ] Add or update tests for empty state, mixed status, and workspace filtering
- [ ] Run dashboard/manual smoke verification
- [ ] Update docs if the new backlog view is shipped user-facing
- [ ] Log discoveries and follow-up gaps

## Documentation Requirements

**Must Update:**
- `docs/tutorials/use-the-dashboard.md` — if backlog view becomes visible to users in this change

**Check If Affected:**
- `README.md` — if dashboard feature bullets should mention backlog view immediately

## Completion Criteria

- [ ] Dashboard shows a backlog/task list outside active batch-only views
- [ ] Backlog statuses are grounded in canonical task/runtime state
- [ ] Existing dashboard live-batch behavior still works
- [ ] Empty/error/workspace states are handled cleanly

## Git Commit Convention

- **Step completion:** `feat(TP-182): complete Step N — description`
- **Bug fixes:** `fix(TP-182): description`
- **Hydration:** `hydrate: TP-182 expand Step N checkboxes`

## Do NOT

- Introduce a separate database-backed backlog system
- Duplicate canonical task state into a new source of truth
- Rewrite the entire dashboard frontend
- Add task mutation controls before the view model is stable

---

## Amendments (Added During Execution)
