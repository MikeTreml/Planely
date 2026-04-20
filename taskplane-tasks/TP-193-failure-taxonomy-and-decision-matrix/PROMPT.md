# Task: TP-193 - Failure Taxonomy and Decision Matrix

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Design task that turns broad recovery ideas into concrete classifications and operator actions. Important because it defines when to retry, repair, redirect, skip, or replan.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/TP-193-failure-taxonomy-and-decision-matrix/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define a structured failure taxonomy and decision matrix for Taskplane recovery. This taxonomy should be usable by a future Recovery / Helpdesk Agent, the supervisor, and human operators.

The matrix should help answer:
- What kind of failure is this?
- What evidence distinguishes it from other failure kinds?
- What action is appropriate now?
- Is the right response retry, fix, skip, split, replan, or archive stale assumptions?

## Dependencies

- **TP-192** — Recovery / Helpdesk Agent product brief

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/recovery-helpdesk-agent-brief.md`
- `.pi/supervisor/*summary.md`
- `.pi/diagnostics/*report.md`
- `docs/reference/commands.md`
- representative task packets that mix docs-only and implementation work

## Environment

- **Workspace:** `docs/specifications/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/recovery-failure-taxonomy.md` (new)
- `docs/specifications/operator-console/recovery-decision-matrix.md` (new)

## Steps

### Step 0: Preflight

- [ ] Review the Recovery / Helpdesk Agent brief
- [ ] Gather real incident patterns from prior batch failures
- [ ] Separate implementation problems from repo-state/config/planning/doc-drift problems

### Step 1: Failure taxonomy

Create `docs/specifications/operator-console/recovery-failure-taxonomy.md` with:
- [ ] Core categories: implementation failure, flaky implementation, test failure, merge verification failure, repo-state issue, config issue, stale-doc/spec mismatch, planning mismatch, orchestrator/runtime issue
- [ ] Typical symptoms for each category
- [ ] Required evidence for confident classification
- [ ] Common false positives / confusing overlaps

### Step 2: Decision matrix

Create `docs/specifications/operator-console/recovery-decision-matrix.md` with:
- [ ] Immediate actions by failure class
- [ ] Conditions for retry vs retry-after-fix vs skip vs replan vs split-task
- [ ] Conditions for recommending doc archive/review instead of implementation work
- [ ] Conditions for pausing/aborting/restarting the batch

### Step 3: One-time vs recurring fixes

In the decision matrix, add:
- [ ] How to distinguish one-time repairs from systemic fixes
- [ ] Expected output format for recurring-fix recommendations
- [ ] Examples where the right answer is to propose a new task packet rather than recover the current one

### Step 4: Verification & Delivery

- [ ] Verify the taxonomy is concrete enough for implementation and operator use
- [ ] Ensure the decision matrix avoids blind retry loops
- [ ] Log any categories that remain ambiguous or need data collection

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/recovery-failure-taxonomy.md` (new)
- `docs/specifications/operator-console/recovery-decision-matrix.md` (new)

**Check If Affected:**
- `docs/reference/commands.md` — only if future user-facing recovery commands are implied strongly enough to warrant mention

## Completion Criteria

- [ ] Failure classes are concrete and evidence-based
- [ ] Retry / repair / redirect / replan choices are distinguished clearly
- [ ] One-time vs recurring-fix guidance is explicit
- [ ] The matrix reduces blind recovery loops

## Git Commit Convention

- **Step completion:** `docs(TP-193): complete Step N — description`
- **Hydration:** `hydrate: TP-193 expand Step N checkboxes`

## Do NOT

- Implement automatic classification in this task
- Add new runtime behavior
- Collapse fundamentally different failure classes into a generic "task failed" bucket
- Assume all failures should be solved by retrying

---

## Amendments (Added During Execution)
