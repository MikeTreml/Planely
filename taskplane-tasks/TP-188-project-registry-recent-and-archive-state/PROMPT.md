# Task: TP-188 - Project Registry, Recent, and Archive State

**Created:** 2026-04-19
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Design task for a lightweight, file-backed project registry that supports sidebar/navigation and active-vs-archived visibility. Important architectural decision with no implementation required in this packet.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-188-project-registry-recent-and-archive-state/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define a lightweight project registry model for Taskplane so the dashboard/operator console can render a stable list of projects with active, archived, and recent states. The registry should fit Taskplane’s local-first, inspectable architecture and should not require a database or cloud service.

This task should answer:
- What is a “project” in Taskplane terms?
- Where is project metadata stored?
- How do archive and recent semantics work?
- How does this support a sidebar without creating conflicting sources of truth?

## Dependencies

- **TP-180** — Operator Console product framing
- **TP-185** — Planning/storage direction

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/domain-model.md`
- `docs/specifications/operator-console/planning-storage-layout.md`
- `dashboard/server.cjs` — current root/project assumptions
- `bin/taskplane.mjs` — current init/workspace assumptions
- `docs/explanation/architecture.md`

## Environment

- **Workspace:** `docs/specifications/`, possible future `.taskplane/` metadata layout
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/project-registry.md` (new)
- `docs/specifications/operator-console/project-registry-storage.md` (new)
- `docs/specifications/operator-console/project-registry-adoption.md` (new)

## Steps

### Step 0: Preflight

- [ ] Read relevant product/domain/storage specs
- [ ] Identify where Taskplane currently assumes a single current project/root
- [ ] Define minimal requirements for project identity, recency, and archive state

### Step 1: Project registry model

Create `docs/specifications/operator-console/project-registry.md` with:
- [ ] Definition of a project record (id, name, root, archived, lastOpenedAt, lastBatchAt, etc.)
- [ ] Which fields are canonical vs derived
- [ ] Rules for active vs archived vs recent grouping
- [ ] Rules for duplicate roots / renamed projects / missing paths

### Step 2: Storage proposal

Create `docs/specifications/operator-console/project-registry-storage.md` with:
- [ ] Proposed file location(s) for the registry
- [ ] Why the chosen location fits Taskplane architecture
- [ ] How the registry coexists with project-local config and workspace mode
- [ ] How updates happen safely without needing a database

### Step 3: Adoption and behavior notes

Create `docs/specifications/operator-console/project-registry-adoption.md` with:
- [ ] How existing users/projects are discovered or added
- [ ] How archive/unarchive works
- [ ] How recent projects are tracked/pruned
- [ ] What remains out of scope for v1 (pinning, cloud sync, team-wide shared registry, etc.)

### Step 4: Verification & Delivery

- [ ] Verify the registry model supports TP-187 sidebar needs
- [ ] Verify the design stays local-first and inspectable
- [ ] Log follow-up implementation tasks and edge cases

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/project-registry.md` (new)
- `docs/specifications/operator-console/project-registry-storage.md` (new)
- `docs/specifications/operator-console/project-registry-adoption.md` (new)

**Check If Affected:**
- `docs/explanation/architecture.md` — only if project registry becomes part of the current documented architecture immediately

## Completion Criteria

- [ ] Project registry model is concrete and file-backed
- [ ] Archive and recent semantics are clearly defined
- [ ] Registry supports sidebar/navigation use cases without conflicting sources of truth
- [ ] Adoption path for existing users is practical

## Git Commit Convention

- **Step completion:** `docs(TP-188): complete Step N — description`
- **Hydration:** `hydrate: TP-188 expand Step N checkboxes`

## Do NOT

- Implement the registry in code in this task
- Introduce a database or hosted service requirement
- Conflate archived with deleted
- Create a team/global sync system beyond the local-first scope

---

## Amendments (Added During Execution)
