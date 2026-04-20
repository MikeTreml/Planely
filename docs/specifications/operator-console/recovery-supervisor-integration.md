# Recovery Supervisor Integration

## Status

Draft for TP-194.

## Purpose

Define when the supervisor should invoke the Recovery / Helpdesk role, what evidence bundle it should provide, how the resulting recommendation should be relayed, and where autonomy must stop pending explicit operator approval.

This document treats the helpdesk as a **consulted specialist**. The supervisor remains the runtime coordination authority for active execution, lane control, merge flow, operator communications, and approval handling.

## Design Principles

1. **Escalate for ambiguity, not for every failure.**
   The helpdesk should be invoked when classification is unclear, recovery options have meaningful tradeoffs, or the incident may indicate stale packet or runtime truth.

2. **Supervisor owns routing; helpdesk owns diagnosis.**
   The supervisor decides whether to call for investigation and how to apply the result. The helpdesk produces evidence-backed recommendations.

3. **No silent mutation from diagnostic output.**
   A helpdesk recommendation may inform supervisor action, but it must not directly mutate code, packets, git state, or batch control without an allowed, explicit follow-through path.

4. **Operator clarity beats maximal automation.**
   The supervisor should translate reports into compact operator-facing summaries without hiding confidence, approval boundaries, or do-not-proceed flags.

5. **Redirect and replan are first-class outcomes.**
   The integration must support recommendations that say the current task should not continue as written.

## Roles and Responsibilities

### Supervisor responsibilities remain
- detect failures, stalls, and escalations in active execution,
- collect the minimum evidence bundle,
- invoke helpdesk when normal recovery logic is insufficient,
- decide whether to pause, retry, skip, redirect, or escalate to the operator,
- preserve audit history in supervisor artifacts and task/batch state.

### Helpdesk responsibilities add
- classify the likely failure mode,
- explain the evidence and uncertainty,
- recommend the safest next action,
- identify whether the issue is local, systemic, or packet-invalidating,
- recommend follow-up work when recurrence prevention is warranted.

## Trigger Conditions for Invoking Helpdesk

The supervisor should invoke helpdesk when one or more of these conditions are true.

### 1. Classification is ambiguous
Examples:
- missing files could be worker omission, stale lane snapshot, or stale packet grounding,
- merge-time failure could reflect integration assumptions or bad repo state,
- repeated failure could be implementation quality, config drift, or runtime instability.

### 2. The recommended next action is not obvious
Invoke helpdesk when the supervisor cannot safely choose between:
- retry,
- retry after fix,
- redirect,
- replan,
- split task,
- batch-level pause/abort/restart.

### 3. A task may be invalid as written
Examples:
- packet references stale or missing docs,
- source-of-truth artifacts conflict,
- the current packet scope bundles incompatible recovery owners.

### 4. A failure pattern may be systemic
Examples:
- multiple lanes report similar repo-state issues,
- repeated merge verification mismatches suggest verification contract drift,
- multiple tasks fail for the same config or runtime reason.

### 5. A worker escalation indicates bounded authority is exhausted
Examples:
- worker correctly refuses to fabricate missing truth,
- worker documents blocker after multiple attempts,
- reviewer or merge flow evidence implies the packet should not continue unchanged.

## Situations That Usually Do Not Need Helpdesk

The supervisor should usually use normal workflow instead of helpdesk when:
- a straightforward implementation defect is already clear,
- a reproducible test failure points to one local code correction,
- an existing approval or operator decision path already covers the next move,
- a routine transient error can be retried safely without diagnostic ambiguity.

Helpdesk is an escalation aid, not the default wrapper around all failures.

## Invocation Contract

The supervisor should ask for investigation using a bounded intake that includes both explicit questions and concrete evidence references.

### Required intake fields
- `requestId`
- `requestedAt`
- `requestedBy.kind` = `supervisor`
- `scope` = `task` | `lane` | `batch` | `integration`
- `subject` identifiers such as `taskId`, `batchId`, `laneNumber`, `waveIndex`
- `triggerReason` — short explanation of why normal recovery logic is insufficient
- `investigationQuestions` — 1-3 focused questions
- `evidenceBundle` — referenced artifacts and short summaries
- `currentSupervisorIntent` — optional provisional guess if one exists

### Recommended evidence bundle contents
The supervisor should include references to whichever of these exist:
- task `PROMPT.md` and `STATUS.md`
- review artifacts under `.reviews/`
- relevant worker escalation or blocker summaries
- `.pi/supervisor/*.md` summaries
- relevant entries from `.pi/supervisor/actions.jsonl` and `events.jsonl`
- merge diagnostics, lane logs, or verification output
- config or repo-state evidence when those are plausible causes

### Example intake shape

```json
{
  "requestId": "HD-2026-04-20-001",
  "requestedAt": "2026-04-20T21:00:00Z",
  "requestedBy": { "kind": "supervisor" },
  "scope": "task",
  "subject": {
    "taskId": "TP-182",
    "batchId": "20260420T094622",
    "laneNumber": 1
  },
  "triggerReason": "Missing implementation files may reflect stale lane state or stale packet grounding; plain retry is not clearly safe.",
  "investigationQuestions": [
    "What failure class best explains the blocker?",
    "Should the task continue as written after a bounded fix, or should it be redirected/replanned?",
    "Does the recommendation require explicit operator approval?"
  ],
  "evidenceBundle": [
    {
      "kind": "supervisor_summary",
      "path": ".pi/supervisor/treml-20260420T094622-summary.md",
      "summary": "Lane escalation cites missing files in lane snapshot."
    },
    {
      "kind": "task_status",
      "path": "taskplane-tasks/TP-182/.../STATUS.md",
      "summary": "Worker documented repeated blocker without fabricating output."
    }
  ]
}
```

## Helpdesk Response Expectations

The supervisor should expect the response in the recovery report format defined by `recovery-report-schema.md`.

At minimum, the response must answer:
- what class best explains the failure,
- how confident the diagnosis is,
- whether the current packet should proceed unchanged,
- what single next action is recommended,
- who owns that action,
- whether explicit operator approval is required,
- whether a follow-up task or policy action is recommended.

## Supervisor Relay Behavior

The supervisor should not dump the entire report verbatim into operator-facing summaries by default. Instead, it should produce a compact relay that preserves the decision-critical parts.

### Relay format for operator-facing summaries

A supervisor summary or console recommendation should capture:
1. **incident scope** — task/batch/lane/integration target
2. **classification** — primary class and confidence
3. **key evidence** — 1-3 strongest facts
4. **recommended action** — next move only
5. **owner** — who must act next
6. **approval boundary** — whether operator approval is required
7. **do-not-proceed state** — explicit when the current packet should stop unchanged
8. **follow-up recommendation** — optional, kept separate from immediate action

### Example relay summary

```md
Recovery recommendation for TP-182:
- Classification: repo-state issue (medium confidence)
- Evidence: prompt-scoped files are absent from the lane snapshot; supervisor actions already warned against fabricating content
- Recommended action: refresh/restage the lane checkout, then rerun
- Owner: supervisor
- Operator approval: not required for bounded lane repair
- Do not proceed unchanged: yes
- Follow-up: consider a runtime hardening task for snapshot integrity checks
```

### Relay rules

1. The supervisor may shorten the narrative, but must not change:
   - classification,
   - confidence,
   - recommended action,
   - approval requirement,
   - do-not-proceed flag.
2. When uncertainty remains, the relay must mention the competing class or unresolved evidence gap.
3. Follow-up tasks should be listed separately from the immediate action so the operator can distinguish recovery from long-term hardening.

## Approval Boundaries

The helpdesk report is advisory. The supervisor may only act autonomously within explicit low-risk boundaries.

### Supervisor-safe recommendations
These may be executed by the supervisor without additional operator approval when they map to already allowed runtime controls and do not change task intent:
- bounded retry after transient failure,
- bounded retry after clearly local supervisor-owned repair such as refreshing lane state,
- pause for more evidence,
- relay a recommendation without taking action,
- preserve blockers and stop workers from fabricating content,
- route a recommendation to the correct owner without mutating the packet itself.

### Operator-approval-required recommendations
These require explicit operator approval before execution, even if technically possible:
- abandoning or replacing the current packet,
- changing task scope or success criteria,
- splitting a packet into new tasks,
- redirecting ownership across teams or workstreams in a way that changes plan intent,
- batch abort or restart when the operator has not already delegated that authority,
- any action that implies repo mutation outside existing bounded supervisor controls,
- any action that could discard, supersede, or archive existing work.

### Always-advisory-only recommendations
These should never auto-execute directly from helpdesk output:
- rewriting docs/specs/packets automatically,
- editing implementation code as the recovery response,
- creating hidden commits or pushing branches,
- force-merging or bypassing review/approval rules,
- mutating remote systems,
- deciding that a task is complete despite unmet deliverables.

## Redirect and Replan Outcomes

The integration must support cases where helpdesk recommends **not continuing the current task as written**.

### Redirect outcome
Use redirect when the next owner is different but the situation is still well-bounded.

Examples:
- docs maintainer should repair stale references,
- supervisor should repair lane/worktree state,
- maintainer should fix runtime/config issues before rerunning packets.

Supervisor behavior:
- mark the current task as blocked or waiting on the redirected owner,
- relay the new owner clearly,
- avoid presenting redirect as a worker retry,
- preserve the original evidence trail.

### Replan outcome
Use replan when the packet boundary or assumptions are no longer safe.

Examples:
- task packet depends on stale source truth,
- packet combines repo repair and feature delivery unsafely,
- repeated attempts reduce confidence in the packet itself.

Supervisor behavior:
- surface a strong `do not continue current task as written` message,
- stop automatic retry loops,
- request operator review for packet rewrite, replacement, or decomposition.

## Presenting “Do Not Continue Current Task as Written”

When the report says not to continue unchanged, the supervisor should make that state highly visible.

### Required relay elements
- direct statement that the current packet should not continue unchanged,
- concise reason tied to evidence,
- whether the safer next move is redirect, replan, split, pause, or abort,
- what must be repaired or clarified before work can resume.

### Example wording

```md
Do not continue TP-182 as written.
Reason: the packet is currently grounded in execution context that cannot be trusted because prompt-scoped files are absent from the lane snapshot.
Safer next move: repair the lane/worktree state first; if the files remain absent afterward, restage or rewrite the packet against current repo truth.
```

## Follow-Up Task and Packet-Splitting Recommendations

The helpdesk may recommend new follow-up work, but the supervisor should treat follow-up creation as a proposal unless the operator has already delegated that authority.

### When follow-up work should be proposed
- a recurring-fix recommendation is materially different from the one-time recovery,
- the current task should be split into prerequisite repair plus implementation,
- systemic runtime/doc/template hardening is needed outside the current packet,
- the immediate incident should be recovered now, but the root cause needs durable ownership.

### Follow-up recommendation minimum fields
When proposing a follow-up task or split packet, the report should include:
- `title`
- `problemSummary`
- `suggestedOwner`
- `scope` (`docs`, `runtime`, `config`, `packet`, `implementation`, etc.)
- `reasonCurrentTaskShouldNotOwnIt`
- `relationshipToCurrentIncident`

### Supervisor behavior for follow-up proposals
- relay the proposal as recommended future work, not as already-created work,
- separate it from immediate incident handling,
- require operator approval before creating/replacing packets unless existing workflow explicitly delegates creation.

## Unsafe Automation Exclusions

The integration must exclude these behaviors even if a helpdesk report appears confident:
- silent packet rewrites,
- silent task creation or deletion,
- automatic archival/supersession of packets,
- automatic code/doc/config edits,
- automatic branch repair or commit creation beyond existing approved supervisor controls,
- automatic batch abort/restart based solely on narrative text,
- converting a recommendation into action when `approvalRequired` is true.

## Decision Flow Summary

```md
1. Supervisor detects ambiguous or high-stakes recovery situation.
2. Supervisor gathers bounded evidence bundle and asks focused questions.
3. Helpdesk returns a structured recovery report.
4. Supervisor relays a compact summary preserving classification, confidence, action, owner, approval boundary, and do-not-proceed state.
5. Supervisor executes only supervisor-safe actions.
6. Operator approves or rejects higher-impact redirect/replan/follow-up actions.
7. Incident and any follow-up recommendation remain auditable in supervisor/task artifacts.
```

## Open Implementation Prerequisites

Future implementation tasks will need to define:
- where the canonical recovery report file is stored,
- how the supervisor records and links investigation requests,
- whether operator console surfaces recovery reports inline or as linked artifacts,
- how follow-up task proposals map to actual task-creation workflows,
- how structured fields are validated and versioned over time.
