# Task: TP-190 - Runnable-State Diagnostics and Run Selected

**Created:** 2026-04-19
**Size:** L

## Review Level: 2 (Plan + Code)

**Assessment:** Adds operator-facing diagnostics for why tasks are or are not runnable, plus UI-triggered execution of selected tasks. Significant UX value with moderate risk around action safety and state gating.
**Score:** 5/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-190-runnable-state-diagnostics-and-run-selected/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Make the dashboard/app explain task runnability and allow the operator to run selected tasks directly from the interface.

The key user problem to solve is: when a task cannot run, the interface should say why in operator-friendly language instead of just failing with "no pending tasks found." When a task can run, the interface should offer a safe "Run" or "Run Selected" action.

Diagnostic reasons may include:
- wrong project selected
- task already complete
- task blocked by dependency
- task skipped/archived
- malformed packet
- task outside active task areas
- not discovered in current project state

## Dependencies

- **TP-182** — backlog/task view
- **TP-183** — operator actions
- **TP-189** — query/refresh controls are a helpful precursor

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `extensions/taskplane/discovery.ts`
- `extensions/taskplane/extension.ts`
- `docs/reference/commands.md`
- `docs/specifications/operator-console/view-models.md`
- `docs/specifications/operator-console/interaction-flows.md`

## Environment

- **Workspace:** `dashboard/`, `extensions/taskplane/`
- **Services required:** None

## File Scope

- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `extensions/taskplane/*` only if minimal support functions/endpoints are needed
- tests as appropriate
- `docs/tutorials/use-the-dashboard.md` if user-facing behavior ships

## Steps

### Step 0: Preflight

- [ ] Review how run start currently resolves targets and pending tasks
- [ ] Identify what diagnostic signals already exist in discovery/planning/state code
- [ ] Define the smallest safe UI execution surface for Run / Run Selected
- [ ] Define which non-runnable reasons can be detected confidently in v1

### Step 1: Runnable-state diagnostics contract

- [ ] Define a user-facing reason taxonomy for runnable vs non-runnable tasks
- [ ] Map internal discovery/state conditions to friendly explanations
- [ ] Define how diagnostics appear in backlog/detail views
- [ ] Ensure ambiguity is handled honestly (e.g., unknown vs definitely blocked)

### Step 2: Run / Run Selected action design

- [ ] Define selection model for one or more tasks
- [ ] Define state gating so only safe/valid selections are runnable
- [ ] Define confirmation and result feedback patterns
- [ ] Ensure actions map back to real orchestrator start behavior rather than custom execution logic

### Step 3: Implementation

- [ ] Add diagnostics data shaping and UI rendering
- [ ] Add Run / Run Selected controls
- [ ] Add execution-trigger wiring with safe success/failure handling
- [ ] Avoid exposing actions during invalid transition states

### Step 4: Verification & Delivery

- [ ] Test common non-runnable cases and messages
- [ ] Test running a single selected task
- [ ] Test mixed valid/invalid selections
- [ ] Update docs if shipped user-facing
- [ ] Log follow-up gaps and edge cases

## Documentation Requirements

**Must Update:**
- `docs/tutorials/use-the-dashboard.md` — if diagnostics/run actions ship

**Check If Affected:**
- `docs/reference/commands.md` — only if dashboard-triggered execution becomes a documented supported operator path

## Completion Criteria

- [ ] Dashboard explains why tasks are or are not runnable in common cases
- [ ] Operator can run a valid selected task (and ideally selected set) from the UI
- [ ] Invalid selections are blocked safely and explained clearly
- [ ] No hidden custom execution path bypasses orchestrator semantics

## Git Commit Convention

- **Step completion:** `feat(TP-190): complete Step N — description`
- **Bug fixes:** `fix(TP-190): description`
- **Hydration:** `hydrate: TP-190 expand Step N checkboxes`

## Do NOT

- Show misleading diagnostic certainty when the system cannot know the reason
- Bypass normal orchestrator execution semantics
- Allow bulk execution without clear state validation
- Hide failures behind generic “nothing happened” behavior

---

## Amendments (Added During Execution)
