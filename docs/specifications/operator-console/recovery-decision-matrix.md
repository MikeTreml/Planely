# Recovery Decision Matrix

## Status

Draft for TP-193.

## Purpose

Translate the recovery failure taxonomy into operator-usable decisions. This matrix answers four questions for each failure class:
- what action is safest now,
- what evidence should raise or lower confidence,
- who owns the next move,
- when task-level recovery should stop and redirect to a wider fix.

## Decision Priorities

1. Preserve operator clarity and evidence quality.
2. Prefer the smallest safe action that increases confidence.
3. Avoid blind retries when the packet, repo state, or runtime context is suspect.
4. Escalate from task-level handling to batch-level handling only when repeated or shared failures justify it.

## Immediate Actions by Failure Class

| Failure class | Primary signals | Immediate action | Default owner | Avoid |
|---|---|---|---|---|
| Implementation failure | Wrong or incomplete diff, targeted tests fail in changed area, reviewer identifies concrete logic defect | Fix the implementation, rerun targeted verification, then resume normal task flow | Worker with reviewer feedback | Repeating the same retry without changing code |
| Flaky implementation | Same task alternates between pass/fail under unchanged inputs | Stabilize the implementation or isolate nondeterminism before trusting another retry | Worker, with supervisor awareness if repeats | Treating a lucky pass as proof the issue is gone |
| Test failure | Verification fails reproducibly against the expected contract | Correct the behavior or test-follow-through, rerun the relevant test scope, then continue | Worker | Declaring done based on code inspection alone |
| Merge verification failure | Lane passes but merge-time verification fails | Inspect merge logs, compare lane vs merged environment, repair verification assumptions or integration issue before rerun | Supervisor or maintainer, depending on cause | Re-running merge unchanged when the merged environment is clearly different |
| Repo-state issue | Missing expected files, stale snapshot, wrong checkout/tree state | Repair or refresh the lane/worktree/repo state before asking for more implementation | Supervisor or operator | Inventing replacement content for files that should already exist |
| Config issue | Wrong config source, malformed settings, unresolved path roots | Correct the effective configuration or selection path, then rerun the blocked action | Operator, maintainer, or supervisor depending on scope | Treating configuration drift as a code bug |
| Stale-doc or spec mismatch | Packet cites stale/missing/non-authoritative docs or files | Stop execution on the current packet, repair or archive stale references, and re-ground the work | Packet author, maintainer, or operator | Continuing with fabricated assumptions |
| Planning mismatch | Packet bundles incompatible concerns or wrong owner/scope | Re-scope, split, or redirect the work before more execution | Operator or packet author | Forcing a worker to solve planning and implementation in one opaque retry |
| Orchestrator or runtime issue | Discovery, spawn, resume, review routing, or telemetry fails independent of task content | Investigate runtime health and shared control-plane evidence before retrying tasks | Supervisor or maintainer | Blaming individual packets for control-plane failures |

## Retry, Retry-After-Fix, Redirect, and Replan Conditions

### Choose **Retry** only when all of these are true
- the packet is still valid and grounded in current repo truth,
- the repo/worktree/config/runtime context is healthy,
- the failure appears transient or nondeterministic,
- the previous attempt produced some confidence that the same work should succeed unchanged,
- a repeated attempt will generate new evidence rather than just consume another cycle.

Typical matches: intermittent flaky behavior after the likely cause is isolated, transient subprocess hiccup with otherwise healthy context, or a one-off worker interruption that did not leave broken state.

### Choose **Retry after fix** when a bounded correction is known first
Use this when the next step is clear and local, such as:
- wrong or incomplete implementation,
- reproducible test failure tied to the changed area,
- a repairable repo-state problem like stale checkout or missing expected snapshot content,
- a concrete config correction that unblocks the same packet.

Rule: if you can name the specific fix required before confidence improves, do not call it plain retry.

### Choose **Redirect** when the current owner is wrong
Redirect instead of retry when:
- the failure belongs to docs maintenance, repo hygiene, config ownership, or runtime maintenance,
- the worker cannot safely repair the prerequisite without crossing role boundaries,
- a maintainer or operator must make the next decision before execution can continue,
- the failure affects multiple packets and no longer belongs inside one task’s recovery loop.

### Choose **Replan** when the packet should not proceed as written
Replan when:
- packet grounding is stale or contradictory,
- the packet scope mixes diagnosis, repair, and implementation unsafely,
- repeated attempts reduce confidence in the packet itself rather than the implementation,
- the requested work is no longer the right unit of execution.

A replan recommendation should explicitly say what assumption broke and what new packet boundary would be safer.

## Skip and Split-Task Conditions

### Choose **Skip** only with explicit justification
Skipping is appropriate when:
- the task is blocked by an upstream failure and executing it now adds no new evidence,
- the task has become irrelevant because the batch direction or owning artifact changed,
- the task packet is superseded by a clearer follow-up and keeping it active would create duplicate or misleading work,
- the operator intentionally preserves throughput while documenting why the current packet will not run.

Do not use skip as a disguised retry budget reset. A skip recommendation must state whether the skipped work is deferred, superseded, or intentionally abandoned.

### Choose **Split task** when one packet contains multiple recovery owners or phases
Split the task when:
- repo repair must happen before implementation can be meaningfully attempted,
- stale docs/spec repair and product implementation are both required but should be separately reviewable,
- a packet combines investigation, design, and code delivery in a way that hides whether progress is real,
- one sub-problem can proceed while another needs a different owner or longer-lived follow-up.

Typical split pattern:
1. create a repair or grounding packet,
2. complete the prerequisite,
3. re-run or restage the implementation packet against the repaired truth.

## Doc-Drift and Planning-Mismatch Handling

### Recommend doc archive/review instead of more implementation when
- the packet cites docs or specs that are missing from the execution snapshot,
- referenced commands, directories, or APIs no longer exist,
- current code and cited docs disagree strongly enough that the worker would have to guess which is authoritative,
- the right recovery is to mark stale material as superseded, repair the docs, or refresh packet grounding before continuing.

In these cases, the output should say **do not proceed with current packet unchanged** and name whether the next action is archive stale assumptions, review/update the docs, or issue a replacement packet.

### Treat planning mismatch separately from doc drift when
- the source material is real and current, but the packet bundles the wrong concerns,
- the failure is mainly ownership or sequencing confusion rather than stale references,
- the work should be decomposed into prerequisite repair plus follow-on delivery,
- the packet’s success criteria no longer match the safest unit of execution.

The matrix should prefer replan or split-task here, not documentation archive, unless stale grounding is also present.

## Batch-Level Pause, Abort, and Restart Triggers

### Recommend **Pause batch** when
- multiple task failures appear related but the shared cause is not yet proven,
- a repo-state, config, or runtime issue may affect additional lanes if execution continues,
- operator review is needed before more tasks consume the same bad assumptions,
- a failing task suggests that dependent packets may be grounded in stale information.

Pause is the default batch-level escalation when more evidence is needed and continuing execution could amplify confusion or wasted work.

### Recommend **Abort batch** when
- the execution context is not trustworthy enough to continue safely,
- control-plane failures prevent reliable status, merge, or resume behavior,
- packet grounding across the batch is broadly invalid,
- continuing would likely produce fabricated, duplicated, or unrecoverable work.

Abort is stronger than pause: use it when the current run should be considered unsound, not merely uncertain.

### Recommend **Restart batch** when
- a known one-time repair has restored healthy repo/config/runtime state,
- the previous run failed because of a shared execution-context problem rather than per-task implementation defects,
- the operator wants a clean rerun with corrected prerequisites and preserved lessons from the failed attempt,
- evidence suggests tasks can now execute under materially different, healthier conditions.

Restart should name the prerequisite repair that changed the environment; otherwise it risks becoming a blind retry at batch scale.

## Escalation Thresholds

Escalate from task-level recovery to batch-level action when one or more of these are true:
- the same non-implementation failure class appears across multiple tasks,
- repeated retries on different packets fail without changing the underlying evidence,
- supervisor summaries or diagnostics implicate shared runtime, merge, repo-state, or config conditions,
- operators can no longer trust whether failures are local or systemic.
