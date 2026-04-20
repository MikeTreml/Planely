# Task: TP-183 - Dashboard Task Detail and Operator Actions

**Created:** 2026-04-19
**Size:** L

## Review Level: 2 (Plan + Code)

**Assessment:** Extends dashboard from list/monitoring to operator control by adding task detail and action affordances. Touches UI, server contracts, and command integration points.
**Score:** 5/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-183-dashboard-task-detail-and-operator-actions/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Implement task detail and core operator action flows in the dashboard so an operator can inspect a task and take the next obvious action without dropping to raw files or memorizing slash commands. This task should build directly on the backlog view and the existing batch controls model.

Priority actions for v1:
- inspect task details
- launch a task or selected set via orchestrator
- retry failed task
- skip failed/pending task
- integrate completed batch when available

If a lightweight UI affordance for some actions is not yet feasible, document the gap explicitly and ship the safest incremental version.

## Dependencies

- **TP-182** — Backlog view and task selection model

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/ux-ia.md`
- `docs/specifications/operator-console/view-models.md`
- `docs/specifications/operator-console/interaction-flows.md`
- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `docs/reference/commands.md` — /orch*, retry/skip/integrate semantics
- `extensions/taskplane/extension.ts` — command implementation details

## Environment

- **Workspace:** `dashboard/`, `extensions/taskplane/`
- **Services required:** None

## File Scope

- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `extensions/taskplane/extension.ts` (only if a small supporting endpoint/helper is truly required)
- `extensions/tests/*`
- `docs/tutorials/use-the-dashboard.md` / `docs/reference/commands.md` if user-facing behavior changes materially

## Steps

### Step 0: Preflight

- [ ] Read backlog implementation (TP-182 output)
- [ ] Review command semantics for start/retry/skip/integrate
- [ ] Identify the safest action surface the dashboard can support now
- [ ] Define which actions are direct-trigger vs command-copy/deep-link fallback

### Step 1: Task detail view

- [ ] Add task detail pane/modal/view with title, mission summary, dependencies, file scope, status, latest execution info
- [ ] Render enough PROMPT/STATUS-derived information to avoid opening raw files for common operator needs
- [ ] Support navigation from backlog/history/live batch to the detail view

### Step 2: Operator actions contract

- [ ] Define how dashboard actions invoke orchestrator capabilities
- [ ] Prefer safe existing command paths over bespoke mutation logic where possible
- [ ] Add guardrails/confirmation for destructive or context-sensitive actions
- [ ] Ensure action availability respects current batch/task state

### Step 3: Frontend/server implementation

- [ ] Implement the action UI affordances
- [ ] Implement any minimal server glue needed to support them
- [ ] Handle success, failure, disabled, and unsupported states clearly
- [ ] Avoid exposing fragile or unsafe controls during active transitions

### Step 4: Verification & Delivery

- [ ] Add tests for action gating/state handling
- [ ] Smoke-test inspect + action flows
- [ ] Update docs if dashboard control behavior becomes user-facing
- [ ] Log follow-up gaps (e.g., missing auth, rate limiting, command mediation)

## Documentation Requirements

**Must Update:**
- `docs/tutorials/use-the-dashboard.md` — if task detail/actions are shipped

**Check If Affected:**
- `docs/reference/commands.md` — only if UI introduces a documented supported control path worth mentioning

## Completion Criteria

- [ ] Operator can inspect a task in the dashboard with meaningful detail
- [ ] At least one safe orchestration action is available from the dashboard
- [ ] Action availability is state-aware and guarded
- [ ] Existing live monitoring remains stable

## Git Commit Convention

- **Step completion:** `feat(TP-183): complete Step N — description`
- **Bug fixes:** `fix(TP-183): description`
- **Hydration:** `hydrate: TP-183 expand Step N checkboxes`

## Do NOT

- Bypass orchestrator safety semantics
- Add unaudited destructive actions without confirmation/gating
- Reimplement slash-command logic wholesale in the dashboard
- Expand into user auth/permissions systems unless strictly necessary and explicitly scoped

---

## Amendments (Added During Execution)
