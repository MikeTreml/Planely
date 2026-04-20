# Planning Artifact Schema

## Status

Draft for TP-185.

## Purpose

Define the minimum canonical planning artifacts that can sit above Taskplane task packets without replacing packet-centric execution.

This schema is intentionally conservative:
- planning artifacts capture **intent and grouping**,
- task packets, batches, runs, approvals, and runtime outputs remain the source of truth for **execution**,
- the console may render combined views, but the canonical records remain inspectable files.

## Scope

This document defines:
- artifact types,
- required and optional fields,
- source-of-truth boundaries,
- reference/linking rules to task packets and batches, and
- audit/history expectations.

It does **not** define the on-disk folder layout in detail; that is covered by `planning-storage-layout.md`.

## Artifact Set

Taskplane planning v1 should support four canonical artifact types:

1. **Idea** — an early opportunity, request, or problem statement
2. **Spec** — a concrete proposal that can drive executable work
3. **Initiative** — a larger outcome grouping multiple specs and/or workstreams
4. **Milestone** — a named checkpoint used to summarize progress inside an initiative

No additional first-class planning artifact types are required in v1.

Rationale:
- these four cover the intent ladder already implied by TP-180,
- they are understandable without introducing PM-platform complexity,
- milestone is justified because initiatives need explicit checkpoints that are more durable than free-form notes but less heavyweight than full specs.

## Shared Schema Shape

All planning artifacts should share a common envelope so they can be discovered, indexed, and rendered consistently.

### Required shared fields

- `kind` — one of `idea`, `spec`, `initiative`, `milestone`
- `id` — stable human-readable identifier unique within the project
- `title` — concise operator-facing label
- `status` — lifecycle state from the artifact's allowed vocabulary
- `summary` — short description of intent/outcome
- `createdAt` — ISO-8601 timestamp
- `updatedAt` — ISO-8601 timestamp

### Optional shared fields

- `owner` — person/role responsible for moving the artifact forward
- `tags` — lightweight classification labels
- `project` — optional project/workspace-local grouping label when useful
- `links` — structured external links or related docs
- `relationships` — references to other planning artifacts
- `executionLinks` — references to task packets or batches
- `history` — append-only notable planning events
- `notes` — non-canonical commentary that does not redefine execution truth
- `archivedAt` — timestamp if retired from active views

## Canonical vs Derived Boundary

This is the most important rule for the schema.

### Canonical planning fields

Planning artifacts are canonical for fields that describe:
- why work exists,
- what outcome is desired,
- how artifacts relate at the planning level,
- whether planning intent is proposed/approved/superseded/complete, and
- lightweight accountability such as owner, tags, and milestone targeting.

Examples:
- idea problem statement
- spec scope and acceptance criteria
- initiative outcome and priority framing
- milestone target outcome/date
- planning relationships such as "idea X led to spec Y"

### Runtime fields that planning artifacts must not own

Planning artifacts must **not** become canonical for:
- task execution status
- checklist state inside task packets
- batch lifecycle state
- run attempt history
- approval decisions/results
- generated outputs/logs/reviews
- dependency resolution outcomes already expressed by packets/runtime state

Examples of data that may be referenced but not copied as editable truth:
- whether a task packet is blocked or done
- the latest batch result
- run timestamps/outcomes
- approval state
- review artifacts or diffs

### Rule for mixed views

If an operator-console view shows a planning artifact together with task or batch status, the execution portion is a **projection** from runtime files. It must remain reproducible from packet/batch/run data.

## Not Stored Here

Planning files should not store editable copies of runtime authority.

Specifically, v1 planning artifacts should not contain:
- packet checklist mirrors
- mutable batch/run state fields
- approval inbox state
- duplicated runtime timestamps beyond optional evidence snapshots in history entries
- a second dependency system that competes with task packet dependencies
- UI-only cached rollups treated as canonical

If a field answers "what actually executed or completed?" it belongs to task/runtime artifacts, not the planning layer.

## Artifact Definitions

## 1. Idea

### Role

Capture an early work candidate before a full spec exists.

### Required fields

- shared required fields
- `problem` — fuller statement of the need, request, or opportunity

### Optional fields

- `origin` — where the idea came from (operator note, issue, conversation, incident, etc.)
- `proposedNextStep` — suggested follow-up such as write a spec or create an exploratory task packet
- `initiativeIds` — related initiatives by ID
- `specIds` — related specs by ID
- `milestoneIds` — milestone targets if already known

### Status vocabulary

- `proposed`
- `exploring`
- `accepted`
- `rejected`
- `parked`

### Canonical ownership

An idea is canonical for the statement of the opportunity and its planning disposition.
It is not canonical for whether any execution work has succeeded.

## 2. Spec

### Role

Bridge planning intent to implementable work.

### Required fields

- shared required fields
- `objective` — what should change and why
- `scope` — in-scope behavior or deliverables
- `nonGoals` — explicit exclusions
- `acceptanceCriteria` — array of concrete acceptance checks

### Optional fields

- `ideaIds` — source ideas by ID
- `initiativeIds` — owning initiatives by ID
- `milestoneIds` — targeted milestones by ID
- `assumptions` — planning assumptions or constraints
- `risks` — notable delivery/design risks
- `relatedDocs` — design docs, research, or supporting specs
- `taskPacketRefs` — standardized links to task packets
- `batchRefs` — optional links to relevant batches as evidence/reporting
- `deliveredBy` — optional references to packets or milestones once delivered

### Status vocabulary

- `draft`
- `reviewing`
- `approved`
- `superseded`
- `delivered`
- `cancelled`

### Canonical ownership

A spec is canonical for intent, scope, acceptance criteria, and planning lineage.
It is not canonical for packet completion, batch health, or run outcomes.

## 3. Initiative

### Role

Represent a larger outcome that may span multiple specs, milestones, and task packets.

### Required fields

- shared required fields
- `outcome` — the project-level result the initiative is meant to achieve

### Optional fields

- `specIds` — included specs by ID
- `ideaIds` — related ideas by ID
- `milestoneIds` — milestones that define progress checkpoints
- `priority` — optional coarse ordering such as `low`, `normal`, `high`, `urgent`
- `targetWindow` — optional target timeframe or release window
- `successMeasures` — how the operator will recognize completion
- `taskPacketRefs` — optional direct packet references when reporting across multiple specs is useful

### Status vocabulary

- `proposed`
- `active`
- `paused`
- `complete`
- `cancelled`

### Canonical ownership

An initiative is canonical for grouping, intended outcome, and planning-level progress framing.
It is not canonical for the real-time operational status of underlying work.

## 4. Milestone

### Role

Represent a named checkpoint within an initiative or a cross-cutting project plan.

### Required fields

- shared required fields
- `target` — description of what becomes true at this checkpoint

### Optional fields

- `initiativeIds` — parent initiatives by ID
- `specIds` — specs expected to contribute
- `targetDate` — optional target date or window
- `completionCriteria` — concise checkpoint criteria
- `taskPacketRefs` — optional packet references that materially contribute
- `batchRefs` — optional evidence/reporting links to batches

### Status vocabulary

- `planned`
- `in_progress`
- `achieved`
- `missed`
- `cancelled`

### Canonical ownership

A milestone is canonical for the checkpoint definition and planning status.
It is not canonical for whether linked packets or runs have technically completed; that remains runtime evidence.

## Linking Model

Planning artifacts should link to one another and to execution artifacts through explicit reference objects rather than embedded copies.

## Relationship directions

Minimum supported planning relationships:
- `idea -> spec`
- `idea -> initiative` (optional direct grouping)
- `spec -> initiative`
- `initiative -> milestone`
- `spec -> milestone` (optional when a milestone tracks a subset of initiative work)
- `spec -> task packet`
- `initiative -> task packet` (optional reporting shortcut)
- `milestone -> task packet` (optional checkpoint evidence)

Batch links are allowed, but only as evidence/reporting links rather than the primary execution contract.
The main planning-to-execution handoff remains **spec/initiative/milestone -> task packet**.

## Reference shape

References should be structured records rather than bare strings when linking across planning and execution layers.

### Planning artifact reference

Recommended shape:

```json
{
  "kind": "spec",
  "id": "SPEC-042",
  "relation": "implements"
}
```

Minimum fields:
- `kind`
- `id`

Optional fields:
- `relation`
- `title` snapshot for convenience rendering

### Task packet reference

Recommended shape:

```json
{
  "taskId": "TP-185",
  "packetPath": "taskplane-tasks/TP-185-planning-artifact-schema-and-storage",
  "relation": "implements"
}
```

Required fields:
- `taskId`
- `packetPath`

Optional fields:
- `relation` — `implements`, `explores`, `blocks`, `delivers`, `tracks`
- `addedAt`

Rationale:
- `taskId` gives a stable human identifier,
- `packetPath` gives a concrete filesystem anchor in mono-repo or workspace mode,
- the pair avoids depending on UI-only registries.

### Batch reference

Recommended shape:

```json
{
  "batchId": "batch-2026-04-20-01",
  "repoId": "default",
  "relation": "delivery_evidence"
}
```

Required fields:
- `batchId`

Optional fields:
- `repoId`
- `relation`
- `recordPath` if later batch history files need an explicit anchor

Batch references should remain optional and evidentiary.
A planning artifact should not require direct batch links in order to be valid, because batches are runtime episodes, not the durable planning contract.

## Cardinality expectations

- An **idea** may link to zero, one, or many specs.
- A **spec** may link back to one or many ideas.
- A **spec** may belong to zero, one, or many initiatives.
- An **initiative** may contain zero, one, or many milestones.
- A **milestone** may receive contributions from many specs and task packets.
- A **spec** may produce many task packets over time.
- A **task packet** may be linked from more than one planning artifact for reporting, but one spec should usually be the clearest primary planning parent when possible.
- A planning artifact may link to many batches as historical evidence.

## Audit and History Expectations

Planning artifacts should preserve lightweight, append-only planning history without attempting to replay full execution history.

## Required audit metadata

Every artifact should preserve:
- `createdAt`
- `updatedAt`
- stable `id`
- durable references to related planning/execution artifacts

## Recommended history entry shape

```json
{
  "at": "2026-04-20T16:30:00Z",
  "type": "status_changed",
  "from": "draft",
  "to": "approved",
  "note": "Operator approved scope after review"
}
```

Recommended fields:
- `at`
- `type`
- `note`

Optional fields:
- `from`
- `to`
- `actor`
- `relatedTaskId`
- `relatedBatchId`

## History rules

- History should capture meaningful planning changes, not every render/cache event.
- Status changes, relationship additions, supersession, and archival are good history candidates.
- Execution details should be linked, not copied wholesale into planning history.
- If a planning artifact wants to note delivery evidence, it should append a compact reference such as "delivered via TP-185" or a batch reference, not embed run logs.

## Example boundary behavior

Good:
- a spec says it is `approved` and links to `TP-185`
- a milestone says it was `achieved` after linked packets completed
- an initiative history entry notes that delivery evidence was observed in batch `B-014`

Not good:
- a spec stores a mutable `taskStatus: running`
- a milestone becomes the canonical source for whether packet `TP-185` passed verification
- an initiative stores copied review outcomes that can drift from the actual review files

## Practical consequences for later tasks

This schema allows the console to:
- show planning context above task packets,
- navigate from ideas/specs/initiatives/milestones to executable work,
- summarize delivery evidence, and
- preserve clear source-of-truth boundaries.

It intentionally does not require:
- a database,
- a hidden metadata service,
- replacement of task packets, or
- new runtime authority outside existing Taskplane execution artifacts.
