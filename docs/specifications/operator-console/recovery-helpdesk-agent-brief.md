# Recovery / Helpdesk Agent Product Brief

## Status

Draft for TP-192.

## Purpose

Define a bounded Recovery / Helpdesk Agent role for Taskplane that helps operators and supervisors understand why a task, lane, or batch failed and what kind of recovery action is appropriate.

The role exists to improve recovery quality, not to introduce a second autonomous executor. It should diagnose failures, classify likely causes, and recommend safe next actions such as retry, redirect, or replan.

## Problem Statement

Taskplane already supports observable execution, resumability, reviews, and operator intervention, but failure handling still risks collapsing into a simplistic loop of “retry the task and hope it works next time.” That approach is insufficient because many failures are not transient worker mistakes.

Examples from recent operator-facing incidents include:
- stale or incomplete lane checkouts that make files appear missing even when the source repo is intact,
- repo-state mismatches between packet assumptions and the actual worktree,
- post-merge verification mismatches such as environment or directory expectations diverging from the merged tree, and
- stale docs or spec assumptions that make the packet itself no longer valid as written.

In those cases, blind retry wastes time, obscures the real issue, and can amplify operator confusion. Operators need a recovery-oriented specialist that can help answer a more precise set of questions:
- Is this a transient retryable problem, or evidence that the packet should not proceed unchanged?
- Is the failure caused by implementation quality, repo state, config drift, stale planning assumptions, or orchestration context?
- Should the next action be retry, targeted fix then retry, redirect to a different task, or replan the work entirely?

The Recovery / Helpdesk Agent is the product layer that provides that diagnostic framing.

## Target Users and Personas

### Primary persona: operator
A hands-on operator supervising Taskplane runs who needs to decide whether to retry, pause, redirect, skip, or replan after a failure or suspicious result.

Core needs:
- understand the probable class of failure,
- see a bounded recommendation for the safest next move,
- avoid wasting cycles on retries that cannot succeed as written.

### Secondary persona: supervisor
A runtime coordinator responsible for active lanes, escalations, merge progress, approvals, and operator visibility.

Core needs:
- quickly distinguish worker-level implementation failures from environment, repo, or packet problems,
- decide when to ask for a focused retry versus when to redirect or revise the task packet,
- preserve clear accountability without turning the supervisor into an ad hoc forensic analyst for every failure.

### Tertiary persona: maintainer
A person responsible for the repo, docs, scaffolding, or system policies that shape whether packets are valid and runnable.

Core needs:
- identify recurring failure modes that indicate stale docs, missing guardrails, weak templates, or policy gaps,
- convert one-off incidents into reusable fixes or follow-up tasks.

## Failure Classes the Helpdesk Should Address

The helpdesk should help classify and recommend action for failures such as:
- transient execution issues where retry is plausible,
- worker implementation mistakes that likely need a code or document fix before retry,
- repo-state or worktree mismatches where the snapshot, checkout, or merge context is suspect,
- packet validity issues where instructions reference missing, stale, or contradictory artifacts,
- configuration or environment mismatches that prevent correct execution or verification,
- repeated incidents that indicate a recurring systemic issue rather than a one-off failure.

## Failure Classes the Helpdesk Should Not Own

The helpdesk should not become the owner of:
- performing the implementation fix itself as a default behavior,
- replacing reviewers, supervisors, or operators in final decision-making,
- broad architectural redesign unrelated to the incident at hand,
- speculative root-cause claims unsupported by available artifacts,
- silent mutation of code, packets, git state, or remote systems.

## Why Diagnostic-First Behavior Is Required

The Recovery / Helpdesk Agent must be diagnostic-first rather than auto-fix-first because Taskplane’s reliability depends on recoverability, operator clarity, and explicit authority boundaries.

A diagnostic-first posture is required for four reasons:

1. **Many failures are category errors, not fixable defects.**
   If a task packet is based on stale assumptions, the right answer may be to stop and rewrite the packet, not to push the worker harder.

2. **The same symptom can imply very different recovery actions.**
   A missing file may indicate a worker omission, a stale lane checkout, a merge verification mismatch, or bad packet grounding. Choosing the right response requires classification before action.

3. **Unsafe autonomy would hide important operator decisions.**
   If the helpdesk immediately edits files, commits changes, or retries silently, operators lose the chance to validate whether the recommended direction is actually appropriate.

4. **Recurring incidents should produce reusable policy learning.**
   The value of the helpdesk is not only fixing one run, but also spotting patterns that should become better templates, packet rules, repo hygiene, or recovery guidance.

The role should therefore begin with evidence gathering, failure classification, confidence-qualified recommendations, and explicit statements about whether the current packet should proceed as written.

## Core Responsibilities

The Recovery / Helpdesk Agent should provide a bounded specialist function with five core responsibilities:

1. **Diagnose**
   - inspect task packets, STATUS history, review artifacts, supervisor summaries, diagnostic reports, and relevant repo context,
   - identify the most likely failure category and the evidence supporting that classification.

2. **Classify**
   - distinguish transient execution issues from implementation defects, repo/worktree problems, stale packet assumptions, config mismatches, and recurring systemic issues,
   - state confidence and unresolved ambiguity rather than overclaiming certainty.

3. **Recommend**
   - propose the safest next action, such as retry, fix-then-retry, update packet, redirect to a different owner, split work, or stop execution,
   - explain why alternative actions are lower quality or higher risk.

4. **Redirect**
   - identify when the problem belongs with a different role or workflow, such as the operator, supervisor, maintainer, merge flow, repo hygiene, or documentation maintenance,
   - recommend the correct destination rather than keeping recovery trapped inside the failing packet.

5. **Replan**
   - recognize when the current task packet should be revised, decomposed, or replaced because its assumptions are no longer valid,
   - suggest what kind of follow-on task or policy update should be created.

## Non-Goals and Hard Boundaries

The Recovery / Helpdesk Agent must remain tightly bounded.

It is explicitly not responsible for:
- broad autonomous fixing across the repo,
- silently editing code or docs as its default recovery path,
- creating hidden commits, pushes, or branch mutations,
- bypassing supervisor, operator, or review approvals,
- acting as a replacement runtime controller for batches, lanes, or merge flows,
- inventing unsupported root causes or remediation steps beyond available evidence.

Safety rule: recommendations may include optional operator-approved actions, but the helpdesk itself should not be defined as an invisible fixer that mutates repository state in the background.

## Relationship to the Supervisor

The supervisor remains the runtime coordination authority.

The helpdesk should be positioned as a **consulted specialist**, not a replacement supervisor.

### Supervisor responsibilities remain:
- coordinating active execution,
- handling lane state, merge flow, approvals, and operator communications,
- deciding whether to pause, resume, retry, skip, or integrate,
- preserving overall batch progress and recoverability.

### Helpdesk responsibilities add:
- deeper diagnostic framing when a failure is ambiguous,
- structured recovery recommendations with evidence,
- incident classification that distinguishes retryable failures from redirect or replan cases,
- pattern spotting that can inform future policy or template improvements.

This division preserves a clear operational model: the supervisor runs the operation, while the helpdesk advises on the safest recovery path when normal execution logic is not enough.

## One-Time Fix vs Recurring-Fix Recommendation Pattern

The helpdesk should distinguish between two kinds of recommendations.

### One-time fix recommendation
Used when the incident appears local and specific.

Typical outputs:
- fix the missing file, then rerun,
- repair the lane checkout and resume,
- correct a bad packet reference and restart the task,
- update a single config assumption before re-verifying merge.

The goal is to restore progress for one concrete incident without implying a broader product or policy change.

### Recurring-fix recommendation
Used when the incident reveals a pattern likely to recur.

Typical outputs:
- create a follow-up task to harden packet validation,
- add a repo preflight check for incomplete lane checkouts,
- update stale operator-console docs or planning specs,
- improve merge verification rules or worktree repair guidance,
- refine templates or supervisor playbooks so the same class of failure is caught earlier.

The goal is to convert repeated operator pain into durable process, documentation, or product improvements.

Both output types are important. A single incident may need an immediate local recovery recommendation and a separate recurring-fix recommendation for maintainers.

## Example Incident Classes and Expected Outcomes

### 1. Worker implementation defect
**Incident:** A task completes with failing targeted tests because the worker changed the wrong code path.

**Helpdesk outcome:**
- classify as implementation-quality failure,
- recommend targeted fix then retry,
- avoid escalating to packet rewrite unless repeated failures show the task itself is underspecified.

### 2. Missing file in a lane snapshot
**Incident:** A worker reports that a referenced file is absent in the lane worktree, but the source repo indicates the file should exist.

**Helpdesk outcome:**
- classify as probable checkout or snapshot integrity issue rather than immediate worker failure,
- recommend repairing or refreshing the lane/worktree before retry,
- advise against inventing replacement content for the missing file.

### 3. Post-merge verification mismatch
**Incident:** Merge succeeds but post-merge verification fails because expected directories or artifacts are not present in the merged environment.

**Helpdesk outcome:**
- classify as merge-environment or verification-assumption mismatch,
- recommend investigating verification inputs or repo structure before rerunning the same merge,
- create a recurring-fix follow-up if merge validation rules are too brittle.

### 4. Stale doc or spec grounding
**Incident:** A task packet references architecture or command docs that no longer exist in the execution snapshot or are no longer accurate.

**Helpdesk outcome:**
- classify as stale packet grounding or stale documentation,
- recommend updating the packet, redirecting to documentation repair, or splitting the task,
- explicitly advise that execution should not continue unchanged when the packet’s cited truth is broken.

### 5. Repeated ambiguous failures across tasks
**Incident:** Several packets in a batch fail for similar reasons tied to repo hygiene, config drift, or missing guardrails.

**Helpdesk outcome:**
- classify as recurring systemic issue,
- recommend pausing local retries and opening a follow-up policy or infrastructure task,
- suggest batch-level redirect or replan rather than repeated per-task retries.

## Example Recommendations

The helpdesk’s recommendation vocabulary should stay concrete and bounded. Examples include:
- **Retry** — when evidence points to a transient failure with unchanged packet validity.
- **Retry after fix** — when a local code, doc, config, or packet correction is clearly needed first.
- **Replan** — when the task packet is no longer valid, grounded, or scoped correctly.
- **Split task** — when the packet bundles diagnosis, repo repair, and implementation into one unsafe unit.
- **Redirect to docs or repo hygiene work** — when the main problem is stale reference material or broken execution assumptions.
- **Commit missing tree then restart** — only as an operator-directed recovery when the diagnosis shows local uncommitted or unstaged repository state is the blocker and the action should be explicit, reviewable, and not silent.
- **Do not proceed with current packet** — when continuing would likely produce fabricated work, repeated failure, or misleading output.

## Redirect and Replan Guidance

A key product requirement is that the helpdesk may recommend *not proceeding* with the current task packet.

That recommendation should be explicit when:
- the packet depends on stale or contradictory source material,
- the lane or repo state is too suspect to trust current evidence,
- the task should be decomposed into separate repair and implementation tasks,
- the right owner is a maintainer or operator rather than the currently assigned worker,
- repeated retries would consume time without increasing confidence.

This is the main difference between a recovery specialist and a retry button. The helpdesk adds value by identifying when the correct action is redirect, re-scope, or stop.

## Safety and Boundedness Rules for Recommendations

Recommendations should remain conservative, auditable, and easy for operators to evaluate.

They should therefore:
- cite the evidence they rely on,
- distinguish observed facts from hypotheses,
- name the owner of the recommended next action,
- prefer the smallest safe intervention that restores clarity,
- avoid silent repository mutation, hidden commits, or remote-side actions,
- avoid turning every incident into a broad autonomy expansion request.

The product should optimize for better recovery decisions, not for making the helpdesk look maximally powerful.

## Follow-On Implementation and Policy Tasks

This brief implies several follow-on tasks that should be planned separately from the brief itself:

1. **Incident intake and evidence model**
   - Define what artifacts the helpdesk can inspect by default, such as STATUS, review files, supervisor summaries, merge diagnostics, and packet metadata.

2. **Recovery recommendation contract**
   - Define a structured output format for diagnosis, confidence, owner, recommended action, and “do not proceed” outcomes.

3. **Supervisor and operator workflow integration**
   - Decide where helpdesk recommendations appear in the Operator Console, approvals flows, and supervisor recovery timeline.

4. **Escalation and redirect policy**
   - Define when helpdesk advice should route to supervisor, maintainer, or packet-author follow-up instead of worker retry.

5. **Recurring-incident capture**
   - Define how repeated helpdesk findings become policy updates, template hardening, repo hygiene tasks, or documentation fixes.

## Open Questions

- Should the helpdesk be invoked manually by the operator/supervisor first, or automatically on selected failure classes with human-visible output?
- What minimum evidence bundle is required before the helpdesk is allowed to make a redirect or replan recommendation?
- Which recommendations, if any, should be directly actionable in the Operator Console versus remaining advisory only?
- How should recurring failure classes be normalized so the system can distinguish one-off incidents from policy-level problems?
- What guardrails are required if future tasks allow tightly scoped operator-approved fixes after diagnosis?

## Acceptance Signal

This brief is successful if future implementation tasks can use it to build a recovery specialist that:
- improves operator decision quality after failures,
- distinguishes retry, fix, redirect, and replan paths clearly,
- preserves the supervisor as runtime authority,
- keeps autonomy conservative and explicit.
