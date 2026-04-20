# Project Registry Model

## Status

Draft for TP-188.

## Purpose

Define the canonical project-registry record used by Taskplane to remember known projects for the Operator Console sidebar and project switching flows.

The registry is intentionally lightweight:
- it is local-first and inspectable,
- it layers above Taskplane's current root-based CLI and dashboard behavior,
- it does not replace project-local config or runtime files, and
- it distinguishes canonical record fields from derived UI conveniences.

## Design Goals

The project registry must:
- provide a stable list of known projects across sessions,
- support active, archived, and recent sidebar groupings,
- avoid duplicate or conflicting entries for the same local project root,
- tolerate renamed projects and temporarily missing paths, and
- keep Taskplane's current per-root config/runtime authority intact.

## What Counts as a Project

In Taskplane terms, a project is a locally known Taskplane-managed root that can be opened by the operator console and resolved into:
- a canonical filesystem root that Taskplane operates against,
- a Taskplane config location (direct or pointer-resolved), and
- a local runtime namespace whose files can be inspected on disk.

This definition is intentionally broader than "current cwd" and narrower than "any folder on disk." A registry record exists only for roots that Taskplane has explicitly opened, initialized, or discovered through a supported adoption flow.

## Canonical Project Record

Each registry record should contain the following fields.

| Field | Type | Canonical? | Purpose |
|------|------|------------|---------|
| `id` | string | Yes | Stable local identifier for the project record. |
| `schemaVersion` | number | Yes | Allows future record migrations. |
| `name` | string | Yes | Operator-facing display name saved with the project. |
| `rootPath` | string | Yes | Canonical local filesystem root used to reopen the project. |
| `configPath` | string | Yes | Effective config location used to resolve `.pi/taskplane-config.json` or workspace pointer targets. |
| `mode` | `repo` \| `workspace` | Yes | Declares whether the entry opens a repo root directly or a workspace root that routes to project config. |
| `archived` | boolean | Yes | Explicit operator-managed archive flag. |
| `createdAt` | string (ISO timestamp) | Yes | When the registry entry was first created locally. |
| `updatedAt` | string (ISO timestamp) | Yes | Last time canonical metadata on the record changed. |
| `lastOpenedAt` | string \| null | Yes | Last successful operator open/switch into the project. |
| `lastBatchAt` | string \| null | Yes | Last time Taskplane observed a batch launch, resume, or integration event for the project. |
| `lastSeenConfigHash` | string \| null | Yes | Optional fingerprint for detecting project renames or config-root changes without creating a new record. |
| `notes` | string \| null | Yes | Optional local-only operator annotation for future UI use. |

### Required identity rule

`id` is the canonical record key, but it must be assigned from the project's durable local identity rather than from sidebar order or recency state. A good v1 rule is:
1. normalize and resolve the canonical `rootPath`,
2. use that resolved root as the uniqueness anchor, and
3. persist a generated opaque `id` so later record moves/migrations do not depend on path text alone.

This lets Taskplane keep current CLI/dashboard flows rooted in one active path at a time while the registry remembers multiple roots above that layer.

## Canonical vs Derived Fields

### Canonical fields

Canonical registry fields are the ones that answer: "what projects does this local Taskplane installation know about, and what stable metadata is saved for them?"

Canonical fields are:
- `id`
- `schemaVersion`
- `name`
- `rootPath`
- `configPath`
- `mode`
- `archived`
- `createdAt`
- `updatedAt`
- `lastOpenedAt`
- `lastBatchAt`
- `lastSeenConfigHash`
- `notes`

These fields are directly stored in the registry record and can be edited only through explicit file-backed mutations.

### Derived fields

Derived fields are sidebar or operator-console conveniences recomputed from canonical registry data plus filesystem/runtime inspection.

Examples:
- `isRecent`
- `isMissing`
- `missingReason`
- `lastActivityAt` (max of `lastOpenedAt` and `lastBatchAt`)
- `displayStatus` such as `active`, `archived`, `missing`, or `needs-attention`
- `taskCount`, `runningBatchCount`, or approval badges
- workspace/repo labels assembled for display

Rule: if deleting the derived cache would not lose the official answer to "what project is this and how do I reopen it?", the field is derived.

## Grouping Rules: Active vs Archived vs Recent

The registry should support one canonical record list with multiple derived groupings.

### Active projects

A project belongs in the active group when:
- `archived === false`, and
- the record is still retained in the registry whether or not the path is currently available.

Active does **not** mean "currently open in the CLI" and does not require an active batch. It simply means the operator has not archived the project.

### Archived projects

A project belongs in the archived group when:
- `archived === true`.

Archive state is explicit and reversible. It removes the project from the default active list but keeps the record available for:
- search,
- manual unarchive,
- auditability of prior local usage, and
- later reopening if the project becomes relevant again.

Archived must never mean deleted. Deletion, if added later, would be a separate destructive action.

### Recent projects

Recent is a derived overlay, not a second source of truth.

A project is recent when:
- it is not hidden by pruning rules, and
- it has a usable activity timestamp derived from canonical fields, preferably `lastActivityAt = max(lastOpenedAt, lastBatchAt)`.

Recommended v1 behavior:
- show recent items ordered by descending `lastActivityAt`,
- include both active and archived records only if the UI intentionally separates archived recents from active recents, and
- default the main sidebar recent section to non-archived projects to avoid surfacing archived work as a primary destination.

If neither timestamp exists, the project is known but not recent.

## Ordering Rules

Recommended default sidebar ordering:
1. current/open project (if one exists in the active list),
2. remaining active recent projects by `lastActivityAt` descending,
3. remaining active non-recent projects alphabetically by `name`,
4. archived projects in a collapsed section, ordered by `updatedAt` or `name`.

This keeps one canonical project list while giving the UI flexibility to render recent-first navigation.

## Duplicate Roots, Renames, and Missing Paths

### Duplicate-root detection

The registry must enforce one canonical record per normalized project root.

Rules:
- normalize case and separators according to platform rules before comparing roots,
- resolve symlinks or equivalent canonical path forms where practical,
- if a discovered/opened project matches an existing normalized root, update that record instead of creating a second one,
- if two imported records collide on normalized `rootPath`, keep the oldest surviving `id`, merge safe metadata, and log the conflict as a repair event rather than exposing duplicate sidebar entries.

### Renamed project behavior

A project rename should usually update the existing record rather than create a new one.

Rules:
- if the normalized `rootPath` is unchanged but the project config or operator-edited display name changes, update `name` and `updatedAt` in place,
- if the effective `configPath` changes due to workspace/config relocation but identity evidence still points to the same project root, update the existing record and refresh `lastSeenConfigHash`,
- only create a new record when Taskplane observes a genuinely different canonical root that does not match an existing identity anchor.

This preserves continuity for recent history and archive state.

### Missing or unavailable paths

A missing path must not silently remove the project from the registry.

Rules:
- if `rootPath` is unavailable, keep the canonical record and derive `isMissing = true`,
- surface missing projects as a warning state in the UI, not as auto-archived or deleted entries,
- allow the operator to retry open, re-point, archive, or remove the record explicitly in a later implementation,
- do not update `lastOpenedAt` on failed open attempts,
- optionally record the most recent successful validation time separately in derived diagnostics, not as a replacement identity field.

This matches Taskplane's recoverability and inspectability principles: stale entries remain visible until the operator chooses what to do.

## Non-Goals of the Record Model

This model does not define:
- how the registry file is stored on disk,
- cross-machine sync or team-shared registries,
- project pinning/favorites,
- per-project permissions or accounts, or
- database-backed indexing.

Those concerns belong to follow-on storage or product tasks.
