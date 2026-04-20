# TP-188: Project Registry, Recent, and Archive State — Status

**Current Step:** Step 4: Verification & Delivery
**Status:** ✅ Complete
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 5
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read product/domain/storage specs
- [x] Identify current single-project/root assumptions
- [x] Define minimum registry requirements

---

### Step 1: Project registry model
**Status:** ✅ Complete
- [x] Define project record fields
- [x] Define canonical vs derived fields
- [x] Define active/archived/recent grouping rules
- [x] Define duplicate-root, rename, and missing-path rules

---

### Step 2: Storage proposal
**Status:** ✅ Complete
- [x] Define registry file location
- [x] Define canonical-vs-derived storage boundaries and local scope
- [x] Explain coexistence with config/workspace mode
- [x] Define safe local-first update semantics, including recovery from missing/corrupt/partial files

---

### Step 3: Adoption and behavior notes
**Status:** ✅ Complete
- [x] Define existing-project discovery/addition path
- [x] Define archive/unarchive behavior
- [x] Define recent tracking/pruning
- [x] Capture out-of-scope items

---

### Step 4: Verification & Delivery
**Status:** ✅ Complete
- [x] Verify support for TP-187 sidebar needs
- [x] Verify local-first inspectable design
- [x] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| R001 | Plan | 1 | REVISE | `.reviews/R001-plan-step1.md` |
| R002 | Plan | 1 | APPROVE | n/a |
| R003 | Plan | 2 | REVISE | `.reviews/R003-plan-step2.md` |
| R004 | Plan | 2 | APPROVE | n/a |
| R005 | Plan | 3 | APPROVE | n/a |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Dashboard server currently resolves a single `REPO_ROOT` from `--root`/cwd and reads one `.pi/` sidecar namespace at a time. | Use this as the baseline constraint for registry/sidebar design. | `dashboard/server.cjs` |
| CLI init/config flows still assume one active project root from `process.cwd()`, with one project config and one default `taskRunner.project`/`paths.tasks` target per invocation. | Registry must layer above current root-based commands instead of redefining them. | `bin/taskplane.mjs` |
| A user-scoped canonical registry file best fits multi-project sidebar navigation because it can remember unrelated roots before any specific project is opened. | Adopted in storage proposal as `~/.pi/agent/taskplane/project-registry.json`; keep project-local `.pi/` and `.taskplane/` files authoritative once a project is selected. | `docs/specifications/operator-console/project-registry-storage.md` |
| Recent should remain a derived overlay from canonical timestamps rather than a separate recent-project store. | Supports TP-187 sidebar sections without creating competing project truth. | `docs/specifications/operator-console/project-registry.md`, `docs/specifications/operator-console/project-registry-adoption.md` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 16:38 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 16:38 | Step 0 started | Preflight |
| 2026-04-20 16:44 | Step 0 completed | Preflight notes captured in STATUS.md |
| 2026-04-20 16:44 | Step 1 started | Project registry model |
| 2026-04-20 16:46 | Step 1 plan reviewed | R001 revise, then R002 approve after adding edge-case coverage |
| 2026-04-20 16:48 | Step 1 completed | `project-registry.md` drafted |
| 2026-04-20 16:48 | Step 2 started | Storage proposal |
| 2026-04-20 16:49 | Step 2 plan reviewed | R003 revise, then R004 approve after adding storage-scope and recovery outcomes |
| 2026-04-20 16:52 | Step 2 completed | `project-registry-storage.md` drafted |
| 2026-04-20 16:52 | Step 3 started | Adoption and behavior notes |
| 2026-04-20 16:53 | Step 3 plan reviewed | R005 approve |
| 2026-04-20 16:55 | Step 3 completed | `project-registry-adoption.md` drafted |
| 2026-04-20 16:55 | Step 4 started | Verification & Delivery |
| 2026-04-20 16:57 | Step 4 completed | Verified TP-187/sidebar fit and local-first storage/recovery constraints |
| 2026-04-20 16:52 | Worker iter 1 | done in 811s, tools: 89 |
| 2026-04-20 16:52 | Task complete | .DONE created |

---

## Blockers

*None*

---

## Notes

Registry/storage design task for multi-project navigation support.

Preflight findings:
- Dashboard currently serves one project/workspace root per process via `--root` and reads runtime sidecars from that root's `.pi/` directory.
- CLI init, uninstall, and save-defaults flows resolve the current project from `process.cwd()`, then read/write one effective project config at a time.
- Existing workspace support handles routing/pointers for config and tasks, but operator-facing navigation still lacks a durable local registry of known projects.

Minimum registry requirements:
- A project needs a stable local identity, display name, canonical root/config location, and enough metadata to reopen it safely.
- Archive state must be explicit and reversible, and must never imply deletion of project files or runtime history.
- Recent state must be derived from local usage timestamps, pruneable, and secondary to the canonical project record.
- The registry must stay inspectable and local-first, with one canonical record store and only reproducible derived views/caches around it.
- Reviewer suggestion noted: tie identity rules back to current root-based CLI/dashboard behavior and make “recent” explicitly derived from timestamps on the canonical project record.
- Reviewer suggestion noted for Step 2: reuse the canonical-vs-derived storage boundary language from `planning-storage-layout.md` and explicitly layer the registry above current root/pointer behavior.

Verification notes:
- TP-187 sidebar requirements are directly supported: `project-registry.md` defines active/archived/recent grouping, row-level derived fields such as `lastActivityAt`/`isMissing`, and ordering guidance for sidebar rendering.
- `project-registry-adoption.md` keeps archived projects discoverable but de-emphasized, defines recent-pruning for the rendered view only, and preserves missing/stale project visibility for graceful UI handling.
- `project-registry-storage.md` keeps the design local-first and inspectable by using a user-scoped JSON registry plus optional reproducible caches, atomic temp-and-rename writes, and explicit corrupt/missing-file recovery behavior.
| 2026-04-20 16:41 | Review R001 | plan Step 1: REVISE |
| 2026-04-20 16:42 | Review R002 | plan Step 1: APPROVE |
| 2026-04-20 16:45 | Review R003 | plan Step 2: REVISE |
| 2026-04-20 16:46 | Review R004 | plan Step 2: APPROVE |
| 2026-04-20 16:49 | Review R005 | plan Step 3: APPROVE |
