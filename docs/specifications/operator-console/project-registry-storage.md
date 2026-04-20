# Project Registry Storage Proposal

## Status

Draft for TP-188.

## Purpose

Define where Taskplane stores the project registry, how that storage fits the existing architecture, and how file-backed updates remain safe without introducing a database.

This proposal assumes the registry supports operator-console navigation across multiple known projects. Because it spans many roots, the registry cannot live only inside one current project's `.pi/` or `.taskplane/` directory.

## Storage Principles

The project registry should follow the same boundary rules already used elsewhere in Taskplane:
- one canonical file-backed store,
- optional reproducible caches/materializations,
- no hidden shadow database,
- no duplication of project-local runtime or config authority.

The registry is a local operator convenience layer that helps the console remember and reopen projects. It is **not** the source of truth for what a project contains once that project is open.

## Proposed Canonical Storage Scope

### Canonical scope: machine-local, user-scoped

The canonical registry should be stored in the current user's Taskplane home, not inside any specific project.

Recommended location:

```text
~/.pi/agent/taskplane/project-registry.json
```

If Taskplane later formalizes a user-state subdirectory, the same logical location can be expressed as:

```text
<taskplane-user-home>/project-registry.json
```

where `<taskplane-user-home>` is the directory that already contains user-scoped Taskplane preferences.

### Why machine-local instead of project-local

A project registry exists to remember **many** projects across sessions. Storing the canonical registry under an individual project root would create several problems:
- the current project would incorrectly become the owner of a list of unrelated projects,
- switching to a new project would require already knowing where that project's local registry lives,
- the sidebar could not reliably show recent projects before one project root is chosen,
- workspace or repo-local registries would compete with the user-scoped navigation problem instead of solving it.

A machine-local user-scoped registry fits the intended behavior:
- one operator sees the projects they have actually opened,
- the list persists across sessions even when no project is currently active,
- the registry can contain active, archived, and recent metadata for unrelated roots, and
- Taskplane keeps project-local config and runtime files authoritative once a project is opened.

## Canonical vs Derived Storage Boundaries

### Canonical file

The registry's canonical data should be stored in a single JSON file:

```text
~/.pi/agent/taskplane/project-registry.json
```

That file contains:
- schema version,
- an array or map of canonical project records,
- optional top-level metadata such as migration version or last-compacted timestamp.

This file is the only authoritative answer to:
- which projects this local Taskplane installation knows about,
- which of them are archived,
- what their stable reopen paths and local activity timestamps are.

### Allowed derived caches/materializations

Optional derived files may exist for performance or UI convenience, but they must be safe to delete and rebuild.

Examples:
- `~/.pi/agent/taskplane/project-registry-cache.json`
- `~/.pi/agent/taskplane/project-registry-index.json`
- per-project dashboard caches under a project's `.pi/` directory
- in-memory sidebar summaries assembled by the dashboard server

Allowed derived content:
- sort indexes,
- fuzzy-search indexes,
- badge counts,
- missing-path diagnostics,
- recently rendered sidebar sections,
- snapshot summaries that combine registry records with live project state.

Forbidden as canonical storage:
- storing the only copy of archived/recent metadata inside a project's `.pi/`,
- storing the only copy of known-project entries in dashboard memory,
- materializing writable per-project mirrors that can drift from the canonical registry,
- using the current project's config or planning files as the sole registry of other known projects.

## File Format Proposal

Recommended JSON shape:

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-04-20T16:00:00.000Z",
  "projects": [
    {
      "id": "proj_01HXYZ...",
      "name": "Planely",
      "rootPath": "C:/src/Planely",
      "configPath": "C:/src/Planely/.pi/taskplane-config.json",
      "mode": "repo",
      "archived": false,
      "createdAt": "2026-04-01T09:00:00.000Z",
      "updatedAt": "2026-04-20T16:00:00.000Z",
      "lastOpenedAt": "2026-04-20T15:58:00.000Z",
      "lastBatchAt": "2026-04-19T20:00:00.000Z",
      "lastSeenConfigHash": null,
      "notes": null
    }
  ]
}
```

An array is acceptable in v1 because project counts will usually be small. Implementations may build an in-memory map keyed by `id` or normalized root for fast lookup.

## Why This Fits Taskplane Architecture

### It respects current root-based execution

Current CLI and dashboard flows still operate against one chosen root or workspace at a time. The registry does not replace that model.

Instead, it adds a user-scoped entry point above it:
1. the operator opens the console,
2. the console reads the machine-local registry,
3. the operator picks a known project,
4. Taskplane then resolves that project's root/config/pointer details and continues using existing per-root behavior.

This preserves current runtime and config authority.

### It keeps project-local truth in project files

Once a project is selected:
- project config still comes from `.pi/taskplane-config.json` or pointer-resolved equivalents,
- planning data still lives in project files such as `.taskplane/project/...`,
- runtime sidecars and batch history still live in that project's `.pi/`,
- packet and execution truth still live in task folders and runtime artifacts.

The registry stores navigation metadata only. It should never become the canonical home for project config, planning artifacts, or run history.

### It works in repo and workspace mode

The canonical registry record stores enough information to reopen either mode, but the canonical registry file remains user-scoped in both cases.

That means the location of the registry does **not** change across modes; only the contents of each project record do.

## Coexistence with Config and Workspace Mode

### Repo mode

For repo mode, a registry record points to:
- the repo root as `rootPath`, and
- the effective config file under that root as `configPath`.

Opening the project means handing control back to the existing repo-root resolution path.

### Workspace mode

For workspace mode, a registry record points to:
- the workspace root used as the operator entry point, and
- the effective config location or config-repo target used to resolve project-local Taskplane configuration.

This keeps workspace routing and pointers inside project-specific configuration semantics while the registry merely remembers how to reopen that workspace.

### Why not store the canonical registry under a workspace root?

Because a workspace root is still only one project context. Putting the canonical registry under `<workspace-root>/.pi/` would make that workspace the accidental owner of the user's project list and would fail when the operator wants to choose among unrelated workspaces or repos before selecting one.

### Relationship to global preferences

The registry belongs beside user-scoped Taskplane preferences because both are:
- local to the operator,
- independent of a specific project root,
- inspectable files, and
- inputs to the experience before a project is opened.

Preferences express operator defaults. The registry expresses operator-known project navigation state. They are related but separate files to avoid overloading preference semantics.

## Safe Local-First Update Semantics

The registry must be safe under normal concurrent desktop usage and resilient to interruption.

### Write strategy

Recommended v1 write flow:
1. read the existing registry file,
2. validate and normalize records in memory,
3. apply one logical mutation,
4. serialize the full JSON payload,
5. write to a temporary sibling file such as `project-registry.json.tmp`,
6. fsync/flush if available in the implementation environment,
7. atomically rename the temp file over `project-registry.json`,
8. optionally keep `project-registry.json.bak` as the most recent known-good copy.

This keeps updates simple and preserves a fully inspectable file.

### Mutation model

Use whole-file replace semantics for v1 rather than append-only journaling. The data set is expected to remain small, and whole-file writes make manual inspection and repair straightforward.

### Concurrency expectation

The dashboard, CLI, and future UI actions should treat the registry as a low-write local file.

Minimum safe behavior:
- reload before write,
- detect a changed mtime or content hash when feasible,
- retry the mutation against the newest version once,
- prefer deterministic merge rules based on canonical root identity and latest timestamp fields.

If a conflict cannot be merged safely, the write should fail loudly and preserve the prior file instead of silently dropping records.

## Missing, Partial, or Corrupt File Handling

Safe storage is not complete unless read-side recovery is defined.

### Missing file

If `project-registry.json` does not exist:
- treat it as an empty registry,
- create it lazily on first successful project-add/open/archive mutation,
- do not treat absence as an error for dashboard startup.

### Partial write / malformed JSON

If the canonical file exists but is malformed:
- do not silently discard it,
- surface a recoverable warning in logs/UI,
- attempt recovery from `project-registry.json.bak` if present and valid,
- otherwise preserve the malformed file for inspection and write a repaired replacement only through an explicit recovery flow.

Recommended recovery order:
1. try canonical file,
2. if invalid, try backup file,
3. if backup is valid, promote backup and keep the broken file with a `.corrupt-<timestamp>` suffix,
4. if neither is valid, expose an empty in-memory registry plus a visible warning until the operator repairs or re-adds projects.

### Invalid individual records

If the JSON file is valid but one record is malformed:
- skip only the malformed record when a safe record-level repair is possible,
- emit a diagnostic identifying the bad record,
- preserve the underlying file content for later repair rather than auto-deleting evidence.

A repair tool may later rewrite the file into normalized form, but the read path should avoid destructive "best guess" edits.

## Practical Lifecycle

Typical lifecycle under this proposal:
1. operator opens or initializes a Taskplane project,
2. Taskplane resolves the effective root/config details,
3. Taskplane upserts one record in `project-registry.json`,
4. the console derives recent/archive/sidebar groupings from the canonical record set,
5. once a project is selected, all project-local reads continue against that project's own files,
6. archive/unarchive and recent timestamps update the same machine-local registry file.

## Non-Goals

This storage proposal does not add:
- a cloud-synced account registry,
- team-shared project catalogs,
- a required daemon or database,
- project-local registries that supersede the user-scoped registry,
- hidden binary state outside inspectable files.
