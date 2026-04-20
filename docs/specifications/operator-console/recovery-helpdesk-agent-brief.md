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
