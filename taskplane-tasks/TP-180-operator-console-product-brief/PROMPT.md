# Task: TP-180 - Operator Console Product Brief

**Created:** 2026-04-19
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Product/architecture planning task spanning existing dashboard, orchestrator primitives, and roadmap definition. Moderate scope but no runtime code changes.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-180-operator-console-product-brief/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Create the foundational product brief for evolving Taskplane from a strong orchestration engine into a practical operator-facing project app. The brief should synthesize the current Taskplane architecture and dashboard capabilities with the OpenClawWorkshop control-plane ideas the operator liked, then define an MVP called **Taskplane Operator Console**.

This is the anchor task for the follow-on UI and planning tasks staged today. Make the brief concrete enough that implementation tasks can align to it without revisiting first principles.

## Dependencies

- **None**

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `README.md` — current Taskplane positioning
- `docs/explanation/architecture.md` — actual runtime structure
- `docs/reference/commands.md` — command surface and operator flows
- `dashboard/public/index.html` — current dashboard shell
- `dashboard/public/app.js` — current dashboard behaviors
- `../OpenClawWorkshop/docs/00-overview.md` — workflow/control-plane framing
- `../OpenClawWorkshop/docs/06-human-control-plane-slack.md` — Slack role
- `../OpenClawWorkshop/docs/07-web-control-plane.md` — web UI role

## Environment

- **Workspace:** `docs/`, `dashboard/`, `taskplane-tasks/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/product-brief.md` (new)
- `docs/specifications/operator-console/domain-model.md` (new)
- `docs/specifications/operator-console/roadmap.md` (new)
- `taskplane-tasks/CONTEXT.md` (only if discoveries/tech debt need logging)

## Steps

### Step 0: Preflight

- [ ] Read current architecture and command docs
- [ ] Inspect dashboard shell and identify what already exists vs what is missing for a project app
- [ ] Read the OpenClaw control-plane docs listed above
- [ ] Produce a concise current-state summary: strengths, gaps, and non-goals

### Step 1: Product brief

Create `docs/specifications/operator-console/product-brief.md` with:
- [ ] Problem statement
- [ ] Target operator personas / use cases
- [ ] Why Taskplane should remain the execution engine of record
- [ ] Why web UI is primary and Slack is secondary
- [ ] MVP scope and explicit non-goals
- [ ] Success criteria for Operator Console v1

### Step 2: Domain model

Create `docs/specifications/operator-console/domain-model.md` with:
- [ ] Core entities: ideas, specs, initiatives, task packets, batches, runs, approvals, artifacts
- [ ] Which entities are canonical files vs derived views
- [ ] Relationships between planning artifacts and execution artifacts
- [ ] Auditability / source-of-truth rules

### Step 3: Phased roadmap

Create `docs/specifications/operator-console/roadmap.md` with:
- [ ] Phase order: operator console, task authoring, planning layer, Slack companion, workflow templates
- [ ] Rationale for sequencing
- [ ] Candidate milestones and acceptance criteria per phase
- [ ] Risks, tradeoffs, and deferrals

### Step 4: Verification & Delivery

- [ ] Verify the spec set is internally consistent and grounded in current Taskplane behavior
- [ ] Ensure the docs do not promise unsupported runtime features as if they already exist
- [ ] Log any newly discovered tech debt or prerequisite gaps in STATUS.md

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/product-brief.md` (new)
- `docs/specifications/operator-console/domain-model.md` (new)
- `docs/specifications/operator-console/roadmap.md` (new)

**Check If Affected:**
- `docs/README.md` — only if the new spec folder should be linked immediately

## Completion Criteria

- [ ] A coherent Operator Console v1 product brief exists
- [ ] Domain model clearly separates planning artifacts from execution state
- [ ] Roadmap phases are actionable and sequenced
- [ ] The design explicitly preserves Taskplane as the runtime/execution core

## Git Commit Convention

- **Step completion:** `docs(TP-180): complete Step N — description`
- **Hydration:** `hydrate: TP-180 expand Step N checkboxes`

## Do NOT

- Build UI or runtime code in this task
- Introduce a separate orchestration engine
- Make Slack the canonical source of truth
- Invent database requirements without evidence
- Expand scope beyond the Operator Console framing

---

## Amendments (Added During Execution)
