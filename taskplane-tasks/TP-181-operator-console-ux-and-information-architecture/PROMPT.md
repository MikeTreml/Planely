# Task: TP-181 - Operator Console UX and Information Architecture

**Created:** 2026-04-19
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** UX/spec task that defines the operator-facing views and navigation for the next dashboard evolution. Moderate novelty, no production code changes.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-181-operator-console-ux-and-information-architecture/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define the Operator Console v1 user experience and information architecture so follow-on implementation tasks have a stable blueprint. The outcome should describe how the existing dashboard evolves from a batch monitor into a daily-use operator workspace without abandoning the current runtime views.

The design must preserve the existing strengths of the dashboard (live batch state, lane views, supervisor visibility) while adding a planning-friendly operator layer.

## Dependencies

- **TP-180** — Product brief and domain model should exist first

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md` — output of TP-180
- `docs/specifications/operator-console/domain-model.md` — output of TP-180
- `dashboard/public/index.html` — existing layout and panels
- `dashboard/public/app.js` — current interactions and states
- `dashboard/public/style.css` — existing visual constraints
- `../OpenClawWorkshop/docs/07-web-control-plane.md` — primary web control-surface intent

## Environment

- **Workspace:** `dashboard/`, `docs/specifications/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/ux-ia.md` (new)
- `docs/specifications/operator-console/view-models.md` (new)
- `docs/specifications/operator-console/interaction-flows.md` (new)

## Steps

### Step 0: Preflight

- [ ] Read TP-180 outputs
- [ ] Inventory existing dashboard panels and identify reusable components vs missing views
- [ ] Identify the minimum navigation model needed for v1

### Step 1: Information architecture

Create `docs/specifications/operator-console/ux-ia.md` with:
- [ ] Primary views (backlog, task detail, live batch, history, approvals)
- [ ] Navigation hierarchy and entry points
- [ ] Which views are global vs batch-scoped vs task-scoped
- [ ] How workspace/repo filtering should behave

### Step 2: View models

Create `docs/specifications/operator-console/view-models.md` with:
- [ ] Backlog row/card shape
- [ ] Task detail data shape
- [ ] Batch summary / “next recommended action” shape
- [ ] Approval/action affordance requirements
- [ ] Empty/loading/error states

### Step 3: Interaction flows

Create `docs/specifications/operator-console/interaction-flows.md` with:
- [ ] Start batch from backlog flow
- [ ] Inspect task flow
- [ ] Retry/skip/integrate flow
- [ ] Navigate from notification/history entry to underlying task or batch
- [ ] Guardrails against destructive/confusing actions

### Step 4: Verification & Delivery

- [ ] Confirm the IA can be implemented incrementally inside the current dashboard architecture
- [ ] Ensure no flow assumes a backend API that does not yet exist without calling it out explicitly
- [ ] Record discoveries and prerequisites

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/ux-ia.md` (new)
- `docs/specifications/operator-console/view-models.md` (new)
- `docs/specifications/operator-console/interaction-flows.md` (new)

**Check If Affected:**
- `docs/tutorials/use-the-dashboard.md` — only if IA work reveals urgent current-doc mismatches

## Completion Criteria

- [ ] Operator Console views and navigation are clearly defined
- [ ] Key operator workflows are specified end-to-end
- [ ] Incremental implementation path on top of current dashboard is explicit
- [ ] Required data shape for each view is documented

## Git Commit Convention

- **Step completion:** `docs(TP-181): complete Step N — description`
- **Hydration:** `hydrate: TP-181 expand Step N checkboxes`

## Do NOT

- Implement the UI in this task
- Assume a full frontend rewrite
- Design drag-and-drop builders or generalized workflow editors
- Introduce auth/account systems in v1 planning

---

## Amendments (Added During Execution)
