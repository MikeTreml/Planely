# Taskplane Operator Console v1 Interaction Flows

## Status

Draft for TP-181.

## Purpose

Define the operator-facing flows that connect the v1 information architecture and view models to safe, incremental interactions inside the current dashboard shell.

These flows describe user journeys, decision points, and guardrails. They do **not** assume a new orchestration backend. Where the UI depends on an action that is not yet directly backed by Taskplane commands or current dashboard endpoints, that dependency is called out explicitly.

## Flow Conventions

- **Origin** — where the operator starts
- **Goal** — what question or outcome the flow resolves
- **Primary path** — the ideal successful path
- **Branches** — empty, partial-data, blocked, or failure conditions
- **Guardrails** — safety rules or confirmation requirements
- **Backing behavior** — current or required Taskplane/API support

## 1. Start Batch from Backlog

### Origin
Backlog view, usually from a ready task row/card or a grouped ready-work section.

### Goal
Launch execution from vetted work without forcing the operator to leave the console.

### Primary path
1. Operator lands in **Backlog**.
2. Backlog groups show which tasks are **ready**, **blocked**, **running**, or **waiting on approval**.
3. Operator selects a ready task or a small set of ready tasks.
4. UI opens a **launch summary** showing:
   - selected task IDs
   - repo/workspace scope
   - dependency/readiness confirmation
   - any existing active batch conflicts
   - the backing action that will be used when available
5. Operator confirms launch.
6. Console transitions to **Live Batch** once a batch exists.
7. Live Batch anchors the operator on the new batch summary, current wave, and lane/task activity.

### Branches

#### No actionable backing yet
- If there is no current web-backed batch-launch command, the UI should present the launch summary as **preflight-only**.
- Primary CTA becomes **Copy / reveal launch command** or **open packet context**, not a fake “Start” mutation.
- The flow still provides value by assembling the right launch set and readiness evidence.

#### Task is no longer ready
- If dependency state changes between backlog render and launch confirmation, the launch summary downgrades the task to blocked.
- Confirmation is disabled and the operator is sent to **Task Detail** or a blocker explanation.

#### Active batch conflict
- If a workspace already has an active batch in focus, launch flow warns that starting additional work may compete for attention or violate current execution expectations.
- Depending on runtime capabilities, CTA becomes either **View active batch first** or **launch anyway** with explicit acknowledgement.

#### Partial data
- If planning links, artifact counts, or history hints are missing, the launch flow still proceeds using task packet and dependency evidence only.

### Guardrails
- Do not offer batch start on clearly blocked tasks.
- Show why a task is considered ready or not ready next to the confirmation CTA.
- If multiple tasks are selected, show dependency/conflict summaries before confirmation.
- Make it explicit whether the action is directly executable or only a launch recommendation.

### Backing behavior
- Uses backlog/task readiness projection from `view-models.md`.
- Requires either an existing Taskplane-backed batch start path or a transparent fallback that reveals the command/operator next step.
- Live Batch handoff can reuse current `/api/state` + SSE dashboard behavior once a batch exists.

## 2. Inspect Task

### Origin
Backlog row, lane task row, approval item, history row, or message/notification entry.

### Goal
Understand one task’s status, dependencies, evidence, and safe next actions without losing parent context.

### Primary path
1. Operator activates a task reference from any parent view.
2. Console opens **Task Detail** as a drill-in state, preserving the parent view in breadcrumbs/back navigation.
3. Task Detail loads:
   - packet metadata and canonical paths
   - derived readiness status and blockers
   - active batch/run/lane context when present
   - approvals/reviews and artifacts
   - recommended next action and available affordances
4. Operator may then:
   - inspect STATUS or conversation viewer
   - jump to the containing batch
   - jump to approval evidence
   - return to the parent view

### Branches

#### Task exists but runtime context is absent
- Show packet and status details with a **not currently running** explanation.
- History and live panels become optional sections rather than empty error boxes.

#### Task exists but some related files are missing
- Render `partial` state from the view model.
- Show which context is unavailable: approvals, latest run, history, or planning links.
- Keep core packet identity and STATUS evidence available when possible.

#### Task ID no longer resolves
- Show an `empty/error` detail state with the original parent context preserved.
- Offer return to parent and links to related batch/history if those are still available.

### Guardrails
- Task Detail should never trap the operator in a dead end; back/close must return them to the originating context.
- Missing evidence should be shown as missing, not replaced with guessed values.
- High-risk actions inside Task Detail must carry evidence hints and confirmation rules from the affordance model.

### Backing behavior
- Reuses the current status/conversation viewer pattern for evidence drill-ins.
- Depends on packet paths, STATUS data, batch/history context, and approval summaries being aggregated into the task detail projection.

## 3. Retry / Skip / Integrate

### Origin
Task Detail, Approvals, Live Batch summary, or failure-focused history/live views.

### Goal
Let the operator take a real corrective or completion action when Taskplane already has or can plausibly expose backing behavior.

### Shared interaction pattern
1. Operator sees an enabled affordance with:
   - label
   - evidence hint
   - enabled/disabled state
   - backing command information when known
2. Operator opens the action confirmation.
3. Confirmation panel shows:
   - subject (task, batch, or integration target)
   - why the action is recommended
   - immediate consequences
   - linked evidence to inspect before continuing
4. Operator confirms or cancels.
5. Console updates current context and highlights the resulting state transition.

### Retry flow

#### Primary path
- Triggered from a failed or stalled task.
- Confirmation shows last failure reason, latest evidence, and any approval/precondition requirements.
- On success, UI returns to Live Batch or Task Detail with task state moved back toward active/pending execution.

#### Branches
- If retry is not actually backed yet, affordance remains visible but disabled with a message such as **Available once retry command wiring is exposed to the dashboard**.
- If the task is already running again, action is suppressed or converted to **View active run**.

### Skip flow

#### Primary path
- Triggered for blocked or failed work where operator chooses to unblock dependents knowingly.
- Confirmation must emphasize downstream consequences and name affected dependents when known.
- After confirmation, UI highlights the new dependency posture and any newly ready items.

#### Branches
- If dependent impact cannot be computed yet, skip remains disabled or requires a stronger warning.
- If task is already terminal without dependents, skip should not be shown as a redundant action.

### Integrate flow

#### Primary path
- Triggered from a completed/merge-ready batch or approval subject.
- Confirmation shows batch summary, merge readiness, failures/partials, and evidence links.
- Success returns operator to History or a completed Live Batch summary.

#### Branches
- Partial merge or failed-wave states require explicit warning about mixed results.
- If only CLI/supervisor-backed integrate behavior exists today, the UI must say so rather than implying a silent server-side mutation.

### Guardrails
- Use `enabled`, `disabledReason`, `requiresConfirmation`, `commandBacking`, and `evidenceHint` from Step 2 models.
- Retry and integrate are **high-blast-radius** actions; skip is **destructive to dependency flow**.
- Confirmations must show nearby evidence and a plain-language consequence statement.
- Disabled actions should remain informative when the operator needs to know that a capability exists conceptually but is not yet wired into the UI.

### Backing behavior
- Retry/skip/integrate must map to real Taskplane commands or supervisor actions before becoming clickable mutations.
- Until then, UI may render evidence-rich recommendation states and “open in task/batch context” affordances only.

## 4. Navigate from Notification or History Entry to Underlying Task or Batch

### Origin
Mailbox/messages panel, future notification surfaces, Slack/web deep-link entry, or History list/detail.

### Goal
Take the operator from an attention signal to the exact batch, task, approval, or evidence context needed to act.

### Primary path: message/notification entry
1. Operator opens a message, audit event, or notification item.
2. Item exposes a deep-link target with enough metadata to resolve one of:
   - Task Detail
   - Live Batch
   - History detail
   - Approvals inbox item
3. Console navigates to the destination while preserving the original origin in breadcrumbs or a back stack.
4. If the destination is task-scoped, Task Detail opens with linked batch/approval evidence visible.
5. If the destination is batch-scoped, Live Batch or History opens first, with the relevant task highlighted when possible.

### Primary path: history entry
1. Operator opens **History**.
2. Selects a historical batch row.
3. Console renders **History detail** using the batch summary model.
4. From wave/task rows, operator can drill into:
   - Task Detail for a specific historical task
   - related artifacts/evidence
   - batch-level summary context
5. Closing task detail returns the operator to the same history entry rather than the top of the app.

### Branches

#### Active batch still exists for the linked subject
- If a notification references a task that is both in history and currently re-running in a live batch, the deep link should prefer the **currently actionable context** and offer a secondary link to historical context.

#### Destination can only resolve partially
- If the task exists but the exact run or approval record no longer resolves, land on Task Detail with a warning banner explaining what part of the link was missing.

#### Destination no longer exists
- Show a scoped not-found state that preserves origin metadata and offers closest valid fallback, such as History list, Live Batch, or Backlog filtered to the task ID.

### Guardrails
- Deep links must be explicit about whether they target live or historical context.
- Navigation should preserve parent context so the operator can step back without losing their place.
- A notification should never dump the user into a generic homepage if a more precise fallback exists.

### Backing behavior
- Current mailbox/messages panel and history list already provide natural entry points.
- Requires stable IDs for task, batch, approval, and message subjects in UI routing/state.
- Slack/web links can be additive later if they resolve to the same destination model.

## 5. Guardrails and Safety Patterns

This section collects cross-flow rules so implementation tasks can apply consistent behavior.

## Guardrail categories

### A. Destructive or consequence-heavy actions
Examples: skip task, integrate partial batch, reject approval when it changes downstream flow.

Required patterns:
- confirmation dialog/sheet
- consequence statement in plain language
- linked evidence nearby
- explicit target identity (task/batch/approval)
- disabled state when necessary evidence is missing

### B. High-blast-radius operational actions
Examples: retry task in active execution, batch-level integrate, launch multi-task batch.

Required patterns:
- visibility into affected scope
- indication of whether action is already backed by Taskplane
- warning when another active batch or conflicting context exists
- recommended post-action destination (usually Live Batch or History)

### C. Confusing but non-destructive transitions
Examples: switching between live and historical context, changing repo/workspace filters while in task detail, opening a stale deep link.

Required patterns:
- breadcrumbs/back navigation
- persistent parent context
- badges or banners showing “out of current filter” or “historical context”
- no silent context reset when a more transparent transition is possible

## Partial-data guardrails
- Use the Step 2 `partial` state rather than suppressing incomplete sections entirely.
- Operators should know when data is missing because the runtime has not exposed it yet versus when the subject truly has no data.
- If the UI cannot safely mutate, render recommendation and evidence only.

## Terminology guardrails
- Use **Backlog**, **Live Batch**, **Approvals**, **History**, and **Task Detail** consistently.
- Distinguish **recommended action** from **available action**.
- Distinguish **live batch** from **history batch** in headings and breadcrumbs.

## Incremental Delivery Notes

These flows are intentionally compatible with the current dashboard architecture:

1. **Start with navigation state and drill-ins** before adding real action mutations.
2. **Reuse existing viewer patterns** for evidence-heavy flows.
3. **Ship informative disabled affordances before live mutations** when backend support is not yet present.
4. **Layer routing and deep-link state over current panels** instead of rewriting the dashboard shell.
5. **Promote existing message/history surfaces into first-class entry points** once task/batch destinations are routable.

## Backend/API Assumptions Called Out Explicitly

The following should be treated as implementation prerequisites, not assumed-current behavior:

- A web-invokable action path for **start batch** from backlog selection
- Stable web-invokable mutations for **retry**, **skip**, and **integrate**
- Stable subject IDs and routing metadata for notifications/deep links into task, batch, and approval destinations
- Aggregated approval inbox data if it is not yet exposed directly by existing dashboard endpoints

Until these exist, Operator Console v1 should present evidence-rich workflows and clear next steps without pretending the mutation is already supported.