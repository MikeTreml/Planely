# Flow Composer Compile and Execution Model

## Status

Draft for TP-191.

## Purpose

Define how a validated Flow Composer definition becomes Taskplane-compatible execution behavior without introducing a second runtime.

This document answers:
- how visual blocks map to Taskplane concepts,
- what artifacts exist between editing and execution,
- how multi-agent role assignment is represented safely,
- how loops and parallel groups stay bounded, and
- what guardrails prevent ambiguous or runaway flows.

## Compile-Model Principles

1. **Taskplane remains the execution engine of record.**
2. **The visual flow is authored once but represented in multiple forms for different purposes.**
3. **Compile output must be inspectable and reproducible.**
4. **Block metadata may express operator intent, but runtime state is still derived by Taskplane.**
5. **Any flow feature that cannot be compiled into bounded Taskplane-compatible behavior is out of MVP scope.**

## Three Distinct Artifacts

The MVP should distinguish three related but different artifacts.

## 1. Saved flow definition

This is the operator-authored composition artifact.

It stores:
- flow identity and title
- block graph/container structure
- block metadata such as goals, agent-role hints, retries, and expected artifacts
- template origin
- validation version and editor metadata

It does **not** store:
- live execution state
- lane assignment results
- runtime approvals/results
- batch/run history

Role:
- source artifact for editing, preview, and reuse

## 2. Bounded intermediate compile JSON

This is an implementation-facing normalized representation generated from the saved flow definition.

It stores:
- canonicalized block tree/graph within MVP constraints
- explicit execution order/grouping
- validated metadata with defaults applied
- compile-time diagnostics/warnings
- resolved references to template semantics and supported block types

Role:
- stable bridge between the visual editor and runtime-launch preparation
- makes preview and launch generation deterministic

Important boundary:
- this JSON is a compile artifact, not a second scheduler
- it describes what should be launched, not what is currently running

## 3. Taskplane launch artifact(s)

This is the execution-facing output generated from the bounded intermediate form.

Depending on the flow, it may produce:
- task packets,
- packet templates/fill-ins,
- an orchestration launch plan,
- approval/checkpoint requests tied to launch-time execution,
- preview data shown before starting `/orch`

Role:
- the nearest artifact to real execution
- feeds existing Taskplane primitives instead of bypassing them

## End-to-End Compile Pipeline

```text
Flow Composer UI
  -> saved flow definition
  -> normalized compile JSON
  -> Taskplane launch artifact(s)
  -> existing Taskplane execution
     (task packets, batches, waves, lanes, reviews, approvals, integration)
```

The UI owns authoring and preview.
Taskplane owns actual execution.

## Visual Flow to Taskplane Mapping

The core MVP mapping should be expressed in Taskplane-native terms.

| Flow Composer concept | Taskplane-compatible mapping |
|---|---|
| Flow definition | reusable composition artifact above execution |
| Primitive executable block | one planned execution unit that becomes one packet or one packet-generation template |
| Sequence container | ordered task or stage relationship |
| Parallel container | sibling execution units eligible for the same wave when dependencies allow |
| Loop container | bounded repeated launch/decision pattern compiled into explicit retry/review cycle rules |
| Wait for Human / Approve | approval or pause boundary surfaced through Taskplane-supported human checkpoints |
| Role/model metadata | assignment hints carried into packet/launch metadata, not direct process control |
| Flow run | normal Taskplane batch/run behavior after launch |

The critical idea is that Flow Composer blocks describe **how to prepare and group work**, while Taskplane still decides **how that work runs and is recorded**.

## Primitive Block Compile Targets

### Plan
Compiles to:
- a plan-oriented task packet or packet template
- optional downstream references indicating which blocks consume the resulting plan artifact

### Implement
Compiles to:
- one or more implementation task packets, usually one per implement block
- dependency edges from planning/review prerequisites

### Review
Compiles to:
- a review boundary associated with the target packet/stage
- review-type metadata such as plan review or code review when supported by Taskplane's existing review model

### Test
Compiles to:
- a verification task packet or a packet-level verification stage
- explicit evidence expectations for pass/fail reporting

### Approve / Wait for Human
Compiles to:
- a human decision boundary that must complete before downstream launch or integration continues
- evidence requirements for the operator-facing approval context

### Integrate
Compiles to:
- Taskplane-backed integration intent, usually near the end of a flow
- integration prerequisites derived from prior block outcomes

### Notify
Compiles to:
- informational events/messages or post-stage notifications
- no control-flow authority in MVP

## Representation Shape for the Bounded Intermediate JSON

The compile format should stay intentionally small.

A normalized flow representation should include concepts like:

- `flowId`
- `version`
- `root`
- `blocks[]`
- `edges[]` or parent/child references
- `launchUnits[]`
- `humanCheckpoints[]`
- `compileDiagnostics[]`
- `constraints` summary

### Recommended semantic fields

Each normalized block should include:
- `id`
- `kind`
- `title`
- `goal`
- `metadata`
- `parentId`
- `executionMode` (`sequential`, `parallel-child`, `loop-body`, `human-gated`)
- `dependsOn[]`
- `produces[]`
- `consumes[]`
- `assignmentHints`

This format is for deterministic compilation and preview. It is not a live runtime state object.

## Multi-Agent Role Assignment Without a Second Runtime

This is the most important execution-boundary rule for the MVP.

Flow Composer may let the operator specify metadata such as:
- `agentRole` (`planner`, `developer`, `reviewer`, `tester`, `supervisor-helper`)
- `modelPreference`
- preferred review intensity
- concurrency intent

But these values compile only into **assignment hints** or **launch-time metadata**.

They must not directly create:
- custom worker pools,
- a UI-owned session scheduler,
- ad hoc process-topology rules outside Taskplane,
- a second state machine for agent lifecycle.

### Safe role-assignment model

1. Operator sets role/model intent on blocks.
2. Compile step normalizes those settings into packet/launch metadata.
3. Taskplane launch logic interprets the metadata using its existing worker/reviewer/orchestrator model.
4. Actual lane assignment, reviewer spawning, and process supervision remain Taskplane responsibilities.

### Practical implication

A flow can say:
- this block is intended for a planner-style agent,
- this block prefers reviewer behavior,
- these two implement blocks may run in parallel,

but it cannot say:
- spin up a custom agent graph unknown to Taskplane,
- dynamically add a new reviewer class at runtime,
- create a custom scheduler separate from wave/lane assignment.

### Compile target for role metadata

Role/model fields should land in one of these places:
- packet-local metadata used when generating prompts/instructions
- orchestration-plan hints that influence eligible execution posture
- approval/review metadata that tells the UI what kind of human or reviewer context is expected

They should **not** become canonical runtime truth beyond what Taskplane already records in its normal artifacts.

## Parallel Semantics

Parallel blocks should compile to sibling launch units that are eligible to run in the same wave when dependency analysis allows.

### Allowed MVP case

Example:
- Implement API
- Implement UI
- Test API

If modeled safely, the compile layer can produce:
- one launch unit for API implementation,
- one launch unit for UI implementation,
- downstream test/review units that depend on the right predecessors.

Taskplane then handles actual wave and lane assignment.

### Constraints

- parallel group size stays below a hard cap;
- all child blocks must have explicit output ownership;
- join condition is explicit, usually "all required children complete";
- nested parallel groups are deferred;
- parallel children cannot depend on values produced dynamically at runtime by sibling blocks.

### Deferred example

Not allowed in MVP:
- a parallel block that spawns an arbitrary number of tasks from a runtime-generated file list or model output.

That would require dynamic scheduling semantics better suited to a new runtime, which the MVP must avoid.

## Loop Semantics

Loop blocks must compile to **bounded repeated execution intent**, not open-ended control flow.

### Allowed MVP cases

1. **Fixed retry count**
   - Example: Review -> Implement fixes -> Review, up to 2 times
2. **Bounded verification retry**
   - Example: Test -> Implement fixes -> Test, max 2 iterations
3. **Human-gated repeat**
   - Example: Wait for approval -> if revisions requested, rerun a named sub-sequence up to a cap

### Compile strategy

A loop compiles into:
- a loop body reference,
- a permitted stop condition from a fixed vocabulary,
- a `maxIterations` cap,
- a plain-language explanation used in preview and validation,
- explicit downstream behavior after success or exhaustion.

### Constraints

- loop body is one block or a small sequence;
- no nested loops;
- no parallel-in-loop in MVP;
- no runtime-created new blocks;
- exhaustion must resolve to a safe terminal or escalation state.

### Deferred example

Not allowed in MVP:
- "Keep generating tasks until the model thinks the feature is done."

That statement cannot be compiled into a bounded, auditable Taskplane pattern without inventing a second runtime authority.

## Guardrails

## 1. Runtime authority guardrail

Execution truth remains in:
- task packets,
- `STATUS.md`,
- reviews,
- approvals,
- run/batch state,
- integration artifacts.

The flow definition and compile JSON never replace those records.

## 2. Bounded-structure guardrail

Only approved block kinds and container shapes may compile.
Unsupported structures fail validation before launch.

## 3. Explainability guardrail

Every validated flow must have a plain-language execution summary the operator can read before launch:
- what runs in order,
- what may run in parallel,
- where human decisions happen,
- what can repeat and how many times.

## 4. Determinism guardrail

The same saved flow plus the same defaults should produce the same normalized compile JSON.
Random or hidden compile behavior is not acceptable.

## 5. No fake capability guardrail

If a launch/mutation path is not actually wired into Taskplane yet, the UI may preview the compile result but must not imply that the run is fully executable.

## 6. Safety-over-flexibility guardrail

If a requested flow shape is ambiguous, the compiler should reject it and explain why rather than guess.

## Launch and Preview Behavior

Before execution, the operator should see a preflight summary that includes:

- generated launch units or packet count
- sequence and parallel stages
- human checkpoints
- loop bounds
- role/model hints by block
- validation warnings or unsupported features
- explicit statement that execution will occur through normal Taskplane runtime behavior

This preview is part of the UX contract that keeps Flow Composer honest about being a composition layer.

## Incremental Implementation Path

This compile model supports a staged rollout.

### Phase 1
- save template-backed flow definitions
- validate block trees
- render execution preview only

### Phase 2
- generate bounded intermediate compile JSON
- generate draft packet/launch artifacts
- support operator inspection before launch

### Phase 3
- wire selected validated flows into real Taskplane-backed launch behavior
- reuse existing backlog/live batch/approval/history surfaces after launch

## Open Questions for Follow-on Tasks

- exact on-disk location and schema versioning for saved flow definitions;
- whether compile JSON should be persisted or regenerated on demand;
- how packet-generation templates should be stored and edited;
- which assignment hints Taskplane should actually honor in v1 versus merely display;
- what UI affordances best explain rejected/deferred flow shapes.

## Summary

Flow Composer MVP should compile visual flows into bounded, inspectable artifacts that feed the existing Taskplane runtime.

That means:
- visual authoring is allowed;
- normalized compile artifacts are allowed;
- assignment hints are allowed;
- bounded loops and parallel groups are allowed;
- a second scheduler, freeform automation runtime, or UI-owned execution truth is not allowed.
