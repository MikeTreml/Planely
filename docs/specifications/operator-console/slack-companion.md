# Taskplane Slack Companion v1

## Status

Draft for TP-186.

## Purpose

Define a bounded Slack companion for Taskplane Operator Console that improves remote awareness and lightweight operator control without turning Slack into a second control plane or source of truth.

This design follows the direction established in TP-180 and TP-185:
- the web console is the primary operator surface,
- Taskplane runtime artifacts remain canonical for execution truth,
- planning artifacts remain canonical for planning intent, and
- Slack exists to route attention and capture a small set of auditable low-risk decisions.

## Product Positioning

Slack v1 is a **companion surface**, not a full chatops platform.

Its job is to help an operator who is away from the dashboard:
- notice that something important happened,
- check the current state quickly,
- approve or reject a pending decision when the evidence is already linked,
- request a bounded stop/cancel action when necessary, and
- jump back into the web console for richer inspection.

Slack should not become the only place where a person can understand or control a run.

## Goals

Slack companion v1 should make these outcomes true:

1. **Remote awareness improves.**
   Operators receive useful notifications for important run and approval events without polling the dashboard.

2. **Quick decisions are possible.**
   An operator can approve or reject a clearly scoped request from Slack when the message includes the necessary context and a deep link to fuller evidence.

3. **Lightweight lookup works away from a desk.**
   Slack can return a compact status view for a batch or task without trying to recreate the full dashboard.

4. **All Slack actions remain auditable.**
   Any mutation triggered from Slack must map back to a canonical Taskplane-backed action with actor, time, target, and outcome recorded.

5. **Slack always hands off to the console for deeper work.**
   Every notification and action path should make it easy to jump into the dashboard when context is dense or risk is higher.

## Non-Goals

Slack companion v1 does **not** attempt to:

- replace the web console as the primary operator environment,
- become the canonical home for batch, task, run, or approval state,
- support full task authoring, backlog management, or planning artifact editing,
- expose advanced recovery actions such as retry, skip, force-merge, resume, reroute, or workflow editing,
- solve generalized bot-platform concerns such as multi-workspace federation or free-form conversational orchestration,
- assume identity/auth mapping is solved beyond the explicit constraints documented by the integration.

## Why Slack Is Secondary

Slack is good at interrupt-driven awareness, simple approval moments, and lightweight lookup on mobile.
It is not good at:
- sustained project navigation,
- dense task and artifact inspection,
- understanding multi-task batch context,
- debugging failures, or
- safely presenting complex destructive actions.

That makes Slack a useful remote companion, but a poor system of record.
The dashboard remains the best place to inspect artifacts, compare related tasks, understand historical context, and run complex recovery flows.

## Notification Categories

Slack companion v1 should support six notification categories.

### 1. Batch started
Sent when a batch begins execution.

Purpose:
- tell the operator work is now live,
- identify the batch and scope,
- provide a link to the live batch view.

### 2. Blocked / attention needed
Sent when work cannot proceed without intervention, such as dependency blockage, a paused/stopped batch, or a missing approval.

Purpose:
- surface situations that need operator attention,
- direct the operator to the relevant task or batch.

### 3. Approval requested
Sent when a human decision is needed.

Purpose:
- show the decision requested,
- summarize the affected target,
- offer approve/reject actions when safe,
- deep-link to full evidence in the dashboard.

### 4. Failure detected
Sent when a task, lane, merge, or batch reaches a failed state that should not be silently ignored.

Purpose:
- alert the operator quickly,
- summarize where failure occurred,
- route to dashboard context for diagnosis.

### 5. Batch/task completed
Sent when a meaningful unit of work finishes successfully.

Purpose:
- confirm completion,
- summarize outcomes,
- link to task or batch details.

### 6. Batch integrated
Sent when a completed batch is integrated back into the working branch or otherwise reaches its integration finish point.

Purpose:
- close the loop for operators following delivery,
- provide the integration target/result.

## v1 Actions

Slack companion v1 should expose only a small action set.

### Supported v1 actions

#### Status lookup
A Slack command or message action that returns a compact summary for:
- the current active batch,
- a specific `batchId`, or
- a specific `taskId`.

Why it belongs in v1:
- read-only,
- useful away from the dashboard,
- maps cleanly to existing dashboard/runtime data.

#### Approve
Approve a pending decision request that already exists in canonical Taskplane-backed state.

Why it belongs in v1:
- OpenClaw guidance explicitly treats lightweight approvals as appropriate for Slack,
- approval can be auditable and idempotent,
- the action can require a dashboard link for deeper context.

#### Reject
Reject a pending decision request.

Why it belongs in v1:
- symmetric with approval,
- useful for quick human gating,
- preserves explicit decision records.

#### Cancel / stop request
Allow a bounded stop action for the relevant target, framed as a deliberate operator interruption rather than a general recovery surface.

For Taskplane, this should be modeled conservatively as a request that maps to a real stop primitive such as pause/abort or a task-specific cancellation path once implemented.

Why it belongs in v1:
- valuable when away from a desk,
- often urgent,
- still narrow enough to govern with confirmation and audit logging.

### Deferred actions

The following actions should be explicitly deferred from Slack v1 even if related orchestrator tools already exist elsewhere:
- start new batches or workflows,
- retry failed tasks,
- skip tasks,
- force-merge waves,
- resume stopped batches,
- reroute or reassign work,
- edit prompts, planning artifacts, or workflow definitions.

These actions require broader context, stronger confirmation, and better visibility into blast radius than Slack comfortably provides.
They belong in the dashboard first.

## Interaction Model

Slack companion v1 should use a small set of interaction patterns:

1. **Push notifications** for important lifecycle events.
2. **Compact status responses** for lightweight lookup.
3. **Inline approve/reject controls** only for clearly scoped pending decisions.
4. **Deep links back to the dashboard** for anything requiring more than a glance.

The design should prefer predictable structured messages over free-form conversational behavior.

## Source-of-Truth Relationship

The source-of-truth boundary must be explicit.

### Taskplane runtime stays canonical for execution

Canonical execution state remains in Taskplane artifacts and runtime-managed files, including:
- task packets and `STATUS.md`,
- batch state and history,
- run records and logs,
- review/approval records,
- integration outcomes.

Slack messages are projections of that state, not replacements for it.

### Planning files stay canonical for planning intent

If Slack notifications mention related specs, initiatives, or milestones, those references should come from canonical planning artifacts under the planning layer defined in TP-185.
Slack must not become the place where planning truth is edited or stored.

### Dashboard is the primary rich control surface

The dashboard owns rich inspection and multi-step operator workflows.
Slack should always defer to it when the operator needs:
- artifact inspection,
- task details,
- batch-wide understanding,
- historical context,
- recovery operations beyond approve/reject/stop.

### Slack actions must round-trip to canonical commands or records

A Slack action is valid only if it:
1. identifies an existing canonical target,
2. maps to a real Taskplane-backed action,
3. records actor, time, and outcome, and
4. updates canonical state outside Slack.

If those conditions are not met, the Slack message should fall back to a dashboard link rather than pretend the action succeeded.

## Design Constraints

Slack companion v1 should obey these constraints:

- **No shadow state:** Slack payloads may cache display fields, but canonical state must be re-read from Taskplane when actions execute.
- **No Slack-only flows:** every important action must have an equivalent or better dashboard path.
- **Low-risk by default:** when in doubt, link to the dashboard instead of exposing another Slack action.
- **Idempotent decisions:** repeated clicks or repeated message deliveries must not produce duplicate approvals or duplicate stop requests.
- **Clear reversibility posture:** if an action is destructive or ambiguous, it should require stronger confirmation or be deferred entirely.

## Dashboard Deep-Link Expectations

Slack needs a minimal but stable deep-link vocabulary that identifies the thing the operator should inspect.
The links should point to dashboard views such as:
- live batch by `batchId`,
- historical batch summary by `batchId`,
- task detail/status by `taskId`,
- approval-focused view by `approvalId` plus related batch/task context.

The link should encode target identity and desired focus, not duplicate state payloads.
The dashboard should resolve fresh canonical state when opened.

## Incremental Delivery Boundary

Slack companion v1 should be implementable without building a generalized chatops platform.

That means:
- one bounded notification pipeline,
- a small command/action surface,
- explicit payload contracts,
- clear idempotency and audit rules,
- deep links into the existing/future dashboard.

Anything beyond that should wait for evidence from real operator usage.
