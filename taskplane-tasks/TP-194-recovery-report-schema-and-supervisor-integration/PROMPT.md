# Task: TP-194 - Recovery Report Schema and Supervisor Integration

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Design task covering how recovery findings should be structured and how the supervisor should invoke and consume them. Moderate importance because this defines the operational contract between agents.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/TP-194-recovery-report-schema-and-supervisor-integration/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define the output schema for Recovery / Helpdesk investigations and the integration model with the supervisor.

This task should answer:
- what the report looks like for humans and machines,
- when the supervisor should invoke helpdesk,
- how the supervisor should present or act on the result,
- and how explicit approval boundaries are preserved.

## Dependencies

- **TP-192** — Recovery / Helpdesk Agent product brief
- **TP-193** — Failure taxonomy and decision matrix

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/recovery-helpdesk-agent-brief.md`
- `docs/specifications/operator-console/recovery-failure-taxonomy.md`
- `docs/specifications/operator-console/recovery-decision-matrix.md`
- `.pi/supervisor/*.md`
- supervisor action/event history under `.pi/supervisor/` if useful for shape inspiration

## Environment

- **Workspace:** `docs/specifications/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/recovery-report-schema.md` (new)
- `docs/specifications/operator-console/recovery-supervisor-integration.md` (new)

## Steps

### Step 0: Preflight

- [ ] Review TP-192 and TP-193 outputs
- [ ] Review how supervisors currently summarize incidents and recommendations
- [ ] Identify what must be structured for future automation vs what can remain narrative

### Step 1: Recovery report schema

Create `docs/specifications/operator-console/recovery-report-schema.md` with:
- [ ] Markdown report contract for humans
- [ ] JSON/schema contract for structured consumption
- [ ] Required fields: incident, evidence, classification, immediate cause, root cause, one-time recovery, recurrence prevention, recommendation, risk/autonomy level
- [ ] Optional fields: confidence, affected tasks, suggested follow-up tasks, stale-doc candidates

### Step 2: Supervisor integration model

Create `docs/specifications/operator-console/recovery-supervisor-integration.md` with:
- [ ] Trigger conditions for invoking helpdesk
- [ ] How supervisor asks for investigation
- [ ] How supervisor should summarize/relay the result to the operator
- [ ] Which recommendations can be executed autonomously vs require explicit operator approval

### Step 3: Escalation and replan behavior

In the integration doc, define:
- [ ] How helpdesk can recommend redirect/replan rather than recovery
- [ ] How the supervisor should present “do not continue current task as written” outcomes
- [ ] How follow-up task creation or packet splitting should be proposed

### Step 4: Verification & Delivery

- [ ] Verify the schema is actionable and not overly verbose
- [ ] Verify supervisor boundaries remain clear
- [ ] Log implementation prerequisites and open questions

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/recovery-report-schema.md` (new)
- `docs/specifications/operator-console/recovery-supervisor-integration.md` (new)

**Check If Affected:**
- `docs/reference/commands.md` — only if new operator-visible commands are implied strongly enough to document

## Completion Criteria

- [ ] Recovery reports are defined for both human and machine use
- [ ] Supervisor trigger and relay behavior are explicit
- [ ] Redirect / replan outcomes are supported cleanly
- [ ] Approval boundaries are preserved

## Git Commit Convention

- **Step completion:** `docs(TP-194): complete Step N — description`
- **Hydration:** `hydrate: TP-194 expand Step N checkboxes`

## Do NOT

- Implement the report writer or supervisor hooks in this task
- Blur the line between recommendation and autonomous action
- Assume the supervisor should always execute the helpdesk recommendation automatically
- Make the report schema so broad that it becomes impossible to fill consistently

---

## Amendments (Added During Execution)
