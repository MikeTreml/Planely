# Taskplane Operator Console v1 Product Brief

## Status

Draft for TP-180.

## Purpose

Define the first operator-facing product layer that turns Taskplane from a capable orchestration engine plus runtime monitor into a practical daily-use project application for human operators.

This brief is intentionally grounded in the evidence available in this worktree snapshot:
- Taskplane is file-backed and local-first (`taskplane-tasks/`, `.pi/taskplane-config.json`).
- Follow-on task packets describe an existing execution model built around task packets, batches, waves/lanes, supervisor visibility, reviews, and a dashboard focused on live batch state.
- Follow-on task packets also establish the desired control-plane direction: the web UI becomes the primary operator surface, while Slack remains a lightweight companion.

Where this brief proposes MVP behavior that is not confirmed as already shipped, it is labeled as a proposal for Operator Console v1 rather than described as current behavior.

## Current-State Summary

### Observed strengths
- **Execution model clarity:** Taskplane already has stable operating concepts: task packets, batches, lanes, supervisor oversight, reviews, and explicit task status progression.
- **Inspectable state:** The system is grounded in files, which preserves auditability and allows operators to inspect packet contents directly.
- **Operational visibility:** Existing dashboard-related prompts consistently describe strong visibility into live batch state, lane activity, history, and supervisor context.
- **Composable follow-on work:** The staged tasks after TP-180 show that the current system is extendable through incremental dashboard/server enhancements instead of a full rewrite.

### Observed gaps
- **Weak backlog/project framing:** Current materials imply strong runtime visibility but weaker support for project-level planning, backlog triage, and work discovery outside active batches.
- **Limited task detail experience:** The existing operator surface appears optimized for live execution monitoring rather than rich task inspection and action-taking.
- **CLI-first operator actions:** Refresh, run, approval, and discovery flows appear to still rely heavily on commands and orchestration primitives instead of a complete operator workspace.
- **Implicit planning model:** Ideas, specs, initiatives, and related planning artifacts are not yet first-class concepts in the current documented surface.

### Non-goals for this product brief
- Replacing Taskplane’s execution engine with a second runtime
- Making Slack the system of record
- Introducing a database-first architecture without evidence
- Designing a generalized PM platform beyond Taskplane’s scope
- Claiming unsupported dashboard/runtime features already exist today

## Problem Statement

Taskplane is strong at orchestrating execution once work has already been packaged into task packets and launched, but it is not yet described as a complete operator workspace for deciding what to do next, inspecting candidate work, and managing a project’s flow from idea to execution.

Operators need a control surface that helps them:
- understand what work exists across a project,
- see what is ready, blocked, running, or waiting on approval,
- inspect the relationship between planning artifacts and executable packets,
- take safe next actions without dropping constantly into CLI/slash-command flows, and
- preserve the auditability and deterministic execution behavior that make Taskplane trustworthy.

The product opportunity is to add a practical operator application on top of Taskplane’s existing execution core, not to replace that core.

## Product Thesis

**Taskplane Operator Console** is the web-based operator workspace that sits above Taskplane’s file-backed execution engine.

Its job is to make Taskplane usable as a day-to-day project control plane by combining:
- planning-aware context,
- backlog and task inspection,
- live runtime monitoring,
- safe operator actions,
- approval visibility, and
- navigable history.

The Operator Console should feel like a project app for operators while remaining architecturally honest: Taskplane still decides and records execution state through its canonical files and orchestrator flows.

## Target Personas and Core Use Cases

### Primary persona: hands-on operator
A technical operator running one or more Taskplane-managed projects who needs to continuously triage work, start batches, inspect failures, and manage approvals.

Primary use cases:
- Review backlog and identify ready vs blocked work
- Start execution from vetted task packets
- Monitor active batches and lane progress
- Inspect an individual task packet, run history, and artifacts
- Approve, reject, retry, skip, or integrate through safe operator controls
- Navigate from a notification or history item back to the underlying task or batch

### Secondary persona: supervisor/reviewer
A person who needs runtime awareness, review visibility, and clear links from a decision request back to underlying artifacts.

Primary use cases:
- Understand what is running and what needs attention
- Review pending approvals and associated evidence
- Trace decisions and outcomes through auditable files and artifacts

### Tertiary persona: planner/maintainer
A person shaping upcoming work who needs visibility into how ideas and specs become executable task packets.

Primary use cases:
- Connect higher-level planning artifacts to concrete executable work
- Understand whether execution outcomes are creating follow-up work or blockers
- Maintain a coherent project view without inventing a separate planning system of record

## Why Taskplane Must Remain the Execution Engine of Record

The Operator Console should not become a second orchestration layer.

Taskplane must remain the execution engine of record because it already provides the important properties the console depends on:
- **Canonical file-backed state:** task packets, status files, artifacts, and execution outputs remain inspectable on disk.
- **Deterministic operational model:** batches, lanes, supervisor oversight, and review flows are established Taskplane concepts that downstream features can build on.
- **Auditability:** operators need to answer what ran, why it ran, who approved it, and what artifacts resulted. That answer should come from Taskplane’s runtime artifacts, not a separate UI-only state store.
- **Incremental adoption:** follow-on UI work can layer on top of current primitives rather than recreate scheduling, task dependency, review, or integration logic.
- **Safety:** keeping runtime authority in Taskplane reduces the risk that the UI and engine drift apart.

Design implication: the Operator Console may present richer derived views and safer interaction flows, but it must map actions back to real Taskplane commands, packet state, or runtime artifacts.

## Why Web UI Is Primary and Slack Is Secondary

The web UI should be the primary control surface because the operator needs dense, navigable, stateful context that Slack cannot provide well.

### Web UI advantages
- It can show backlog, task detail, live batches, approvals, and history together.
- It supports deep inspection of packet contents, dependencies, artifacts, and related planning context.
- It is better suited for multi-step operator workflows such as launch, diagnose, retry, skip, or integrate.
- It can preserve spatial navigation and filtering across projects, batches, and tasks.

### Slack’s role
Slack should be a companion surface for:
- awareness and notifications,
- lightweight status lookup,
- simple approvals when the risk is low and context is linked, and
- deep-linking the operator back into the web console.

Slack should not be the canonical workspace because it is poor at sustained navigation, dense project context, and long-lived inspectable state. The product should therefore treat Slack as a remote-control companion, not the primary operating environment.

## MVP Scope for Operator Console v1

Operator Console v1 should focus on the minimum surface area that materially improves day-to-day operation without changing Taskplane’s execution architecture.

### In scope
1. **Backlog and project work discovery**
   - Show discovered task packets outside active batch-only views
   - Distinguish ready, blocked, running, completed, and approval-waiting states through derived operator-friendly statuses
2. **Task detail and context**
   - Show packet metadata, dependency/readiness status, latest activity, related run/batch context, and key artifacts
3. **Live execution views retained and integrated**
   - Preserve existing runtime-focused views for active batches, lanes, history, and supervisor visibility
4. **Operator action affordances**
   - Provide safe actions for launching, inspecting, approving, retrying, skipping, or integrating where Taskplane already has real backing behavior
5. **Project navigation**
   - Add lightweight project/workspace navigation so operators can move between active and recent projects without treating the current root as the only context
6. **Planning-aware context**
   - Introduce the minimum file-backed planning concepts needed to relate ideas/specs/initiatives to task packets, without replacing packet-centric execution
7. **Slack companion hooks**
   - Define notifications and deep links that route users back to the web console for full context

### Explicit non-goals for v1
- Rewriting the dashboard/frontend from scratch
- Replacing Taskplane runtime scheduling, review, or integration semantics
- Building a database-backed PM system
- Making planning artifacts more authoritative than task packets and runtime files
- Designing a full workflow-builder or generalized visual automation suite in this phase
- Moving complex operator workflows primarily into Slack
- Adding auth/account/multi-tenant systems unless required by a separate task

## UX Principles for v1

- **Execution truth stays in Taskplane.** UI state is derived, not canonical.
- **Start from operator questions.** Every primary view should answer a concrete question such as “what is ready?”, “what is blocked?”, or “what needs my approval?”
- **Preserve inspectability.** Operators should be able to trace UI summaries back to files, packets, runs, and artifacts.
- **Prefer incremental extension over replacement.** Existing live runtime strengths should be preserved and embedded, not discarded.
- **Make safe actions obvious.** The UI should surface recommended next actions, but only when those actions correspond to real Taskplane behavior.
- **Use Slack to route attention, not hold canonical state.** Notifications should pull users toward the web console when context density matters.

## Success Criteria for Operator Console v1

Operator Console v1 is successful when all of the following are true:

1. **Operators can manage work without relying on CLI-first discovery.**
   - A user can identify available work, readiness, and major blockers from the console.
2. **The console expands Taskplane beyond active-batch monitoring.**
   - The product now supports backlog, task detail, approvals, and project navigation in addition to live run views.
3. **Taskplane remains the runtime authority.**
   - All operator-visible statuses and actions map back to canonical Taskplane files, packets, or orchestrator-supported behaviors.
4. **Planning context is connected but not duplicated as a second source of truth.**
   - Operators can understand how ideas/specs/initiatives relate to execution without creating conflicting canonical records.
5. **Slack use is intentionally secondary.**
   - Notifications and lightweight actions exist, but the richest workflows still happen in the web console.
6. **Implementation can proceed incrementally.**
   - Follow-on tasks can ship backlog views, task details, navigation, planning storage, and Slack companion behaviors in phases without revisiting core product principles.

## MVP Boundaries and Forward Path

This brief sets up a phased expansion path:
- first make the dashboard into an operator console,
- then add richer task authoring and planning surfaces,
- then add companion integrations and templates.

The key architectural rule is unchanged across phases: the operator experience may broaden, but Taskplane remains the trusted execution substrate underneath it.
