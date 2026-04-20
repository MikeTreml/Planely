# Flow Composer Block Model

## Status

Draft for TP-191.

## Purpose

Define the bounded block vocabulary for Flow Composer MVP so operators can compose recognizable software-delivery workflows without introducing a second execution runtime.

This document focuses on:
- the primitive blocks shown in the UI,
- the control/container blocks that shape execution order,
- the metadata carried by each block,
- safe defaults and validation rules, and
- the boundary between v1 blocks and deferred ideas.

## Model Principles

1. **Blocks describe intent and composition, not a new scheduler.**
2. **Every executable block must map cleanly to Taskplane-compatible behavior.**
3. **Container blocks may constrain order and grouping, but cannot create arbitrary programming semantics.**
4. **Defaults should bias toward reviewable, deterministic flows.**
5. **If a block needs freeform scripting to be useful, it is out of MVP scope.**

## Block Taxonomy

Flow Composer MVP uses two major categories:

- **Primitive blocks** — named units of operator intent such as plan, implement, review, or integrate
- **Control/container blocks** — bounded structural wrappers such as sequence, parallel, loop, or wait-for-human

## Primitive Blocks

## 1. Plan

**Purpose:** create or refine an implementation plan before execution fans out.

Typical use:
- turn a goal into structured execution intent
- identify work breakdown and success criteria
- produce implementation guidance for later blocks

Expected outputs:
- plan artifact or plan-oriented task packet
- clarified goals, risks, and proposed next actions

Default posture:
- single-agent
- required before large multi-step delivery templates
- review-friendly output emphasized over speed

## 2. Implement

**Purpose:** perform the main code/documentation/config changes for a scoped unit of work.

Typical use:
- write code
- edit docs
- apply bounded feature or fix work

Expected outputs:
- changed source files
- updated task status/checklists
- implementation artifacts suitable for follow-on review/test

Default posture:
- single-agent unless placed in an approved parallel container
- must carry a clear goal and scoped artifact target

## 3. Review

**Purpose:** inspect plan or implementation output through a reviewer boundary.

Typical use:
- plan review
- code review
- bounded quality check before approval/integration

Expected outputs:
- reviewer verdict
- findings or revision guidance
- explicit pass/revise outcome

Default posture:
- non-destructive
- references evidence from previous blocks
- should not silently mutate upstream implementation scope

## 4. Test

**Purpose:** run defined verification checks against prior work.

Typical use:
- targeted validation after implementation
- broader verification before approval/integration

Expected outputs:
- pass/fail outcome
- evidence links to logs/results
- explicit test scope summary

Default posture:
- deterministic, named verification scope
- not an arbitrary shell-script surface in v1

## 5. Approve

**Purpose:** request an operator decision before proceeding to a high-consequence step.

Typical use:
- approve merge/integration
- approve risky retry or continuation
- sign off on a reviewed change set

Expected outputs:
- approval request and recorded decision
- evidence links for operator context

Default posture:
- human-in-the-loop
- blocks downstream execution until a decision is recorded

## 6. Integrate

**Purpose:** complete the flow by merging or otherwise finalizing approved work through Taskplane-backed integration behavior.

Typical use:
- integrate completed orchestration output
- trigger merge-ready completion behavior

Expected outputs:
- integration result state
- history/audit evidence

Default posture:
- terminal or near-terminal block
- guarded by prior review/approval defaults in shipped templates

## 7. Notify

**Purpose:** emit a bounded informational message or attention signal.

Typical use:
- notify operator that review is ready
- send completion or blocker awareness
- hand off to a companion surface such as web inbox or Slack companion later

Expected outputs:
- message/notification artifact or event reference

Default posture:
- informational only
- no side effects on execution truth

## Control and Container Blocks

## 1. Sequence

**Purpose:** run child blocks in a fixed, top-to-bottom order.

Role in model:
- the default composition structure
- easiest operator mental model
- preferred container for most flows

Rules:
- requires at least one child block
- child order is explicit and stable
- downstream blocks cannot start until upstream completion/decision conditions are met

## 2. Parallel

**Purpose:** allow a small set of child blocks to proceed concurrently when they are independent.

Role in model:
- express bounded concurrency without exposing raw lane orchestration detail

Rules:
- all children must be individually valid executable blocks or sequences
- nested parallel groups are deferred in MVP
- fan-out count must stay under a configured hard limit
- the group must define how completion is evaluated: usually all children succeed, or a bounded allowed-failure policy if explicitly supported later

## 3. Loop

**Purpose:** repeat a child block or child group using constrained, non-programmable semantics.

Role in model:
- support narrow iterative patterns such as retry-until-reviewed or bounded fix/retest cycles

Rules:
- loop condition must come from an approved limited vocabulary
- max iterations is required
- loop body must be a single block or small sequence
- dynamic fan-out inside loops is not allowed
- loops cannot mutate flow structure while running

## 4. Wait for Human

**Purpose:** pause execution until an operator or designated human role provides input/approval.

Role in model:
- explicit human checkpoint separate from automated work
- can be used for clarification, approval, or release timing

Rules:
- must describe the awaited decision or input
- must link to evidence or context required for the human action
- timeout/escalation behavior must be explicit if supported

## Shared Block Metadata

Every block definition should share a common envelope so the UI, validation layer, and compile layer can reason about flows consistently.

### Required metadata

- `id` — stable flow-local identifier
- `kind` — block type such as `implement`, `review`, or `parallel`
- `title` — short operator-facing label
- `goal` — what the block is trying to achieve

### Common optional metadata

- `description` — longer operator-facing explanation
- `agentRole` — intended role/persona such as planner, developer, reviewer, supervisor
- `modelPreference` — optional preferred model/profile hint, not a runtime guarantee
- `inputs` — declared upstream artifacts or context requirements
- `outputs` — expected artifacts/evidence
- `successCondition` — bounded statement of what counts as success
- `failureHandling` — allowed retry/escalation behavior
- `retries` — explicit retry count when the block type supports it
- `timeout` — optional ceiling for waits or long-running work
- `artifacts` — evidence to retain or surface in preview/history
- `approvalPolicy` — whether human confirmation is required before or after the block
- `notes` — operator-visible commentary

## Type-Specific Metadata

### Primitive block fields

| Block | Key metadata |
|---|---|
| Plan | planning depth, expected output artifact, downstream audience |
| Implement | scope target, affected area, expected deliverable/artifact set |
| Review | review mode (`plan`/`code`/`quality`), evidence target, verdict policy |
| Test | test scope, required evidence, pass/fail reporting mode |
| Approve | approver role/channel, decision prompt, required evidence |
| Integrate | integration mode, target branch/context, prerequisites |
| Notify | channel/recipient hint, message intent, linked evidence |

### Container block fields

| Block | Key metadata |
|---|---|
| Sequence | child block order |
| Parallel | child list, max fan-out, join condition |
| Loop | loop condition type, max iterations, loop body |
| Wait for Human | awaited action, timeout/escalation, evidence links |

## Safe Defaults

MVP defaults should keep flows understandable and reviewable.

1. **Sequence is the default container.**
   - New templates should start as simple ordered flows.
2. **Human review/approval comes before integrate in shipped templates.**
   - Operators may remove steps only if validation still considers the flow safe for the chosen template class.
3. **Parallel groups are small and explicit.**
   - Prefer two to three children, not open-ended fan-out.
4. **Loops are off by default and always bounded.**
   - A max iteration cap is mandatory.
5. **Blocks declare expected evidence.**
   - Review, test, approve, and integrate blocks should surface what evidence they expect to consume.
6. **Model preference is advisory.**
   - It cannot redefine runtime authority or bypass project policy.
7. **Notify never drives execution branching in v1.**
   - Notifications inform humans; they do not behave like event triggers.

## Validation Rules

A valid MVP flow should satisfy the following rules.

### Structural rules

- A flow must have exactly one root container.
- Root container is usually `sequence`; `parallel` root is allowed only for approved templates if a clear join exists.
- Every non-root block must have exactly one parent container.
- Empty containers are invalid.
- Container nesting depth must remain small and bounded.

### Primitive-block rules

- Every primitive block must have `title` and `goal`.
- Implement, test, review, approve, and integrate blocks must declare a success or decision condition.
- Approve and Wait for Human blocks must declare the awaited human decision/input.
- Review blocks must name the evidence target they inspect.
- Notify blocks cannot be the only terminal action for a flow that claims delivery completion.

### Parallel rules

- Parallel groups require at least two children.
- Each child must be independently meaningful and safe to run concurrently.
- Parallel children may not share ambiguous ownership of the same intended output.
- Nested parallel groups are invalid in v1.
- A parallel group must define its join policy before downstream work is allowed.

### Loop rules

- Loop conditions must come from a fixed vocabulary such as:
  - `until-reviewed-pass`
  - `until-tests-pass`
  - `until-human-approval`
  - `retry-fixed-count`
- `maxIterations` is required and must stay below a hard cap.
- Loop body cannot contain another loop.
- Loop body cannot contain a parallel block in v1.
- The system must be able to explain in plain language what causes the loop to stop.

### Human-checkpoint rules

- Wait/approve blocks must identify who is being waited on or what role is expected.
- If timeout behavior exists, it must resolve to a safe state such as pause/escalate rather than implicit approval.
- Human checkpoints must expose evidence links in preview and run views.

### Runtime-boundary rules

- A block cannot imply custom script execution.
- A block cannot invent new runtime states outside Taskplane-compatible concepts.
- A block cannot own canonical execution truth that should remain in packets, runs, approvals, or batch artifacts.

## v1 Blocks

The following blocks are in scope for MVP:

- Plan
- Implement
- Review
- Test
- Approve
- Integrate
- Notify
- Sequence
- Parallel
- Loop
- Wait for Human

## Deferred Blocks and Ideas

The following should be explicitly deferred:

- conditional branching blocks with open-ended boolean logic;
- arbitrary script/code-execution blocks;
- event trigger blocks tied to external systems;
- data transformation or variable-manipulation blocks;
- nested loop + parallel combinations with complex semantics;
- dynamic fan-out blocks that create tasks from runtime-generated lists;
- merge/junction blocks that require a separate graph runtime;
- exception-handling blocks that encode full programming-language control flow.

## Why This Boundary Works

This block model is intentionally conservative:

- it covers the workflow language the operator has already described;
- it keeps the mental model close to software-delivery stages operators recognize;
- it can be validated with plain-language rules;
- it leaves execution authority with Taskplane instead of the canvas.

## Compile-Layer Implication

The block model only works if each supported block has a bounded compile target.

That follow-on question is handled in `flow-composer-compile-model.md`, which defines how these blocks map to task packets, reviews, approvals, orchestration plans, and safe intermediate flow definitions.
