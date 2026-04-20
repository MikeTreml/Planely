# Planning Storage Layout

## Status

Draft for TP-185.

## Purpose

Define where canonical planning artifacts live on disk, how they are discovered, and how they coexist with Taskplane's existing packet-centric execution state.

This proposal keeps the same architectural split already used elsewhere in Taskplane:
- **canonical, user-inspectable project data** lives in committed project files,
- **runtime state, pointers, and caches** live in `.pi/` or other runtime-managed locations,
- the operator console renders derived views from canonical files plus runtime evidence rather than introducing a database.

## Storage Design Goals

The planning storage layer must:
- remain local-first and inspectable,
- work in single-repo, monorepo, and workspace mode,
- avoid duplicating task packet or runtime authority,
- support cheap filesystem discovery without a required daemon, and
- preserve stable links from planning artifacts to task packets and batches.

## Proposed Canonical Root

Canonical planning files should live under:

```text
.taskplane/project/
```

inside the canonical Taskplane project root.

Rationale:
- `.taskplane/` is a better home for committed project metadata than `.pi/`, which already carries runtime, pointer, and cache semantics,
- `project/` leaves room for future adjacent domains without overloading the root,
- the path is stable in repo mode and workspace mode when resolved through the existing project-root/config-root rules.

## Proposed Layout

```text
.taskplane/
└── project/
    ├── planning/
    │   ├── ideas/
    │   │   └── IDEA-*.json
    │   ├── specs/
    │   │   └── SPEC-*.json
    │   ├── initiatives/
    │   │   └── INIT-*.json
    │   ├── milestones/
    │   │   └── MILE-*.json
    │   └── index.json
    └── views/
        └── planning-summary.json
```

## Canonical vs derived files in that layout

### Canonical

Canonical files are the per-artifact files under:
- `.taskplane/project/planning/ideas/`
- `.taskplane/project/planning/specs/`
- `.taskplane/project/planning/initiatives/`
- `.taskplane/project/planning/milestones/`

Each file contains exactly one planning artifact as defined by `planning-artifacts.md`.

### Derived but materializable

The following files are allowed as optional, reproducible views:
- `.taskplane/project/planning/index.json`
- `.taskplane/project/views/planning-summary.json`

These may exist for performance or UI convenience, but they are not canonical.
They must be safe to delete and rebuild from planning artifact files plus runtime/task discovery.

## Why JSON files

JSON aligns with the rest of Taskplane's configuration direction and makes indexing/rendering straightforward.
Markdown bodies or richer doc attachments can still be linked from artifact metadata, but the canonical planning record should be structured data in v1.

This keeps:
- schema validation simple,
- console/server parsing deterministic,
- file-by-file diffs readable,
- artifact relationships explicit.

## Naming and ID Conventions

## Artifact IDs

Use human-readable prefixed identifiers:
- `IDEA-001`
- `SPEC-014`
- `INIT-003`
- `MILE-007`

Rules:
- uppercase prefix by artifact type,
- zero-padded numeric suffix by default,
- stable once assigned,
- unique within the project root.

If later needed, projects may append mnemonic slugs in filenames without changing canonical IDs.
For example, `SPEC-014-operator-console-planning.json` may still carry canonical ID `SPEC-014`.

## Filenames

Recommended filename rule:

```text
<ID>.json
```

Examples:
- `ideas/IDEA-001.json`
- `specs/SPEC-014.json`
- `initiatives/INIT-003.json`
- `milestones/MILE-007.json`

Optional future-friendly filename rule:

```text
<ID>-<slug>.json
```

The `id` field inside the file remains canonical; the slug is cosmetic.

## Cross-file references

References should point to canonical IDs and include paths only when linking outside the planning layer.

### Planning-to-planning references

Use `kind + id`.

### Planning-to-task references

Use:
- `taskId`
- `packetPath`

because packet folders are canonical execution anchors and must stay valid in mono-repo and workspace mode.

### Planning-to-batch references

Use:
- `batchId`
- optional `repoId`
- optional `recordPath`

because batches are runtime evidence, not planning-owned objects.

## Discovery and Rendering Model

A storage proposal is incomplete unless it explains how files become renderable operator-console views.

## Root discovery

The system should resolve the canonical planning root using the same project-root/config-root semantics Taskplane already uses:

### Repo mode / monorepo mode

- canonical project root = the repo root containing Taskplane config
- canonical planning root = `<project-root>/.taskplane/project/planning/`

### Workspace mode

- workspace root `.pi/` may contain pointers and caches only
- canonical project root = the designated config repo that holds `.taskplane/taskplane-config.json`
- canonical planning root = `<config-repo>/.taskplane/project/planning/`

This keeps planning files committed with the rest of project configuration and prevents the non-repo workspace root from becoming a second source of truth.

## Enumeration rules

Discovery should:
1. resolve the canonical planning root,
2. enumerate known type directories (`ideas`, `specs`, `initiatives`, `milestones`),
3. read `*.json` artifact files,
4. validate `kind`, `id`, and required fields,
5. assemble an in-memory graph keyed by canonical IDs,
6. separately enrich with task packet/batch/runtime evidence for rendered views.

A missing planning root is valid and means "no planning artifacts yet" rather than an error.

Unknown extra files should be ignored unless explicitly registered later.

## Indexing expectations

The system may build an index keyed by:
- artifact ID,
- artifact type,
- status,
- referenced task IDs,
- initiative/spec/milestone relationships,
- tags/owner.

That index may be:
- computed fully in memory at read time for smaller projects, or
- materialized into `.taskplane/project/planning/index.json` for faster startup.

Either way, the index remains derived.
Deleting it must not lose canonical meaning.

## Rendering expectations

Operator-console views should be built from:
- canonical planning files,
- task packet discovery under `taskplane-tasks/`,
- runtime artifacts under `.pi/` and packet-local execution outputs,
- optional derived planning indexes/summaries.

Examples:
- an initiative page reads initiative/spec/milestone files canonically, then projects linked packet status from task discovery/runtime files,
- a spec detail page renders spec intent from `SPEC-*.json` and shows linked task/batch evidence as a derived execution panel,
- a backlog or planning overview may read `planning-summary.json` as a cache, but must be reproducible without it.

## Allowed caches vs forbidden shadow state

Allowed:
- ID indexes
- relationship indexes
- precomputed status summaries clearly marked as derived
- recent-view or filter caches

Forbidden as canonical:
- writable packet completion mirrors
- authoritative batch/run summaries stored only in planning folders
- UI-only ownership of execution state
- workspace-root `.pi/` registries treated as the only source for planning artifacts

## Placement Matrix

| Mode | Canonical project root | Canonical planning root | Notes |
|------|------------------------|-------------------------|-------|
| Single repo | repo root | `<repo>/.taskplane/project/planning/` | Planning files commit with repo content |
| Monorepo | repo root | `<repo>/.taskplane/project/planning/` | Artifacts can reference packets anywhere under the repo's managed task tree |
| Workspace mode | config repo root | `<config-repo>/.taskplane/project/planning/` | Workspace root `.pi/` may cache pointers/indexes only; planning files stay in the config repo |

## Coexistence with Task Packets and Runtime State

## Task packets remain the execution contract

Planning artifacts must not replace packet folders under `taskplane-tasks/`.
The handoff to execution still occurs through task packet creation, discovery, and orchestration.

Implication:
- planning files may reference packets,
- planning files may explain why packets exist,
- packet files remain canonical for execution instructions, checklist progress, reviews, and completion.

## `.pi/` remains runtime/pointer/cache territory

The planning layer should not move canonical planning records into `.pi/`.
That directory already has strong semantics around:
- runtime state,
- supervisor/telemetry events,
- preferences or config loading support,
- pointer files in workspace mode,
- cache-like/generated material.

Using `.pi/` for canonical planning data would blur the source-of-truth boundary and conflict with existing workspace rules.

## Workspace-root pointers remain non-canonical

In workspace mode, the non-repo workspace root may need:
- a pointer to the config repo,
- optional generated cache/index files for cross-repo UI use.

Those files must never become the only location of the planning records.
They are convenience infrastructure, not project truth.

## Relationship to packet-home and packet paths

The storage proposal intentionally keeps planning artifacts outside packet folders.
This avoids:
- inflating every task packet with planning metadata,
- duplicating the same initiative/spec data across multiple packets,
- turning packet-local edits into the only place where planning context can change.

Instead, planning files link outward to packet folders using stable `taskId + packetPath` references.

## Relationship to batch/run history

Planning files may reference batches as delivery evidence, but batch/run logs and state stay where the runtime already writes them.
A planning artifact should answer:
- what outcome was intended,
- what packets relate to that outcome,
- what milestone or initiative it supports.

It should not become the canonical replay log of execution attempts.

## Practical lifecycle

A typical lifecycle under this layout:
1. create `IDEA-001.json`
2. later create `SPEC-014.json` linking back to that idea
3. create one or more task packets under `taskplane-tasks/`
4. add `taskPacketRefs` to the spec or milestone
5. runtime executes packets and writes normal packet/batch/run artifacts
6. console derives combined views by joining planning files with execution evidence
7. optional index/summary files are rebuilt as needed

## Why this proposal stays minimal

This layout intentionally avoids:
- a database,
- a central registry service,
- hidden records outside versioned project files,
- planning data embedded into runtime state files,
- mode-specific schemas.

The same basic model works everywhere; only root resolution changes.

## Forward compatibility

This layout leaves room for later additions such as:
- schema version fields inside artifact files,
- optional attachments directories,
- generated search indexes,
- project-level summary views,
- export/sync tooling.

Those additions should preserve the same invariant:
canonical planning truth lives in per-artifact files under `.taskplane/project/planning/`.
