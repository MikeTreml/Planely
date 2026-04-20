# Taskplane Slack Safety Model

## Status

Draft for TP-186.

## Purpose

Define the safety rules for Taskplane's Slack companion so that remote awareness and lightweight control remain useful without undermining Taskplane's file-backed execution model, auditability, or operator clarity.

This document turns the product boundaries from `slack-companion.md` and the interaction contracts from `slack-message-contracts.md` into concrete guardrails.

## Safety Principles

1. **Slack is a companion, not a control-plane authority.**
   Slack may request or display actions, but canonical state transitions must occur in Taskplane-backed records and runtime flows.

2. **Read-only is safer than mutating.**
   If an action cannot be made clearly identifiable, auditable, and reversible enough for Slack, the integration should link to the dashboard instead.

3. **Every mutation must re-read canonical state.**
   Interactive Slack payloads can become stale. Before approving, rejecting, or stopping anything, the backend must validate the target against current canonical Taskplane state.

4. **Identity must be explicit.**
   Slack user identity must be mapped or rejected intentionally; it cannot be assumed.

5. **Small surface area is a safety feature.**
   A deliberately tiny v1 action set is part of the security model, not just a product-scoping choice.

## Action Classification Matrix

Slack companion v1 actions should be classified as follows.

| Action | Category | Slack posture | Why |
|-------|----------|---------------|-----|
| Status lookup | Read-only | Allowed | Does not mutate state; useful remotely |
| Notification delivery | Read-only | Allowed | Awareness only |
| Approve | Mutating, bounded | Allowed with authorization + idempotency | Decision can be narrow and auditable |
| Reject | Mutating, bounded | Allowed with authorization + idempotency | Same reasoning as approve |
| Stop/cancel request | Mutating, higher risk | Allowed only with confirmation, authorization, and rate limiting | Interrupts active work and may have larger operator impact |
| Start batch/workflow | Mutating, broad scope | Dashboard-only / deferred | Requires richer context and intent review |
| Resume batch | Mutating, recovery action | Dashboard-only / deferred | Requires understanding of failure state and prior actions |
| Retry task | Mutating, recovery action | Dashboard-only / deferred | Can create duplicate work or hide diagnosis needs |
| Skip task | Mutating, recovery action | Dashboard-only / deferred | Alters dependency outcomes and batch semantics |
| Force merge | Mutating, high risk | Forbidden in Slack v1 | High blast radius and easy to misuse without full context |
| Workflow/prompt/planning edits | Authoring | Forbidden in Slack v1 | Not suitable for constrained mobile interaction |

## Audit Requirements

Every mutating Slack interaction must produce or map to an auditable canonical record.

## Required audit fields

At minimum, the canonical mutation path should capture:
- acting Slack user ID
- mapped Taskplane/operator identity if available
- action type (`approve`, `reject`, `request_stop`)
- target identifiers (`approvalId`, `taskId`, `batchId`, etc.)
- original Slack interaction identifier or dedupe key
- submission time
- canonical outcome (`accepted`, `already_resolved`, `unauthorized`, `failed`, etc.)
- optional reason/note when rejection or stop is accompanied by one

## Audit expectations by action

### Approval / rejection
Audit should record:
- who decided,
- what approval object was targeted,
- what evidence or run/task/batch was associated,
- whether the action was first-write or a stale duplicate.

### Stop request
Audit should record:
- who requested the stop,
- what exact target was requested,
- whether a confirmation step was required,
- what backend primitive actually executed,
- whether the request was accepted, ignored as duplicate, or refused.

### Read-only lookup
Lookup requests do not need the same canonical mutation record as approvals, but implementation may still log access or operational telemetry if desired.
They must not mutate state.

## Authorization and Identity Mapping

The integration must not assume that a Slack display name or user ID automatically equals a trusted Taskplane operator identity.

## Identity rules

1. **Slack actor identity is input, not proof.**
   A Slack payload supplies an actor identity claim. The backend must validate or map that claim before permitting mutations.

2. **Unmapped actors are rejected or routed to the dashboard.**
   If a Slack user cannot be matched to an authorized Taskplane operator identity, mutating actions must fail with `unauthorized` or a similar explicit outcome.

3. **Authorization is target-sensitive.**
   A user allowed to inspect status may not be allowed to approve or stop work.

4. **Approval authority may differ from stop authority.**
   The safety model should allow these permissions to diverge so the integration does not assume one role can perform all Slack actions.

5. **When identity confidence is weak, degrade safely.**
   Prefer read-only responses and dashboard deep links instead of guessing.

## Minimum v1 authorization posture

Slack v1 should require explicit authorization for:
- `approve`
- `reject`
- `request_stop`

Slack v1 may allow broader access for:
- receiving notifications,
- read-only status lookups,

provided the project is comfortable with those visibility rules.
If not, status lookup can also be constrained without changing the rest of the design.

## Confirmation Rules

Confirmation should be proportional to action risk.

### No confirmation required
- passive notifications
- read-only status lookup

### One-step confirmation acceptable
- `approve`
- `reject`

Rationale:
- these actions are bounded to an existing approval object,
- they are idempotent,
- the dashboard deep link can provide richer context before clicking.

### Stronger confirmation required
- `request_stop`

Rationale:
- stop/cancel actions can interrupt active execution,
- the operator may be acting from partial context,
- accidental taps are more costly.

A valid v1 approach is to require either:
- an explicit confirm interaction in Slack, or
- a Slack response that sends the operator to the dashboard for final confirmation.

## Rate Limiting Rules

Rate limiting is required separately from confirmation and authorization.

Its job is to prevent:
- repeated clicks from spamming the backend,
- noisy stop requests against the same target,
- rapid approval/rejection attempts caused by retries or delivery glitches.

## Required v1 rate-limited actions

### Approval / rejection
Rate-limit scope:
- per actor + approval target

Expected behavior:
- after the first accepted decision attempt, repeated attempts against the same approval should resolve as `already_resolved` or an equivalent stale outcome.
- rapid duplicate submissions before canonical state refresh should still collapse safely.

### Stop/cancel request
Rate-limit scope:
- per actor + target
- optionally per channel + target if operational noise becomes a problem

Expected behavior:
- only one active stop request per target should be processed in a short interval,
- repeated requests should return `already_stopping_or_stopped`, `requires_dashboard_confirmation`, or a rate-limit message instead of invoking multiple backend stop primitives.

### Status lookup
Status lookup may use soft throttling for operational reasons, but it should not be treated like a mutating abuse path.
If throttled, the response should be user-friendly and still offer a dashboard link.

## Suggested fallback when rate limit is hit

Return a compact Slack response explaining:
- the action was recently attempted,
- whether the target is already resolved/stopping,
- where to inspect current state in the dashboard.

## Forbidden and Deferred Actions

The v1 safety model should distinguish between actions that are merely deferred and those that are outright forbidden.

## Deferred to dashboard or later phases

Deferred because they need richer context, broader visibility, or more mature controls:
- start batch/workflow
- resume batch
- retry task
- skip task
- reroute/reassign
- workflow editing
- planning artifact editing

These actions are not necessarily unsafe forever; they are unsafe for Slack v1's context limits.

## Forbidden in Slack v1

Forbidden because the combination of blast radius and limited context is too high:
- force merge
- any action that bypasses canonical approval/review gates
- direct mutation of canonical files from Slack without a Taskplane-backed command path
- any Slack-only action that changes run state without audit logging

## Why Slack Must Never Own Canonical Run State

This is a core architectural rule, not just a UX preference.

Slack must never own canonical run state because:

1. **Taskplane is file-backed and inspectable by design.**
   Operators need a durable answer to what ran, what was approved, what failed, and what artifacts were produced. That answer must live in Taskplane records, not in ephemeral Slack messages.

2. **Slack delivery is not a reliable execution ledger.**
   Messages can be delayed, duplicated, deleted, or viewed out of order. That makes Slack unsuitable as the authoritative representation of execution state.

3. **The dashboard and CLI need shared truth.**
   If Slack owned any part of canonical run state, Taskplane would gain a second competing authority that other interfaces would have to reconcile.

4. **Auditability would degrade.**
   Relying on Slack message state would make it harder to answer who changed what, when, and against which canonical target.

5. **Stale interactions are inevitable.**
   Slack actions often happen after the underlying run state has changed. The only safe approach is to treat Slack payloads as references that re-check canonical state before acting.

Design consequence:
- Slack may identify targets and request changes,
- canonical state changes must happen in Taskplane-backed records,
- Slack responses should reflect the result of that canonical operation rather than becoming the operation itself.

## Failure and Fallback Behavior

Slack interactions should fail explicitly and safely.

## Required fallback pattern

When an action cannot be completed safely, the Slack companion should:
1. return a clear outcome state,
2. explain the reason in compact operator language,
3. provide a dashboard deep link for the richer or safer path,
4. avoid partial or ambiguous mutations.

## Expected outcome classes

These should align with the action contract doc:
- `accepted`
- `already_resolved`
- `expired`
- `unauthorized`
- `requires_dashboard_confirmation`
- `not_supported`
- `already_stopping_or_stopped`
- `failed`
- `temporarily_unavailable`

## Failure scenarios

### Stale approval action
Behavior:
- re-read canonical approval state,
- return `already_resolved` or `expired`,
- include approval/task/batch deep link.

### Identity cannot be mapped
Behavior:
- return `unauthorized`,
- do not mutate anything,
- route to dashboard or out-of-band support flow if appropriate.

### Target cannot be found
Behavior:
- return `not_supported` or `failed` with a precise explanation,
- prefer a dashboard link if the target may still be inspectable historically.

### Backend action unavailable
Behavior:
- return `temporarily_unavailable` or `not_supported`,
- preserve operator clarity that nothing changed canonically.

### Rate limit reached
Behavior:
- do not re-run the mutation,
- return compact explanation and target link,
- preserve idempotent target state.

### Stop request too risky for one-click execution
Behavior:
- return `requires_dashboard_confirmation`,
- send the operator to the dashboard's stop/cancel flow.

## Operational Guidance for Later Implementation

Implementation tasks derived from this spec should ensure:
- Slack actions validate current target state before mutation,
- actor mapping and authorization checks happen before canonical updates,
- rate limits are enforced on mutating actions,
- confirmation requirements are action-sensitive,
- all mutating outcomes are auditable,
- every safety rejection returns a dashboard link instead of a dead end.
