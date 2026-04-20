# Planning Layer Migration and Adoption Notes

## Status

Draft for TP-185.

## Purpose

Describe how existing Taskplane projects can adopt the planning layer incrementally without breaking current packet-based execution, and explain why the proposed file-backed model is sufficient for v1.

## Starting Assumption

Existing Taskplane projects already have canonical execution artifacts such as:
- task packets under `taskplane-tasks/`,
- packet-local history in `PROMPT.md`, `STATUS.md`, and reviews,
- runtime state under `.pi/`, and
- project configuration under `.pi/taskplane-config.json` or workspace-config equivalents.

The planning layer is additive. Projects do **not** need to pause execution or migrate existing runtime records into a new system before they can use it.

## Incremental Adoption Path

## Phase 0: No planning artifacts yet

A project may adopt nothing initially.

Valid state:
- no `.taskplane/project/planning/` directory exists,
- console/runtime behavior continues to rely on packet discovery and runtime artifacts only,
- the absence of planning files means "planning layer not in use yet," not misconfiguration.

## Phase 1: Introduce planning root and a few artifacts

Recommended first step:
1. create `.taskplane/project/planning/`
2. add one or more `IDEA-*.json` or `SPEC-*.json` files
3. keep all current task authoring/execution flows unchanged

At this phase, planning files provide context only.
Nothing in Taskplane runtime has to change for task packets to remain launchable.

## Phase 2: Link new planning artifacts to new task packets

When authoring new work:
- create or update a spec/initiative/milestone,
- create task packets normally under `taskplane-tasks/`,
- add `taskPacketRefs` in the relevant planning artifact.

This yields value immediately because the console can navigate from intent to execution without requiring old packets to be backfilled.

## Phase 3: Backfill high-value legacy work selectively

Projects may selectively backfill links for:
- currently active initiatives,
- important shipped specs,
- milestones still in progress,
- task packets that operators frequently inspect.

They do **not** need to retroactively model every historical packet or batch.
A partial planning graph is acceptable as long as individual files remain internally valid.

## Phase 4: Add optional derived indexes/summaries

Once artifact volume grows, projects or tooling may materialize:
- `planning/index.json`
- `views/planning-summary.json`

These improve startup and rendering speed but remain derived.
Projects can adopt them later without revisiting the canonical storage model.

## Recommended practical migration order

For most projects:
1. start with `specs/`
2. add `initiatives/` for multi-spec efforts
3. add `milestones/` where checkpoint reporting matters
4. add `ideas/` if the team wants earlier-stage backlog capture

Reasoning:
- specs connect most directly to packet creation,
- initiatives and milestones add organization once there is enough volume,
- ideas are useful but most optional if teams already capture rough work elsewhere.

## What Remains Optional in v1

The planning layer is intentionally modular.

## Optional artifact categories

A project may use:
- only specs,
- specs plus initiatives,
- initiatives plus milestones,
- or the full idea/spec/initiative/milestone set.

The schema supports all four, but v1 should not require every project to populate every type.

## Optional history depth

Projects may keep planning history lightweight.
They do not need exhaustive event logs inside planning artifacts as long as key planning changes are represented.

## Optional caches/indexes

Projects may omit:
- `planning/index.json`
- `views/planning-summary.json`

and compute views directly from canonical files.

## Optional legacy backfill

Existing projects may leave older packets unlinked.
Only the planning artifacts they actively care about need references.

## Optional console support rollout

A project may store planning files before any rich planning-aware console views ship.
The files are still valuable as inspectable project records and can be rendered more richly later.

## What Does Not Change

Adopting the planning layer does **not** change:
- task packet folder structure,
- packet execution rules,
- `.DONE` / `STATUS.md` semantics,
- batch/run authority,
- workspace pointer/cache rules,
- the requirement that execution truth comes from runtime artifacts.

This is crucial for safe rollout.
The planning layer should feel like added context, not a new operating mode.

## Why a Database Is Not Required Yet

Taskplane already optimizes for local-first, inspectable, file-backed operation.
The planning layer should preserve those properties until there is clear evidence they are insufficient.

## Reasons the file-backed model is enough for v1

### 1. Artifact volume is expected to be modest

Most projects will have far fewer ideas/specs/initiatives/milestones than they have source files.
Simple filesystem enumeration and lightweight indexing are adequate at this scale.

### 2. Inspectability is a product feature

Operators should be able to inspect and version planning artifacts alongside task packets and docs.
A database would hide the system of record behind another operational layer and reduce the "open the file and see the truth" property.

### 3. Existing Taskplane architecture already favors canonical files plus derived views

The current model already separates:
- canonical packet/runtime files,
- derived dashboard/operator views,
- runtime caches and state under `.pi/`.

Planning artifacts fit naturally into that pattern.

### 4. Workspace mode already has a durable config-repo home

Even in polyrepo/workspace setups, Taskplane already distinguishes between:
- canonical committed project/config data, and
- workspace-root pointers/caches.

That means the planning layer can reuse an existing file-backed placement model rather than inventing a service.

### 5. Incremental adoption is easier with files

Projects can add a few planning files by hand or through future tooling without any bootstrap step such as:
- provisioning a database,
- running migrations,
- managing credentials,
- ensuring service availability.

### 6. Version control is enough for early audit and collaboration needs

Git already gives teams:
- change history,
- reviews,
- diffs,
- rollback,
- branch-based experimentation.

That is often enough for planning artifacts in the first product phase.

## Risks of Staying File-Backed Too Long

The v1 choice is justified, but it is not a forever decision.

### Risk 1: slow discovery at larger scale

If projects accumulate very large planning graphs across many repos, repeated filesystem scans and graph assembly may become slow.

### Risk 2: harder cross-project/global queries

A local file model is excellent for project truth, but weaker for instant global queries such as:
- all milestones due soon across many workspaces,
- portfolio-wide ownership rollups,
- organization-scale search and analytics.

### Risk 3: concurrent edit friction

Merge conflicts may become more common if many users or tools update the same planning files frequently, especially summary-heavy artifacts.

### Risk 4: limited transactional guarantees

Complex multi-file updates may be harder to make atomically than in a transactional store, particularly if later features need stronger write coordination.

### Risk 5: duplicate derived caches if not disciplined

As more surfaces appear, there is a risk that different tools will materialize incompatible indexes or summaries unless the source-of-truth boundary remains explicit.

## Triggers That Could Justify a Different Storage Model Later

A database or service-backed index should be considered only if one or more concrete triggers appear.

### Strong triggers

- canonical planning artifact counts become large enough that read-time discovery is a noticeable operator problem even with derived indexes
- cross-project portfolio queries become a primary product requirement, not an occasional convenience
- real-time collaborative editing of the same planning artifact becomes common and merge-conflict costs are high
- planning workflows require transactional multi-record updates that are difficult to make reliable with files alone
- remote/cloud-hosted operator experiences need server-side query performance or access patterns that cannot be met by file reads and rebuildable indexes

### Weak triggers that are not sufficient by themselves

These alone should **not** justify a database pivot:
- a desire for "cleaner architecture"
- discomfort with JSON files
- speculative scale concerns without measured bottlenecks
- a wish to centralize state before the planning model is proven

## Migration posture if future storage changes are needed

Even if Taskplane later adds a database-backed index or service, the preferred order should be:
1. keep canonical per-artifact files if possible,
2. add a derived/query layer first,
3. move canonical authority only with strong evidence and explicit compatibility planning.

That preserves the current product virtues as long as possible.

## Recommended follow-on implementation guardrails

Later implementation tasks should preserve these rules:
- missing planning files are a valid state
- indexes and summaries are always rebuildable
- execution truth is never edited through planning records
- workspace-root pointer/cache files are never canonical planning storage
- partial adoption must render gracefully in the console

## Overall decision

The right v1 posture is:
- adopt planning files incrementally,
- keep artifact categories optional,
- preserve packet/runtime authority,
- use derived indexes only as needed,
- defer databases until real product pressure appears.

That keeps the planning layer aligned with Taskplane's local-first architecture while still leaving room for future evolution.
