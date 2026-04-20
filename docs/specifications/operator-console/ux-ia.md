# Taskplane Operator Console v1 UX and Information Architecture

## Status

Draft for TP-181.

## Purpose

Define how the current orchestrator dashboard evolves into an Operator Console without discarding the runtime-monitoring strengths that already exist. This IA treats the current dashboard as the live-operations core and layers operator-facing backlog, task-inspection, approval, and history navigation around it.

## Design Constraints

1. **Taskplane remains the execution authority.** Views are projections over Taskplane files, batch state, and runtime artifacts.
2. **The current live dashboard is preserved.** Existing summary, lane, merge, supervisor, agent, message, history, and viewer surfaces remain part of the product.
3. **Navigation must stay lightweight.** v1 should fit inside the current dashboard shell rather than require a full frontend rewrite.
4. **Scope is explicit.** Every view must declare whether it is global, workspace-scoped, batch-scoped, or task-scoped.
5. **Filtering must be predictable.** Workspace and repo scope should narrow data consistently without hiding the active task or batch context unexpectedly.

## Operator Questions the Console Must Answer

- What work exists and what is ready to run?
- What is running right now?
- What needs my approval or intervention?
- What happened in recent batches?
- How do I get from a summary row to the actual task, batch, run, and artifacts?

## Current Dashboard Surfaces to Preserve

The existing dashboard already provides the v1 live-operations layer:

- **Header chrome** — batch identity, phase, history picker, repo filter, freshness, theme, connection state
- **Summary bar** — batch progress, status counts, elapsed time, wave chips
- **Supervisor panel** — status, conversation, recovery timeline, batch summary
- **Lanes & Tasks panel** — lane grouping, task progress, runtime telemetry, status viewer entry points
- **Merge Agents panel** — merge wave status and merge telemetry
- **Agents panel** — runtime registry visibility
- **Messages panel** — mailbox/audit feed visibility
- **History summary panel** — recent completed batch inspection
- **Terminal / STATUS viewer** — drill-in for conversation and task status content
- **Errors panel** — exceptional conditions and operator awareness

These should remain the basis of the **Live Batch** view in Operator Console v1.

## Primary Views

## 1. Backlog
**Purpose:** daily operator home for discovering executable work outside the context of a currently running batch.

**Answers:**
- Which task packets exist?
- Which are ready, blocked, running, done, or waiting on approval?
- What should the operator do next?

**Core contents:**
- backlog list/cards grouped by readiness or project area
- derived operator status
- dependency/readiness summary
- latest activity summary
- quick actions such as inspect and start batch
- optional planning context links (idea/spec/initiative when present)

**Scope:** workspace-scoped with optional repo narrowing.

## 2. Task Detail
**Purpose:** focused inspection surface for one task packet and its surrounding context.

**Answers:**
- What is this task?
- Why is it blocked or waiting?
- What batch/run/history is associated with it?
- What evidence and actions are available?

**Core contents:**
- canonical packet metadata
- readiness/dependency status
- latest run and latest batch context
- approvals/reviews/status evidence
- links to artifacts and drill-ins into STATUS/conversation/history

**Scope:** task-scoped. Opens from any view that references a task.

## 3. Live Batch
**Purpose:** operational monitoring workspace for active execution.

**Answers:**
- What is currently running?
- Which lanes are healthy?
- What is stalled, failed, or waiting on review?
- What recovery or integration actions are in play?

**Core contents:**
- the current dashboard layout, reorganized as a named primary view
- summary bar
- supervisor panel
- lanes/tasks
- merge agents
- runtime agents and messages
- errors and viewer drill-ins

**Scope:** batch-scoped, with lane/task drill-ins.

## 4. History
**Purpose:** navigable record of completed or past batch executions.

**Answers:**
- What happened in recent runs?
- Which batch or task should I reopen to inspect an outcome?
- What did a prior wave, task, or merge cost and produce?

**Core contents:**
- recent batch list
- current history summary content from the dashboard
- navigation from batch entry to task detail or related artifacts

**Scope:** workspace-scoped list, batch-scoped detail.

## 5. Approvals
**Purpose:** inbox for pending operator decisions that currently require hunting through runtime views.

**Answers:**
- What requires approval, retry, skip, merge, or review?
- What evidence supports the decision?
- What is the safest next action?

**Core contents:**
- pending approvals and action requests
- subject type (task, run, batch, integrate)
- risk/impact cues
- linked evidence and destination views
- explicit decision outcomes and timestamps

**Scope:** workspace-scoped list with subject-scoped drill-in.

## Navigation Hierarchy

## Top-level navigation
The minimum viable navigation should be:

1. **Project sidebar / workspace switcher**
   - selects the known project or execution root being viewed
   - groups projects into **Active**, **Recent**, and **Archived** sections when timestamps/registry data exist
   - may defer the visible **Recent** section in the first shipped iteration if only active/archived registry fields are available; in that fallback the sidebar still preserves the same canonical record shape and simply omits the derived Recent grouping
2. **Primary nav tabs**
   - **Backlog**
   - **Live Batch**
   - **Approvals**
   - **History**
3. **Context rail / breadcrumbs**
   - shows batch ID, task ID, repo, or approval subject when in a scoped detail state
4. **Viewer overlay / detail pane**
   - retains the current terminal/STATUS drill-in pattern for evidence-heavy inspection

This model keeps the existing single-page dashboard shell while clarifying where each kind of operator work lives.

## Project sidebar contract

### Sidebar sections
- **Active** is the default visible list for non-archived projects.
- **Recent** is a derived convenience section ordered by descending `lastActivityAt = max(lastOpenedAt, lastBatchAt)` when those timestamps are available.
- **Archived** is always accessible but visually de-emphasized and collapsed or lower-priority by default.
- If registry timestamps are unavailable, the console should still render **Active** and **Archived** using the same project records rather than inventing a parallel lightweight project list.

### Project row content
Each project row should stay grounded in the project-registry record and a small set of derived decorations.

**Canonical fields surfaced directly:**
- display `name`
- stable `id` for selection and routing
- reopenable `rootPath` or `configPath` as inspectable metadata when needed
- explicit `archived` state
- `mode` when the distinction between repo and workspace matters
- activity timestamps (`lastOpenedAt`, `lastBatchAt`) used for ordering and relative-time copy

**Derived/optional decorations:**
- current/open project highlight
- relative last-activity label
- running batch or attention badge when safe runtime evidence exists
- missing-path warning when the project record exists but the root is unavailable

Rows should remain compact by default: name first, lightweight secondary metadata second, badges only when grounded in real data.

### Project switching behavior
Project switching changes the entire workspace scope, so project-scoped UI state must reset deterministically.

**Always clear on project change:**
- selected repo filter
- selected backlog task
- open task detail that belongs to the previous project
- viewer state for STATUS/conversation
- selected history entry tied to the previous project

**May persist only when still valid in the next project:**
- the top-level primary view choice (**Backlog**, **Live Batch**, **Approvals**, **History**)

**Fallback rules:**
- if the prior view was **Live Batch** and the newly selected project has no active batch, fall back to **Backlog**
- if the project has no backlog items but does have history, **Backlog** may show its empty state while **History** remains one click away; do not silently force a history jump unless no other meaningful project data exists
- if the project record is missing/stale, keep the selection visible with a warning state rather than leaving stale content from the previously selected project on screen

### Sidebar empty states
- **No known projects:** explain that the console can only switch between projects that Taskplane has opened or registered.
- **No active projects:** show archived and/or recent sections if they exist and explain that active list emptiness may be due to archiving.
- **No archived projects:** omit or collapse the archived section quietly.
- **Missing project path:** keep the row visible with warning styling and a message that the local path is unavailable.

### Archive visibility behavior
- Archived projects must never be deleted as a side effect of decluttering the sidebar.
- Archived projects leave the default active list but remain discoverable in a separate section.
- Archived rows should keep enough identity context to reopen or unarchive safely, while using muted styling so they do not compete with active destinations.
- Recent should prefer non-archived projects by default; archived items may appear in recent only if the UI intentionally distinguishes that state.

## Entry points

### Default landing
- If there is **no active batch**, default to **Backlog**.
- If there **is an active batch**, default to **Live Batch**, but preserve one-click access to Backlog and Approvals.

### From notifications/messages
- Message or mailbox entries should deep-link to the relevant **Task Detail**, **Approval**, or **Live Batch** context.

### From history
- History rows open the **History** detail view first, with links onward to associated tasks and artifacts.

### From task references
- Any task row in Backlog, Live Batch, History, or Approvals should open **Task Detail** without forcing a full page transition.

## Global vs Scoped Views

| View | Scope | Notes |
|---|---|---|
| Backlog | Global workspace view | May be narrowed by repo, status, or planning context |
| Approvals | Global workspace view | Filtered inbox of pending and recent decisions |
| History list | Global workspace view | Shows recent batch runs across the workspace |
| Live Batch | Batch-scoped primary view | Exists only when an active or selected batch is in focus |
| History detail | Batch-scoped detail | One batch summary with wave/task breakdown |
| Task Detail | Task-scoped detail | Reachable from all list/detail surfaces |
| Viewer overlay | Task/run/session scoped | Evidence drill-in for STATUS, conversation, or artifacts |

## Filter and Scope Behavior

## Workspace filter
- Workspace is the broadest scope.
- Changing workspace resets repo-specific filters and clears stale task/batch selection.
- Global tabs persist across workspace switches, but their content reloads for the selected workspace.

## Repo filter
- Repo filtering remains available only when multiple repos are in scope.
- Repo filter applies consistently to **Backlog**, **Live Batch**, **Approvals**, and **History lists**.
- Repo filter must not hide the currently opened task detail; instead, the detail should show an out-of-filter badge if needed.
- Batch-scoped views may show cross-repo summary chips even when narrowed, but only matching rows/cards should be expanded in the main content.

## Batch scope
- Live Batch is anchored to one active batch at a time.
- If a new active batch replaces the old one, stale viewer state should close and the view should re-anchor to the new batch.
- History can select a past batch without pretending it is live.

## Task scope
- Task Detail is a drill-in state, not a top-level tab.
- Opening a task should preserve the current parent context, so closing detail returns the operator to Backlog, Live Batch, History, or Approvals.

## Empty States and Fallback Rules

- **No active batch:** show Backlog as primary and expose History as secondary context.
- **No backlog items:** show a guided empty state explaining whether discovery is empty, filtered out, or blocked by prerequisites.
- **No approvals:** show an empty inbox with a link back to Backlog or Live Batch.
- **No history:** retain the current simple history empty state.
- **Missing richer data:** fall back to current runtime panels rather than hiding the subject entirely.

## Recommended Layout Strategy for v1

To fit the existing dashboard architecture:

1. Keep the **existing header and summary shell**.
2. Add a **primary navigation row** above or just below the summary bar.
3. Treat the current dashboard body as the initial **Live Batch** tab content.
4. Introduce **Backlog**, **Approvals**, and enhanced **History** as alternate content states rendered within the same main content region.
5. Keep the current terminal/STATUS viewer as a reusable drill-in surface for task evidence.

## Incremental Implementation Path Implied by this IA

1. Add navigation chrome and a view-state model without removing existing panels.
2. Reframe current panels as the **Live Batch** workspace.
3. Add backlog list and task-detail drill-in first, because they unlock day-to-day operator use.
4. Add approvals inbox and richer history linking next.
5. Expand planning-aware context only when canonical planning files are available.

This sequencing preserves current functionality while progressively turning the dashboard into an Operator Console.