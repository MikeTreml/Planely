# Taskplane Slack Message and Action Contracts

## Status

Draft for TP-186.

## Purpose

Define the first-pass message and interaction contracts for Taskplane's Slack companion.

These contracts are intended to be implementable, conservative, and aligned with the source-of-truth rules established in:
- `slack-companion.md`
- TP-180 Operator Console product and domain docs
- TP-185 planning/storage docs

The goal is not to define every Slack API field. The goal is to define the **Taskplane-level contract** that the Slack integration must preserve when rendering notifications, handling status lookups, and translating lightweight actions back into canonical Taskplane-backed behavior.

## Design Principles

1. **Every contract is scoped to a real subject.**
   Messages and actions should always be about a specific batch, task, approval, or integration event.

2. **Slack payloads are projections.**
   They may include cached display text, but they must point back to canonical identifiers and re-read canonical state before mutating anything.

3. **Compact by default.**
   Slack messages should summarize only the information needed to route attention or support a low-risk decision.

4. **Deep-link for depth.**
   If the operator needs artifacts, history, or broad context, the message should send them to the dashboard.

5. **Idempotent actions are mandatory.**
   Repeated deliveries, repeated button clicks, and stale actions must not create duplicate state transitions.

## Contract Subject Types

All Slack contracts should identify one primary subject type:
- `batch`
- `task`
- `approval`
- `integration`
- `system`

A message may include related subject references, but one primary subject should drive routing and action handling.

## Shared Envelope

Every outbound Slack notification or interactive response should be derivable from a shared Taskplane envelope.

```json
{
  "contractVersion": 1,
  "messageType": "approval_requested",
  "subjectType": "approval",
  "subject": {
    "approvalId": "APR-2026-04-20-001",
    "batchId": "batch-2026-04-20-01",
    "taskId": "TP-186"
  },
  "summary": {
    "title": "Approval needed for TP-186",
    "status": "pending",
    "severity": "attention",
    "text": "Worker requests approval to continue after verification."
  },
  "facts": [
    { "label": "Batch", "value": "batch-2026-04-20-01" },
    { "label": "Task", "value": "TP-186" }
  ],
  "links": {
    "primary": {
      "kind": "approval",
      "href": "/dashboard?approvalId=APR-2026-04-20-001&batchId=batch-2026-04-20-01&taskId=TP-186"
    }
  },
  "actions": [
    { "kind": "approve", "actionId": "approve:APR-2026-04-20-001:v1" },
    { "kind": "reject", "actionId": "reject:APR-2026-04-20-001:v1" }
  ],
  "generatedAt": "2026-04-20T17:10:00Z"
}
```

### Required envelope fields

- `contractVersion` — Taskplane Slack contract version
- `messageType` — notification/response type
- `subjectType` — primary target domain
- `subject` — stable identifiers for the target object
- `summary` — compact operator-facing summary
- `links.primary` — canonical dashboard deep link
- `generatedAt` — when the payload was produced

### Optional envelope fields

- `facts` — compact structured metadata rows
- `actions` — interactive controls if permitted for the subject/state
- `secondaryLinks` — additional deep links
- `delivery` — channel/policy metadata if needed later
- `correlationId` — integration trace ID

## Notification Message Shapes

Slack companion v1 should support these outbound message types.

### 1. `batch_started`

Primary subject: `batch`

Required subject fields:
- `batchId`

Recommended summary fields:
- `status`: `running`
- `title`: concise batch label
- `text`: start summary

Recommended facts:
- task count
- wave count
- started by/operator if available
- repo/project label if relevant

Required link target:
- live batch dashboard view keyed by `batchId`

Actions:
- none in the notification itself by default

### 2. `attention_needed`

Primary subject: `batch` or `task`

Required subject fields:
- `batchId`
- `taskId` when task-scoped

Recommended summary fields:
- `status`: `blocked`, `stopped`, or similar derived state
- `severity`: `attention`
- `text`: compact explanation of why attention is needed

Recommended facts:
- blocking reason
- dependency or approval reference
- current lane/wave when relevant

Required link target:
- task or batch dashboard view depending on the subject

Actions:
- none by default; the operator should inspect in the dashboard unless the blocked state is specifically an approval request

### 3. `approval_requested`

Primary subject: `approval`

Required subject fields:
- `approvalId`
- `batchId` or `taskId` (at least one related execution anchor)

Recommended summary fields:
- `status`: `pending`
- `severity`: `attention`
- `text`: what decision is being requested

Recommended facts:
- decision type
- target task/batch
- requested by
- deadline/expiry if any

Required link target:
- approval-focused dashboard view with related batch/task context

Actions:
- `approve`
- `reject`

### 4. `failure_detected`

Primary subject: `task`, `batch`, or `integration`

Required subject fields:
- relevant stable IDs for the failing subject

Recommended summary fields:
- `status`: `failed`
- `severity`: `critical`
- `text`: first-line failure summary

Recommended facts:
- failing scope
- phase or lane
- exit classification if available
- retry count if relevant for display

Required link target:
- dashboard view that opens failure context for the target subject

Actions:
- none in v1

### 5. `work_completed`

Primary subject: `task` or `batch`

Required subject fields:
- `taskId` or `batchId`

Recommended summary fields:
- `status`: `succeeded` or `completed`
- `severity`: `info`
- `text`: compact completion summary

Recommended facts:
- duration
- task/batch counts
- next step if one is obvious

Required link target:
- task or batch detail/history view

Actions:
- none in v1

### 6. `batch_integrated`

Primary subject: `integration`

Required subject fields:
- `batchId`
- integration target branch or equivalent target identifier when available

Recommended summary fields:
- `status`: `integrated`
- `severity`: `info`
- `text`: integration result summary

Recommended facts:
- integration mode
- target branch
- follow-up link

Required link target:
- historical batch or integration result view

Actions:
- none in v1

## Status Lookup Contracts

Status lookup is a first-class v1 interaction, separate from push notifications.

The Slack integration should support compact lookup responses for:
1. active batch status
2. explicit `batchId` lookup
3. explicit `taskId` lookup

## Lookup request contract

The Taskplane-level normalized request should resolve to:

```json
{
  "contractVersion": 1,
  "requestType": "status_lookup",
  "target": {
    "mode": "batch",
    "batchId": "batch-2026-04-20-01"
  },
  "requestedBy": {
    "slackUserId": "U123",
    "displayName": "Casey"
  },
  "requestedAt": "2026-04-20T17:12:00Z"
}
```

### Lookup target modes

- `active_batch` — no explicit ID; asks for current active batch if present
- `batch` — lookup by `batchId`
- `task` — lookup by `taskId`

## Lookup response contract

All lookup responses should reuse the shared envelope with `messageType: "status_lookup_result"`.

### Required response content

For `active_batch` or `batch` lookups:
- `batchId`
- current phase/status
- overall task counts by outcome where available
- current wave index or equivalent progress pointer if available
- short human-readable summary text
- primary dashboard link

For `task` lookups:
- `taskId`
- derived task status
- current batch association if any
- latest notable timestamp or activity summary if available
- primary dashboard link to task-focused view

### Example batch lookup response

```json
{
  "contractVersion": 1,
  "messageType": "status_lookup_result",
  "subjectType": "batch",
  "subject": {
    "batchId": "batch-2026-04-20-01"
  },
  "summary": {
    "title": "batch-2026-04-20-01",
    "status": "executing",
    "severity": "info",
    "text": "Wave 2 of 3 is running. 5/8 tasks completed."
  },
  "facts": [
    { "label": "Succeeded", "value": "5" },
    { "label": "Failed", "value": "0" },
    { "label": "Blocked", "value": "1" }
  ],
  "links": {
    "primary": {
      "kind": "batch",
      "href": "/dashboard?batchId=batch-2026-04-20-01"
    }
  },
  "generatedAt": "2026-04-20T17:13:00Z"
}
```

### Example task lookup response

```json
{
  "contractVersion": 1,
  "messageType": "status_lookup_result",
  "subjectType": "task",
  "subject": {
    "taskId": "TP-186",
    "batchId": "batch-2026-04-20-01"
  },
  "summary": {
    "title": "TP-186",
    "status": "running",
    "severity": "info",
    "text": "Currently running in wave 2. STATUS.md has recent progress updates."
  },
  "facts": [
    { "label": "Batch", "value": "batch-2026-04-20-01" },
    { "label": "Wave", "value": "2" }
  ],
  "links": {
    "primary": {
      "kind": "task",
      "href": "/dashboard?taskId=TP-186&batchId=batch-2026-04-20-01"
    }
  },
  "generatedAt": "2026-04-20T17:13:00Z"
}
```

### Empty/not-found lookup outcomes

Lookup responses should not fail silently.
Use explicit response states such as:
- `no_active_batch`
- `not_found`
- `ambiguous_target`
- `temporarily_unavailable`

Each should include a human-readable explanation and, when useful, a fallback dashboard link.

## Approval and Rejection Payload Semantics

Approve/reject actions should operate only on an existing canonical approval record.
They should never invent approval state based only on a Slack message.

## Decision action payload

Normalized action payload:

```json
{
  "contractVersion": 1,
  "actionType": "approve",
  "subjectType": "approval",
  "subject": {
    "approvalId": "APR-2026-04-20-001",
    "batchId": "batch-2026-04-20-01",
    "taskId": "TP-186"
  },
  "actor": {
    "slackUserId": "U123",
    "displayName": "Casey"
  },
  "interaction": {
    "actionId": "approve:APR-2026-04-20-001:v1",
    "messageTs": "1713631000.001200"
  },
  "submittedAt": "2026-04-20T17:14:00Z"
}
```

### Required fields

- `actionType` — `approve` or `reject`
- `subject.approvalId`
- actor identity as provided by Slack
- interaction identity sufficient for deduplication
- submission timestamp

### Expected canonical outcome

On success, the backend should translate the Slack action into a canonical Taskplane-backed decision record that captures:
- approval target
- decision (`approved` or `rejected`)
- acting user
- time
- outcome/result
- linkage back to the relevant task/batch/run evidence

### Response to decision action

The Slack integration should return a compact outcome message:
- `accepted` — canonical decision recorded
- `already_resolved` — approval already decided, no new mutation
- `expired` — approval window closed
- `unauthorized` — actor is not allowed to decide
- `failed` — backend could not record the decision

Each response should echo the target and include a deep link to the dashboard approval view.

## Bounded Stop/Cancel Contract

Step 1 scoped a conservative cancel/stop request as part of v1, but it must remain bounded.
This step defines the contract boundary without expanding it into a full recovery surface.

## Stop request action payload

```json
{
  "contractVersion": 1,
  "actionType": "request_stop",
  "subjectType": "batch",
  "subject": {
    "batchId": "batch-2026-04-20-01"
  },
  "actor": {
    "slackUserId": "U123",
    "displayName": "Casey"
  },
  "interaction": {
    "actionId": "request_stop:batch-2026-04-20-01:v1",
    "messageTs": "1713631010.001300"
  },
  "submittedAt": "2026-04-20T17:15:00Z"
}
```

### Contract boundary

In v1, `request_stop` means only:
- identify a specific target batch or task,
- require confirmation or a second-step acknowledgment as defined by the safety model,
- map to a real stop primitive supported by Taskplane implementation,
- record actor and outcome canonically.

It does **not** imply support for:
- retry
- resume
- skip
- force-merge
- reroute
- arbitrary kill semantics beyond what the runtime safely supports

If the implementation does not yet have a safe canonical stop primitive for the requested target, the Slack layer must return a deferred/not-supported response and route the operator to the dashboard.

### Response states

- `accepted_for_execution` — stop request was accepted and mapped to a canonical action
- `already_stopping_or_stopped` — no duplicate effect
- `requires_dashboard_confirmation` — too risky for one-click Slack completion
- `not_supported` — no safe backend action exists yet
- `failed` — backend error

## Deep-Link Contract

Slack links must point to the dashboard, not to hidden Slack-owned state.
A minimal deep-link contract should support these targets.

### Target kinds

- `batch`
- `history`
- `task`
- `approval`

### Recommended URL shape

The exact routing mechanism may be implemented with query parameters, hash routes, or path routes, but the semantic target should be equivalent to:

- `/dashboard?batchId=<batchId>` — live batch focus
- `/dashboard?historyBatchId=<batchId>` — historical batch summary focus
- `/dashboard?taskId=<taskId>&batchId=<batchId>` — task focus
- `/dashboard?approvalId=<approvalId>&taskId=<taskId>&batchId=<batchId>` — approval focus

### Deep-link rules

1. Links identify **targets and focus**, not mutable state snapshots.
2. The dashboard resolves fresh canonical state when opened.
3. A link may include related IDs to improve routing, but one primary target kind should be clear.
4. Approval links should include the `approvalId` and enough related context to locate the target even if the batch has completed.

## Idempotency Rules

Idempotency must account for multiple operator-visible duplication modes.

### 1. Repeated Slack delivery

A notification may be delivered more than once by the transport.
The backend should tolerate duplicate outbound delivery without creating duplicate canonical events.
The message content may be repeated; the canonical state mutation must not be.

### 2. Repeated button clicks

A user may click approve/reject/stop more than once.
The action handler must deduplicate using the interaction/action identity plus the canonical target state.
Only the first valid mutation should take effect.

### 3. Stale action after canonical state changed

An operator may click an old message after the approval was already decided or the batch already stopped.
The Slack response should be explicit (`already_resolved`, `already_stopping_or_stopped`, `expired`) and should not create a second mutation.

### 4. Retries by the integration layer

If the Slack bridge retries a backend call after a timeout, the canonical mutation layer must still remain idempotent.
This is why the backend should key decisions to durable target IDs and request/interaction identifiers rather than message text.

## Implementation Notes for Later Tasks

Later implementation tasks should ensure:
- Slack request handlers validate target IDs against canonical Taskplane state before mutation,
- dashboard links are generated from stable route helpers rather than handwritten strings,
- approval and stop actions return explicit stale/not-supported outcomes,
- status lookup can resolve both active and historical batch/task context,
- contract versioning is preserved so message shape changes can evolve safely.
