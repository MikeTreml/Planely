# Flow Composer MVP

## Status

Draft for TP-191.

## Purpose

Define the first bounded product/spec for a visual **Flow Composer** in the Operator Console.

The composer should let operators assemble common multi-agent development flows from the interface using safe, understandable blocks. It is a UX and composition layer above Taskplane's existing runtime, not a replacement scheduler or a generalized automation platform.

## Problem Statement

Taskplane already gives operators strong execution primitives once work has been broken into task packets and launched through orchestrator flows. What is still missing is a simpler way to shape a repeatable delivery flow such as:

- plan work,
- assign implementation,
- request review,
- run tests,
- pause for approval, and
- integrate when conditions are met.

Today that flow largely lives in operator knowledge, task packet authoring patterns, and command choices. Operators need a more guided way to compose these patterns from the console without having to invent orchestration semantics from scratch each time.

The product opportunity is therefore to let the operator compose a recognizable workflow visually while preserving the same execution truth Taskplane already owns: task packets, batches, waves, lanes, reviews, approvals, and integration behavior.

## User Goals

A Flow Composer MVP should help operators:

1. **Start from a proven flow shape instead of a blank authoring surface.**
2. **Express a small multi-step, multi-agent workflow visually** without writing a new orchestrator.
3. **See where human approval and review boundaries occur** before execution starts.
4. **Understand how the visual flow will execute in Taskplane terms** such as tasks, parallel work, and batch stages.
5. **Reuse and adapt common delivery patterns** for future work.

## Product Thesis

Flow Composer is a **workflow-design surface for the Operator Console**, not a second runtime.

That means:

- the operator works with blocks and containers in the UI;
- the composer validates that the flow stays within bounded, safe semantics;
- the resulting flow compiles into Taskplane-compatible planning/execution inputs;
- Taskplane remains the execution engine of record for actual runs, state, reviews, approvals, and artifacts.

The composer adds clarity and reuse at the UX layer. It does not replace:

- task packets as the executable work unit,
- orchestrator batches/waves/lanes as the concurrency model,
- review/approval loops as execution control points, or
- file-backed runtime artifacts as the system of record.

## Why This Is a Composition Layer, Not a New Orchestrator

A clean MVP must preserve the architecture already established for Operator Console and Taskplane:

- **Taskplane already owns execution semantics.** It knows how to discover tasks, compute dependencies, run waves, assign lanes, supervise workers, request reviews, and integrate results.
- **Operator Console already aims to be a planning/navigation layer.** Flow Composer should fit beside backlog, task detail, approvals, and live batch views instead of creating a separate workflow engine.
- **File-backed artifacts remain authoritative.** The visual model may be richer than raw packet authoring, but it must compile to inspectable Taskplane-compatible artifacts rather than live only in client-side state.
- **Safety depends on bounded semantics.** If the composer becomes an open-ended automation canvas, it will drift into its own scheduling and runtime authority.

Design rule: if a flow behavior cannot be explained as a safe transformation into existing Taskplane concepts, it is out of scope for the MVP.

## MVP Scope

The MVP is intentionally two-layered.

### 1. Templates first

The first operator experience should begin from a small set of built-in flow templates rather than a blank canvas.

Examples:
- Plan -> Implement -> Review -> Approve -> Integrate
- Plan -> Parallel Implement/Test -> Review -> Approve
- Implement -> Test -> Review

Template-first delivery keeps the product grounded in proven patterns and reduces the need for operators to understand every control primitive immediately.

### 2. Bounded block composition second

After starting from a template, the operator can make limited edits using a small safe block vocabulary:

- add, remove, or rename supported blocks;
- reorder steps inside a sequence;
- place selected steps into a bounded parallel group;
- wrap a step or group in a constrained loop container;
- insert explicit human approval/wait points.

The editing model should feel composable without becoming freeform programming.

## In-Scope Capabilities

The MVP should include:

1. **Template selection**
   - start a flow from a small library of common software-delivery patterns
2. **Block-based flow editing**
   - edit a bounded graph made from approved primitive and container blocks
3. **Execution preview**
   - show how the flow maps to Taskplane concepts such as task packets, reviews, approvals, and parallel groups
4. **Role-aware configuration**
   - capture intended agent role/model preference at the block level without changing runtime authority
5. **Human checkpoints**
   - support approval and wait states where operator confirmation is required
6. **Reusable saved flow definitions**
   - let the operator save a flow as a reusable composition artifact for later launches

## Explicit Non-Goals

The MVP must not try to become:

- a full drag-and-drop automation builder with arbitrary graph editing;
- a generalized no-code platform;
- a scripting surface with custom code-execution blocks;
- a replacement for task packets, `/orch`, or the existing review/integration model;
- an engine for unbounded branching, event-driven triggers, or dynamic workflow mutation during execution;
- a hidden second source of truth for execution status.

## Initial Operator Flows

## 1. Create a flow from template

1. Operator opens Flow Composer from the Operator Console.
2. Console shows a small template gallery with labels, intent, and risk notes.
3. Operator selects a template such as **Plan -> Implement -> Review -> Approve -> Integrate**.
4. Composer opens a visual sequence with editable block metadata.
5. Console shows an execution preview describing how the flow would compile into Taskplane-compatible work.

### Result
The operator can start from a known-safe pattern instead of designing execution structure from scratch.

## 2. Adjust a bounded flow

1. Operator edits titles, goals, roles, and selected block options.
2. Operator may insert a supported block, form a parallel group, or add a human wait point.
3. Composer validates the flow continuously and highlights unsupported or unsafe structures.
4. Preview updates to show expected reviews, approval gates, and execution boundaries.

### Result
The operator gets flexibility within explicit limits rather than open-ended visual programming.

## 3. Save or launch the flow

1. Operator chooses **Save as reusable flow** or **Prepare run**.
2. If saving, the system stores the flow definition as a bounded composition artifact.
3. If preparing a run, the system compiles the flow into Taskplane-compatible inputs and shows a preflight summary.
4. Operator confirms the run through normal Taskplane-backed launch behavior.
5. Once launched, execution moves into existing Taskplane views such as Backlog, Live Batch, Approvals, and History.

### Result
Flow Composer is the front door for shaping execution, while Taskplane remains the place where execution actually happens.

## UX Constraints for MVP

- **Template-first over blank-canvas-first**
- **Sequence-first mental model with limited containers**
- **Preview every compile consequence before launch**
- **Prefer informative validation over permissive ambiguity**
- **Always preserve a readable mapping back to Taskplane terms**

## Success Criteria

The MVP is successful when:

1. operators can assemble a recognizable multi-agent delivery flow without hand-authoring orchestration structure from zero;
2. the flow remains understandable in Taskplane execution terms;
3. the supported block set is small enough to validate safely;
4. the UI does not imply a second runtime or hidden scheduler; and
5. future implementation can proceed incrementally: template library first, bounded editor next, compile preview after that.

## Deferred Beyond MVP

The following ideas should stay out of v1 even if they are attractive later:

- arbitrary graph branching/merging semantics;
- dynamic loops that depend on runtime-created block structure;
- event-driven triggers from external systems;
- custom script/code blocks;
- conditional expressions powerful enough to act like a programming language;
- agent swarms or elastic fan-out that bypass Taskplane's existing batch/wave controls.

## Relationship to Follow-on Specs

This MVP document defines the product boundary.

The implementation-facing follow-on documents should answer:
- **what blocks exist and what metadata they carry?** (`flow-block-model.md`)
- **how does a validated visual flow compile into Taskplane-compatible execution artifacts?** (`flow-composer-compile-model.md`)
