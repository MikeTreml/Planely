# Taskplane Operator Console v1 Roadmap

## Status

Draft for TP-180.

## Purpose

Sequence the Operator Console initiative into implementation phases that can be delivered incrementally without replacing Taskplane’s runtime core.

This roadmap assumes the current system is strongest in execution orchestration and live runtime visibility, and that new work should progressively add operator-facing planning and control surfaces on top of those existing strengths.

## Sequencing Principles

1. **Start with operator value that fits the current dashboard/runtime shape.**
2. **Keep Taskplane as the execution engine of record in every phase.**
3. **Introduce planning context only after the console can surface execution clearly.**
4. **Add Slack only after the web console provides the authoritative operator experience.**
5. **Defer abstractions such as templates/workflow composition until real operator patterns are visible.**

## Phase Order

1. **Operator Console foundation**
2. **Task authoring**
3. **Planning layer**
4. **Slack companion**
5. **Workflow templates**

## Why This Sequence

### 1) Operator Console foundation comes first
This is the highest-leverage starting point because it improves day-to-day usability of the current system without changing how execution fundamentally works.

The console foundation should evolve the existing dashboard from a live batch monitor into an operator workspace by adding:
- backlog/work discovery,
- task detail,
- better navigation,
- runnability/diagnostic visibility,
- manual refresh/query controls, and
- operator-safe actions.

This phase is also the prerequisite for the others:
- task authoring needs a place to live,
- the planning layer needs a UI surface to be useful,
- Slack needs deep-link destinations and a clear primary surface,
- templates need observed operator workflows to standardize.

### 2) Task authoring follows
Once operators can see backlog and task state clearly, the next bottleneck is creating and editing work without dropping fully into manual packet handling.

Task authoring is sequenced before the planning layer because it is closer to the existing execution model. It directly improves throughput while still staying packet-centric.

### 3) Planning layer comes after task authoring
Planning artifacts such as ideas, specs, and initiatives are important, but they should be introduced only after the console and authoring flow make execution work visible and actionable.

This reduces the risk of designing an abstract planning system that is disconnected from actual execution behavior.

### 4) Slack companion comes after the web console
Slack should reinforce, not define, the operator experience. Its value depends on the console already having meaningful task, batch, approval, and history destinations.

Sequencing Slack later avoids prematurely optimizing a secondary surface or turning Slack into a hidden system of record.

### 5) Workflow templates come last
Templates and reusable workflow patterns should be informed by what operators actually do once the console, authoring, and planning layers exist.

Delivering templates too early would lock in assumptions before the product has enough evidence about common project types and operator flows.

## Phase 1: Operator Console Foundation

### Goal
Turn the current dashboard into a practical operator workspace while preserving its existing runtime-monitor strengths.

### Candidate milestone 1.1 — Backlog visibility
Scope:
- surface discovered task packets outside active batches,
- show operator-friendly statuses such as ready, blocked, running, and done,
- preserve existing live batch views.

Acceptance criteria:
- Operators can answer “what work exists?” without starting a batch first.
- Backlog statuses are derived from canonical packet/runtime state.
- Empty, mixed-status, and malformed-task states are handled safely.

### Candidate milestone 1.2 — Task detail and operator actions
Scope:
- add task detail inspection,
- show runnability/diagnostics,
- expose safe actions such as run selected, retry, skip, approve, or integrate only where backed by real Taskplane behavior.

Acceptance criteria:
- Operators can inspect why a task is runnable or blocked.
- Users can navigate from a backlog item to its details and related batch/run context.
- UI actions do not invent a second execution path outside Taskplane.

### Candidate milestone 1.3 — Navigation and project context
Scope:
- add project sidebar or equivalent navigation,
- support recent/archive/project switching,
- improve refresh/query controls for multi-project operation.

Acceptance criteria:
- Operators can move between projects/workspaces without losing runtime clarity.
- Console state remains coherent with current workspace/repo assumptions.
- Existing dashboard usability is preserved on narrower layouts.

### Phase 1 exit criteria
- The dashboard now functions as an Operator Console, not just a passive monitor.
- Operators can discover work, inspect details, and take basic safe actions in the web UI.
- Taskplane remains the runtime authority for all surfaced statuses and mutations.

## Phase 2: Task Authoring

### Goal
Enable operators to create or refine executable task packets from the console without replacing packet-based execution.

### Candidate milestone 2.1 — Task creation form and preview
Scope:
- guided task creation,
- packet preview before write/launch,
- validation against Taskplane packet expectations.

Acceptance criteria:
- Operators can author a valid packet draft from the UI.
- Generated packets remain inspectable files, not hidden records.
- The authoring path is compatible with existing runtime discovery/execution.

### Candidate milestone 2.2 — Authoring safety and ergonomics
Scope:
- dependency previews,
- destination/area selection,
- confirmation and diff-style review before writing.

Acceptance criteria:
- Authoring reduces packet creation friction without hiding canonical file outcomes.
- The UI makes it obvious what will be written and where.

### Phase 2 exit criteria
- Task creation is available through the console.
- Packet generation remains faithful to Taskplane’s execution model.
- Operators can move from work discovery to packet creation without falling back to ad hoc manual setup.

## Phase 3: Planning Layer

### Goal
Introduce the minimum file-backed project planning model above task packets.

### Candidate milestone 3.1 — Planning artifact schema
Scope:
- define ideas, specs, initiatives, and related storage conventions,
- relate them to existing packets and execution outcomes.

Acceptance criteria:
- Planning artifacts have a clear canonical file layout.
- The model does not duplicate runtime authority already held by packets, batches, or runs.

### Candidate milestone 3.2 — Planning-aware console views
Scope:
- show relationships between ideas/specs/initiatives and task packets,
- make project progress easier to understand from both planning and execution angles.

Acceptance criteria:
- Operators can trace execution back to planning intent.
- Planning artifacts provide context without becoming a second execution system.

### Phase 3 exit criteria
- Planning artifacts exist as inspectable files.
- Operator Console can relate planning context to executable work and results.
- Source-of-truth boundaries between planning and execution remain explicit.

## Phase 4: Slack Companion

### Goal
Provide remote awareness and lightweight control without displacing the web console.

### Candidate milestone 4.1 — Notifications and lookup
Scope:
- notify on approvals, failures, important state changes,
- allow lightweight status lookup,
- include deep links to task/batch/project views.

Acceptance criteria:
- Notifications improve responsiveness without requiring Slack as the primary workspace.
- Every Slack message links back to richer web context when needed.

### Candidate milestone 4.2 — Safe lightweight actions
Scope:
- support low-risk actions such as approve/reject or status refresh requests if mapped to real Taskplane behavior.

Acceptance criteria:
- Slack actions are limited to explicitly safe, auditable operations.
- All Slack mutations create or map back to canonical Taskplane-backed records.

### Phase 4 exit criteria
- Slack is useful for awareness and quick decisions.
- The web console remains the primary operator environment.
- No Slack flow becomes the only place where important state exists.

## Phase 5: Workflow Templates

### Goal
Capture recurring operator workflows as reusable templates after real usage patterns are known.

### Candidate milestone 5.1 — Template catalog
Scope:
- define a lightweight representation for common task/flow scaffolds,
- expose template selection in the console.

Acceptance criteria:
- Templates accelerate repeated work without replacing direct packet visibility.
- Template outputs remain Taskplane-compatible artifacts.

### Candidate milestone 5.2 — Guided workflow setup
Scope:
- prefilled parameters, common approval checkpoints, recommended packet groupings, or flow-composition hooks if justified by later evidence.

Acceptance criteria:
- Templates reduce setup time for known patterns.
- Operators can still inspect and modify the generated Taskplane-compatible artifacts.

### Phase 5 exit criteria
- Reusable workflow starting points exist for common project patterns.
- Template abstractions are grounded in proven operator needs rather than speculative design.

## Risks, Tradeoffs, and Deferrals

### Risk: overpromising current capabilities
Because the referenced architecture/dashboard/OpenClaw source docs are not present in this worktree snapshot, there is a risk of presenting proposed Operator Console behavior as already implemented.

Mitigation:
- keep roadmap language explicitly future-facing,
- tie each milestone to follow-on task packets rather than assumed existing features,
- preserve Taskplane runtime guardrails in every phase.

### Risk: creating a second source of truth
A richer console can tempt the product toward storing statuses, approvals, or planning state in UI-specific structures.

Mitigation:
- require canonical file-backed ownership for any durable state,
- treat dashboard/Slack surfaces as derived views and action frontends.

### Tradeoff: faster UI ergonomics vs architectural honesty
Operators want convenience, but convenience features that bypass Taskplane would create drift.

Decision:
- favor incremental derived views and command-backed actions over shortcut implementations that obscure canonical behavior.

### Tradeoff: planning richness vs execution focus
Adding planning artifacts too early could distract from the product’s strongest current value: execution visibility and control.

Decision:
- sequence planning after console foundation and task authoring so it remains tightly connected to real execution flows.

### Deferred beyond this roadmap slice
- generalized visual workflow builders beyond scoped MVP work
- auth/account systems and multi-tenant concerns
- database-backed indexing or cloud control-plane assumptions
- advanced automation abstractions not yet justified by repeated operator patterns

## Overall Acceptance Signal

The roadmap is working if each phase makes Taskplane feel more like a practical operator product while preserving a single invariant:

**Taskplane remains the trusted execution substrate, and every new console/Slack/template layer is an additive control surface on top of that substrate.**
