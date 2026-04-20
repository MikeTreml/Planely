# Task: TP-192 - Recovery / Helpdesk Agent Product Brief

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Product/architecture framing task for a new recovery-oriented agent role. Important because it introduces a new operational surface and autonomy boundary, but intentionally limited to problem framing and bounded responsibilities.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/TP-192-recovery-helpdesk-agent-product-brief/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define the product brief for a **Recovery / Helpdesk Agent** that helps Taskplane diagnose failures, distinguish implementation issues from repo/config/planning issues, and recommend recovery, redirection, or replanning instead of blindly retrying.

This task should capture the core operator need:
- some failures need a fix,
- some need a retry,
- some need a pivot,
- and some indicate the current task packet should not proceed as written.

The brief must keep the helpdesk role tightly bounded. It should be a diagnostic and recommendation layer first, not a freeform autonomous fixer.

## Dependencies

- **TP-180** — Operator Console product framing
- **TP-181** — UX / IA framing for operator-facing control surfaces

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/roadmap.md`
- `docs/explanation/architecture.md`
- `docs/reference/commands.md`
- recent paused batch summaries / diagnostic reports under `.pi/` if helpful for concrete incident examples

## Environment

- **Workspace:** `docs/specifications/`, recovery / operator control-plane design only
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/recovery-helpdesk-agent-brief.md` (new)

## Steps

### Step 0: Preflight

- [ ] Read the current Operator Console framing and understand where supervisor responsibilities stop today
- [ ] Review recent failure patterns (repo-state mismatch, missing committed files, merge verification mismatch, stale docs/spec assumptions)
- [ ] Distinguish worker/reviewer/supervisor roles from the proposed helpdesk role

### Step 1: Problem framing

Create `docs/specifications/operator-console/recovery-helpdesk-agent-brief.md` with:
- [ ] Problem statement: why retry-only recovery is insufficient
- [ ] Target users/personas (operator, supervisor, maintainer)
- [ ] Failure classes the helpdesk should address vs should not address
- [ ] Why the helpdesk must be diagnostic-first rather than auto-fix-first

### Step 2: Product shape and boundaries

In the same file, define:
- [ ] Core responsibilities: diagnose, classify, recommend, redirect, replan
- [ ] Non-goals: broad autonomous fixing, silent code mutation, hidden commits/pushes
- [ ] Relationship to supervisor (consulted specialist vs replacement)
- [ ] One-time fix vs recurring-fix recommendation pattern

### Step 3: Operator value and examples

In the same file, add:
- [ ] Example incident classes and expected helpdesk outcomes
- [ ] Example recommendations such as retry, retry-after-fix, replan, split task, archive stale docs, commit missing tree then restart
- [ ] Explicit guidance that the agent may recommend *not proceeding* with the current task packet

### Step 4: Verification & Delivery

- [ ] Ensure the brief is specific enough to guide follow-on task packets
- [ ] Ensure autonomy boundaries are explicit and conservative
- [ ] Log follow-up implementation and policy tasks

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/recovery-helpdesk-agent-brief.md` (new)

**Check If Affected:**
- `docs/specifications/operator-console/roadmap.md` — only if this role changes near-term sequencing

## Completion Criteria

- [ ] Recovery / Helpdesk Agent purpose is clearly defined
- [ ] Boundaries against unsafe autonomy are explicit
- [ ] Replan / redirect behavior is described, not just fix / retry behavior
- [ ] Follow-on work can be sequenced from the brief

## Git Commit Convention

- **Step completion:** `docs(TP-192): complete Step N — description`
- **Hydration:** `hydrate: TP-192 expand Step N checkboxes`

## Do NOT

- Implement the helpdesk agent in this task
- Add new runtime hooks or tools
- Treat the helpdesk as a broad autonomous fixer
- Assume it should push to remote or silently commit changes

---

## Amendments (Added During Execution)
