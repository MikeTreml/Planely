# Task: TP-191 - Flow Composer MVP

**Created:** 2026-04-19
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Product/spec task for introducing a visual workflow-block layer on top of Taskplane. Architecturally important, but this packet is intentionally limited to MVP framing and safe composition rules rather than implementation.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-191-flow-composer-mvp/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define an MVP for a **Flow Composer**: a visual, block-based workflow layer that lets operators compose multi-agent development flows from the interface without replacing Taskplane’s existing execution engine.

This task should answer the operator’s core idea clearly:
- blocks like Plan / Dev / Review / Approve / Integrate
- row/container composition
- loop containers
- multi-agent setup from the interface
- safe mapping from visual flow blocks to Taskplane-compatible execution behavior

The MVP must remain practical and bounded. It should not attempt a full drag-and-drop automation platform.

## Dependencies

- **TP-180** — Operator Console product framing
- **TP-181** — UX / IA
- **TP-185** — Planning/storage direction
- **TP-186** — Slack companion is adjacent but not required

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/domain-model.md`
- `docs/specifications/operator-console/ux-ia.md`
- `docs/specifications/operator-console/interaction-flows.md`
- `docs/specifications/operator-console/planning-artifacts.md`
- `docs/explanation/architecture.md`
- `docs/reference/commands.md`
- `../OpenClawWorkshop/docs/00-overview.md`
- `../OpenClawWorkshop/docs/07-web-control-plane.md`

## Environment

- **Workspace:** `docs/specifications/`, future Operator Console planning surface
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/flow-composer-mvp.md` (new)
- `docs/specifications/operator-console/flow-block-model.md` (new)
- `docs/specifications/operator-console/flow-composer-compile-model.md` (new)

## Steps

### Step 0: Preflight

- [ ] Read the Operator Console product/UX/domain outputs
- [ ] Review current Taskplane execution concepts: tasks, batches, waves, lanes, supervisor, reviews
- [ ] Summarize what parts of the operator’s workflow-block idea fit cleanly today vs what must be deferred

### Step 1: MVP scope and UX

Create `docs/specifications/operator-console/flow-composer-mvp.md` with:
- [ ] Problem statement and user goals
- [ ] Why Flow Composer is a UX/composition layer, not a new orchestrator
- [ ] MVP scope: templates first, bounded block composition second
- [ ] Explicit non-goals (full drag-and-drop builder, arbitrary scripting, generalized automation platform)
- [ ] Initial operator flows for creating/running a composed flow

### Step 2: Block model

Create `docs/specifications/operator-console/flow-block-model.md` with:
- [ ] Primitive blocks: Plan, Implement, Review, Test, Approve, Integrate, Notify
- [ ] Control/container blocks: Sequence, Parallel, Loop, Wait for Human
- [ ] Per-block metadata: title, goal, agent role, model preference, retries, success condition, artifacts, etc.
- [ ] Safe defaults and validation rules
- [ ] Which blocks are v1 vs deferred

### Step 3: Compile/execution model

Create `docs/specifications/operator-console/flow-composer-compile-model.md` with:
- [ ] How a visual flow maps to Taskplane execution concepts
- [ ] Whether it compiles to task packets, templates, orchestration plans, or a bounded intermediate JSON format
- [ ] How loops and parallel groups are represented safely
- [ ] How multi-agent role assignment works without creating a second runtime
- [ ] Guardrails to prevent runaway/ambiguous flows

### Step 4: Verification & Delivery

- [ ] Ensure the Flow Composer design preserves Taskplane as the execution engine of record
- [ ] Ensure the MVP is small enough to implement incrementally
- [ ] Log follow-up implementation tasks and major open questions

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/flow-composer-mvp.md` (new)
- `docs/specifications/operator-console/flow-block-model.md` (new)
- `docs/specifications/operator-console/flow-composer-compile-model.md` (new)

**Check If Affected:**
- `README.md` — only if Flow Composer becomes part of near-term public roadmap messaging

## Completion Criteria

- [ ] Flow Composer MVP is clearly defined and bounded
- [ ] Block taxonomy is concrete enough for implementation planning
- [ ] Compile model preserves Taskplane runtime architecture
- [ ] Loop/container semantics are safe and intentionally constrained

## Git Commit Convention

- **Step completion:** `docs(TP-191): complete Step N — description`
- **Hydration:** `hydrate: TP-191 expand Step N checkboxes`

## Do NOT

- Implement the visual composer in this task
- Replace Taskplane’s execution engine with a new runtime
- Design arbitrary code/script execution blocks
- Expand into a full no-code automation platform

---

## Amendments (Added During Execution)
