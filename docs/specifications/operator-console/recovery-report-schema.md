# Recovery Report Schema

## Status

Draft for TP-194.

## Purpose

Define the contract for Recovery / Helpdesk investigation output so the same incident report can be:
- read quickly by an operator or supervisor,
- relayed safely in supervisor summaries,
- consumed by future automation without scraping prose, and
- kept bounded enough that reports stay consistent across incidents.

This document defines the **report payload**, not when it is invoked or what the supervisor may do with it. Invocation and relay behavior are covered in `recovery-supervisor-integration.md`.

## Design Principles

1. **One report, two audiences.**
   Each investigation produces one canonical report with both human-readable markdown and machine-readable JSON views.

2. **Structured first for decisions, narrative for judgment.**
   Classification, action, owner, approval boundary, and task linkage must be explicit fields. Evidence explanation and reasoning may remain prose.

3. **Evidence before recommendation.**
   Recommendations must be traceable to observed artifacts, not just inferred diagnosis.

4. **Do-not-proceed must be explicit.**
   Reports must say plainly whether the current task or batch should continue unchanged.

5. **Support local and systemic outcomes.**
   A report may recommend both a one-time recovery action and a separate recurring-fix follow-up.

6. **Partial certainty is valid.**
   Confidence and competing hypotheses should be captured without forcing false precision.

## Canonical Output Forms

Every completed investigation should be renderable as both:

1. **Markdown report** — operator/supervisor-facing narrative artifact.
2. **JSON report** — structured projection of the same findings for dashboards, supervisor logic, and future automation.

The markdown report is the human source for review and audit. The JSON report is the stable field contract for programmatic use. Both should describe the same incident and share the same identifiers.

## Shared Identity Envelope

Both forms should carry these identity fields:
- `reportVersion` — schema version for the recovery report contract
- `reportId` — unique report identifier
- `createdAt` — ISO timestamp
- `scope` — `task`, `lane`, `batch`, or `integration`
- `subject` — stable references such as `taskId`, `batchId`, `laneNumber`, `waveIndex`, `runId`
- `requestedBy` — who or what asked for the investigation (`operator`, `supervisor`, or future explicit actor ID)
- `investigator` — helpdesk/recovery role identity

## Markdown Report Contract

The markdown view should use a predictable section order so operators can scan it and supervisors can quote or summarize it consistently.

### Required section order

```md
# Recovery Report: <reportId>

## Incident
- Scope:
- Subject:
- Requested by:
- Created at:
- Current status:

## Summary
<2-5 sentence operator-readable summary>

## Classification
- Primary class:
- Competing classes:
- Confidence:
- Do not proceed unchanged:

## Evidence
- Observed artifacts:
- Key facts:
- Missing evidence:

## Cause Analysis
- Immediate cause:
- Root cause:

## Recommendation
- Immediate action:
- Owner:
- Approval requirement:
- Why not plain retry:

## Recovery Plan
- One-time recovery:
- Recurrence prevention:
- Suggested follow-up tasks:

## Risks and Boundaries
- Risk/autonomy level:
- Unsafe actions excluded:
- Notes for supervisor relay:

## Stale Docs / Spec Candidates
- None
```

### Markdown section expectations

#### `Incident`
Must anchor the report to the affected subject and runtime moment.

#### `Summary`
Short narrative for humans. This is the only section that should read like a compact incident brief.

#### `Classification`
Must expose stable decision fields that future automation can mirror exactly.

#### `Evidence`
Should cite concrete artifacts such as STATUS, review files, supervisor summaries, logs, merge verification output, config files, or packet references.

#### `Cause Analysis`
Must separate:
- **immediate cause** — the direct blocker right now
- **root cause** — the deeper underlying reason if known

#### `Recommendation`
Must state the single best next action, the owner, whether approval is required, and why lower-quality alternatives were rejected.

#### `Recovery Plan`
Must distinguish one-time incident handling from recurrence-prevention or follow-up work.

#### `Risks and Boundaries`
Must preserve the line between advisory output and autonomous execution.

#### `Stale Docs / Spec Candidates`
Optional in content, but the section should exist so doc drift can be surfaced consistently.

## JSON Contract

The structured form should project the same content into explicit fields.

```json
{
  "reportVersion": 1,
  "reportId": "RR-2026-04-20-001",
  "createdAt": "2026-04-20T20:45:00Z",
  "scope": "task",
  "subject": {
    "taskId": "TP-182",
    "batchId": "20260420T094622",
    "laneNumber": 1,
    "waveIndex": 1
  },
  "requestedBy": {
    "kind": "supervisor"
  },
  "investigator": {
    "kind": "helpdesk"
  },
  "incident": {
    "title": "Prompt-scoped files missing from lane snapshot",
    "currentStatus": "blocked",
    "affectedTasks": ["TP-182"]
  },
  "summary": "The task appears blocked by stale or incomplete lane state rather than a worker implementation miss.",
  "classification": {
    "primary": "repo-state issue",
    "competing": ["stale-doc or spec mismatch"],
    "confidence": "medium",
    "riskAutonomyLevel": "advisory_only",
    "doNotProceedUnchanged": true
  },
  "evidence": {
    "artifacts": [
      {
        "kind": "supervisor_summary",
        "path": ".pi/supervisor/treml-20260420T094622-summary.md",
        "summary": "Lane escalation cites missing files in snapshot"
      }
    ],
    "facts": [
      "Lane snapshot is missing prompt-scoped implementation files.",
      "Supervisor instructed worker not to fabricate missing content."
    ],
    "missingEvidence": [
      "Fresh comparison of lane tree against canonical repo HEAD"
    ]
  },
  "cause": {
    "immediate": "Lane checkout is incomplete for files expected to pre-exist.",
    "root": "Worktree or snapshot integrity drift is more likely than a code defect."
  },
  "recommendation": {
    "action": "retry_after_fix",
    "owner": "supervisor",
    "approvalRequired": false,
    "reason": "Refreshing the lane tree is the smallest safe action that increases confidence.",
    "whyNotAlternatives": [
      "Plain retry would reuse the same incomplete tree.",
      "Worker-side fabrication would create false progress."
    ]
  },
  "recovery": {
    "oneTimeRecovery": "Refresh or restage the lane checkout, then rerun the task.",
    "recurrencePrevention": "Add snapshot integrity preflight checks for prompt-scoped files.",
    "suggestedFollowUpTasks": [
      {
        "title": "Add lane snapshot integrity validation",
        "owner": "maintainer",
        "scope": "runtime"
      }
    ]
  },
  "boundaries": {
    "unsafeActionsExcluded": [
      "Fabricating missing implementation files",
      "Automatically rewriting the packet without operator review"
    ],
    "supervisorRelayNotes": "Relay as probable repo-state issue and advise against continuing unchanged until checkout integrity is restored."
  },
  "staleDocCandidates": []
}
```

## Required Fields

The following fields are required in every recovery report, regardless of incident class.

### Identity and scope
- `reportVersion`
- `reportId`
- `createdAt`
- `scope`
- `subject`
- `requestedBy`
- `investigator`

### Incident framing
- `incident.title`
- `incident.currentStatus`
- `summary`

### Diagnosis
- `classification.primary`
- `classification.riskAutonomyLevel`
- `classification.doNotProceedUnchanged`
- `evidence.artifacts` or `evidence.facts` (at least one must be non-empty)
- `cause.immediate`
- `cause.root`

### Recommendation and recovery
- `recommendation.action`
- `recommendation.owner`
- `recommendation.approvalRequired`
- `recommendation.reason`
- `recovery.oneTimeRecovery`
- `recovery.recurrencePrevention`

## Optional Fields

These fields are valuable when evidence supports them, but they should not be fabricated.

- `classification.competing`
- `classification.confidence`
- `incident.affectedTasks`
- `evidence.missingEvidence`
- `recommendation.whyNotAlternatives`
- `recovery.suggestedFollowUpTasks`
- `staleDocCandidates`
- `boundaries.supervisorRelayNotes`

## Field Semantics

### `classification.primary`
Should use the taxonomy from `recovery-failure-taxonomy.md` so reports stay consistent with the decision matrix.

### `classification.riskAutonomyLevel`
Should normalize whether the output is:
- `informational`
- `supervisor_safe`
- `operator_approval_required`
- `advisory_only`

This field is not permission to execute; it is a routing and boundary signal.

### `recommendation.action`
Should come from a bounded action vocabulary such as:
- `retry`
- `retry_after_fix`
- `redirect`
- `replan`
- `split_task`
- `pause_batch`
- `abort_batch`
- `restart_batch`
- `skip`

### `recommendation.owner`
Should name the next responsible role:
- `worker`
- `supervisor`
- `operator`
- `maintainer`
- `packet_author`

### `recommendation.approvalRequired`
Must indicate whether explicit operator approval is required before acting on the recommendation.

## Human vs Machine Responsibilities

### Must be structured
These fields should never require prose parsing:
- identifiers and scope
- primary classification
- confidence when available
- immediate action
- owner
- approval requirement
- risk/autonomy level
- do-not-proceed flag
- follow-up task metadata when proposed
- stale-doc candidate list when present

### May remain narrative
These fields are better as concise prose:
- operator-facing summary
- evidence explanation
- cause reasoning
- why alternatives are lower quality
- supervisor relay notes

## Consistency Rules

1. Markdown and JSON must not disagree on classification, action, owner, or approval requirement.
2. If confidence is omitted, the narrative must not imply certainty.
3. If `doNotProceedUnchanged` is `true`, the recommendation must not be plain `retry`.
4. If a follow-up task is proposed, it must be clearly separate from the immediate incident action.
5. Empty optional sections should be rendered as explicit `None`/`[]` rather than omitted silently when that would confuse operators.

## Minimum Acceptance Test for Future Implementations

A future implementation of the report writer should be considered correct only if it can produce a report that lets a reviewer answer, without guessing:
- what failed,
- what class best explains it,
- what evidence supports that claim,
- whether the current packet should continue unchanged,
- what action should happen next,
- who owns that action,
- whether operator approval is required, and
- whether there is a separate systemic follow-up recommendation.
