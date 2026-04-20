# Project Registry Adoption and Behavior Notes

## Status

Draft for TP-188.

## Purpose

Define how the proposed project registry gets populated and maintained in day-to-day use without changing Taskplane's existing execution authority.

This document covers:
- how projects enter the registry,
- how archive and unarchive behave,
- how recents are updated and pruned, and
- which future features are intentionally left out of v1.

## Adoption Principles

The adoption path should be conservative:
- do not require users to migrate all projects before the console works,
- do not assume every folder on disk should become a known project,
- do not conflate an archived project with a deleted one,
- do not create a second source of truth for project-local metadata.

A project should enter the registry when Taskplane has enough evidence to reopen it safely, not merely because the filesystem scan found a plausible directory name.

## How Existing Users and Projects Enter the Registry

### Primary entry points

A project record should be created or updated when any of the following happen:
1. the operator launches the dashboard/console for a root that resolves to a valid Taskplane project,
2. the operator runs a Taskplane CLI command from a root that resolves to a valid project or workspace,
3. the operator explicitly chooses an "add/open project" action in the future console UI,
4. a future "import known projects" action is run against a bounded list of candidate roots.

These are all explicit or semi-explicit user actions. They keep the registry grounded in actual use.

### Validation before add

Before creating a registry record, Taskplane should validate enough information to reopen the project later.

Minimum validation:
- resolve the effective project root or workspace root,
- resolve the effective config path through current repo/pointer rules,
- confirm that the target looks like a Taskplane-managed root or a workspace that Taskplane already knows how to interpret,
- normalize the root path for duplicate detection.

If validation fails, Taskplane should not create a canonical project record. A future UI may show a non-persistent "candidate" warning, but the registry itself should only store reopenable projects.

### Existing-project discovery strategy

v1 should prefer explicit discovery over broad background crawling.

Recommended order:
1. **open-driven discovery** — add or update the project when the user actually opens it,
2. **CLI-driven discovery** — add or update when a CLI command successfully resolves project context,
3. **optional import flow** — let the user confirm a finite list of previously used or configured roots.

What v1 should avoid:
- recursive disk scans of arbitrary directories,
- guessing projects solely from git repositories,
- silently importing every folder that contains `.pi/`,
- automatically creating records from stale shortcuts or broken paths.

This keeps the registry trustworthy and inspectable.

### Upsert behavior

When a project is already known:
- match first by normalized canonical root,
- update the existing record instead of creating a second one,
- refresh `lastOpenedAt` on successful open/switch,
- refresh `lastBatchAt` when Taskplane observes batch activity,
- update `name`, `configPath`, and `updatedAt` when authoritative project metadata changes.

When no record matches:
- create a new record with a generated stable `id`,
- set `createdAt` and `updatedAt`,
- initialize `archived` to `false`,
- set `lastOpenedAt` if the add happened through a successful open flow.

## Archive and Unarchive Behavior

### Archive action

Archive is a reversible visibility action on the registry record.

Archiving a project should:
- set `archived = true`,
- update `updatedAt`,
- keep the record in the canonical registry,
- remove it from the default active-project list in the console.

Archiving a project should **not**:
- delete or move any project files,
- remove task packets, planning files, or runtime history,
- revoke the ability to reopen the project later,
- implicitly mark the project as missing or invalid.

### When archive is appropriate

Typical archive cases:
- a completed or dormant project the operator rarely visits,
- a temporary workspace the operator wants hidden from the default sidebar,
- a historical project that still needs occasional inspection.

Archive is about reducing clutter, not data retention policy.

### Unarchive action

Unarchiving should:
- set `archived = false`,
- update `updatedAt`,
- return the project to the active list,
- preserve prior timestamps such as `lastOpenedAt` and `lastBatchAt`.

A future UI may also reopen the project immediately after unarchiving, but the state transition itself should remain a simple registry mutation.

### Interaction with missing paths

If an archived project later becomes missing, it remains archived and missing.
If an active project becomes missing, it remains active unless the operator archives it explicitly.

Archive state and path availability are separate concepts.

## Recent Tracking

### What updates recents

Recent state should be derived from canonical timestamps, not stored as a competing list.

Events that should update recency:
- successful project open/switch updates `lastOpenedAt`,
- successful batch launch/resume/integration activity updates `lastBatchAt`,
- explicit project-add via a successful open may initialize `lastOpenedAt`.

Events that should **not** update recency:
- failed open attempts,
- passive filesystem validation pings,
- background rendering of sidebar lists,
- archive/unarchive alone unless paired with a successful open.

### Recent computation

Recommended derived value:

```text
lastActivityAt = max(lastOpenedAt, lastBatchAt)
```

Then:
- recent projects are those with a non-null `lastActivityAt`,
- recent ordering is descending by `lastActivityAt`,
- ties may fall back to `name` or `updatedAt` for stable UI order.

### Pruning policy

The registry should keep canonical records unless the operator explicitly removes them in a future feature. Recency pruning therefore applies to the **recent view**, not to record existence.

Recommended v1 pruning behavior:
- keep all canonical records,
- limit the rendered recent list to a small configurable or fixed count, such as 5 to 10 items,
- optionally suppress archived projects from the primary recent section,
- hide records with no recency timestamp from the recent group while still showing them in active/archived sections.

This keeps recent behavior lightweight while preserving inspectable project history.

### Staleness and decay

v1 does not need a time-based decay rule that changes canonical data. If a project has not been opened in months, it simply falls lower in recent ordering or out of the visible recent subset. The underlying record stays intact.

## Manual Removal vs Archive

Although removal is out of scope for v1 behavior, the distinction matters now:
- **archive** = reversible visibility change with no data loss,
- **remove** = future explicit action to forget a project from the local registry.

The adoption path should keep these concepts separate so the UI does not pressure users into destructive cleanup when they only want less sidebar noise.

## Operational Examples

### Example 1: first open of an existing repo

1. Operator runs the dashboard or CLI in `C:/src/Planely`.
2. Taskplane resolves the effective config.
3. No existing normalized root matches.
4. Taskplane writes a new registry record.
5. `lastOpenedAt` is set, so the project appears in active and recent sections.

### Example 2: same project renamed in config

1. Operator opens the same root again after changing the project display name.
2. Root matches existing record.
3. Taskplane updates `name` and `updatedAt` on the existing record.
4. Recent history and archive state stay attached to the same `id`.

### Example 3: archive a dormant project

1. Operator archives a project from the sidebar.
2. Record remains in `project-registry.json` with `archived = true`.
3. The project leaves the default active list.
4. It can still be found in archived/search views and later unarchived.

### Example 4: broken path after a drive rename

1. Registry still contains the project record.
2. Validation marks it as missing in a derived view.
3. The operator can decide later whether to repair, archive, or remove it.
4. Taskplane does not silently delete the record or reset recency data.

## Out of Scope for v1

The following are intentionally deferred:
- project pinning or favorites,
- shared team registries,
- cloud sync,
- account-backed roaming state,
- automatic full-disk project discovery,
- destructive "forget project" UX details,
- merge of registries across machines,
- project folders as collaboration/permission boundaries,
- advanced ranking beyond simple timestamp-based recency,
- tagging, ownership, or custom groups beyond active/archived/recent.

## Follow-on Implementation Notes

Expected implementation tasks after this design:
- add a user-scoped registry read/write helper,
- define normalized root comparison utilities,
- update dashboard/server boot flow to read the registry before selecting a project,
- add sidebar actions for archive/unarchive and project open,
- add repair handling for missing/corrupt registry files,
- add explicit import/add flows for existing projects.
