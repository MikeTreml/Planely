# TP-188: Project Registry, Recent, and Archive State — Status

**Current Step:** Step 2: Storage proposal
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 3
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
**Status:** 🟨 In Progress
- [ ] Define registry file location
- [ ] Define canonical-vs-derived storage boundaries and local scope
- [ ] Explain coexistence with config/workspace mode
- [ ] Define safe local-first update semantics, including recovery from missing/corrupt/partial files

---

### Step 3: Adoption and behavior notes
**Status:** ⬜ Not Started
- [ ] Define existing-project discovery/addition path
- [ ] Define archive/unarchive behavior
- [ ] Define recent tracking/pruning
- [ ] Capture out-of-scope items

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify support for TP-187 sidebar needs
- [ ] Verify local-first inspectable design
- [ ] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| R001 | Plan | 1 | REVISE | `.reviews/R001-plan-step1.md` |
| R002 | Plan | 1 | APPROVE | n/a |
| R003 | Plan | 2 | REVISE | `.reviews/R003-plan-step2.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Dashboard server currently resolves a single `REPO_ROOT` from `--root`/cwd and reads one `.pi/` sidecar namespace at a time. | Use this as the baseline constraint for registry/sidebar design. | `dashboard/server.cjs` |
| CLI init/config flows still assume one active project root from `process.cwd()`, with one project config and one default `taskRunner.project`/`paths.tasks` target per invocation. | Registry must layer above current root-based commands instead of redefining them. | `bin/taskplane.mjs` |

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
| 2026-04-20 16:41 | Review R001 | plan Step 1: REVISE |
| 2026-04-20 16:42 | Review R002 | plan Step 1: APPROVE |
| 2026-04-20 16:45 | Review R003 | plan Step 2: REVISE |
