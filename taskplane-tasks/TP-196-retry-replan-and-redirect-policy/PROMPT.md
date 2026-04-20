# Task: TP-196 - Retry, Replan, and Redirect Policy

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Policy/spec task focused on making recovery smarter than repeated retries. High operator value with low implementation risk in this packet because it is deliberately policy-first.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/TP-196-retry-replan-and-redirect-policy/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define a policy for when Taskplane should recommend:
- retrying,
- retrying only after a narrow fix,
- redirecting the current task,
- replanning/splitting the task,
- or halting because the current packet should not proceed as written.

The policy should encode practical engineering judgment rather than blindly assuming the current task packet is always the right plan.

## Dependencies

- **TP-193** — Failure taxonomy and decision matrix
- **TP-194** — Recovery report schema and supervisor integration

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/recovery-decision-matrix.md`
- `docs/specifications/operator-console/recovery-supervisor-integration.md`
- representative failed task packets and summaries from recent runs

## Environment

- **Workspace:** `docs/specifications/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/recovery-retry-replan-policy.md` (new)
- `docs/specifications/operator-console/recovery-redirect-examples.md` (new)

## Steps

### Step 0: Preflight

- [ ] Review the failure taxonomy and decision matrix
- [ ] Identify common cases where retries waste time
- [ ] Identify common cases where the right answer is a pivot or task split

### Step 1: Retry policy

Create `docs/specifications/operator-console/recovery-retry-replan-policy.md` with:
- [ ] Conditions for direct retry
- [ ] Conditions for retry only after a narrow repair
- [ ] Conditions where retry is strongly discouraged
- [ ] Distinction between flaky implementation, deterministic failure, and planning mismatch

### Step 2: Replan and redirect policy

In the same file, define:
- [ ] Conditions for redirecting the task within its existing scope
- [ ] Conditions for splitting a task into follow-up packets
- [ ] Conditions where the current packet should stop and be replanned
- [ ] Conditions where docs/spec review should precede implementation

### Step 3: Concrete examples

Create `docs/specifications/operator-console/recovery-redirect-examples.md` with:
- [ ] Examples of retry, retry-after-fix, redirect, split-task, and replan outcomes
- [ ] Examples tied to repo-state mismatch, stale docs, flaky tests, and failed assumptions
- [ ] Operator-facing language examples for each recommendation type

### Step 4: Verification & Delivery

- [ ] Verify the policy supports real engineering pivots rather than only mechanical retries
- [ ] Verify the recommendations remain conservative and explainable
- [ ] Log open questions or categories needing operational data

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/recovery-retry-replan-policy.md` (new)
- `docs/specifications/operator-console/recovery-redirect-examples.md` (new)

**Check If Affected:**
- `docs/reference/commands.md` — only if future operator-facing controls should reflect the policy explicitly

## Completion Criteria

- [ ] Retry vs redirect vs replan decisions are clearly distinguished
- [ ] The policy reflects practical engineering judgment
- [ ] Examples make the policy easy to apply
- [ ] Blind retry loops are explicitly discouraged

## Git Commit Convention

- **Step completion:** `docs(TP-196): complete Step N — description`
- **Hydration:** `hydrate: TP-196 expand Step N checkboxes`

## Do NOT

- Implement automated retry heuristics in this task
- Assume every failed task needs a new packet immediately
- Treat redirect/replan as a synonym for giving up
- Ignore the need for conservative operator-visible reasoning

---

## Amendments (Added During Execution)
