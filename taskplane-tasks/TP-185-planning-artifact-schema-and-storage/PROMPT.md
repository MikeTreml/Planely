# Task: TP-185 - Planning Artifact Schema and Storage

**Created:** 2026-04-19
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Design/spec task for introducing a planning layer above task packets. Moderate architectural importance but no runtime code changes yet.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-185-planning-artifact-schema-and-storage/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define a lightweight, file-backed planning layer for Taskplane that sits above task packets without replacing them. The goal is to support project-app concepts like ideas, specs, initiatives, and milestones while preserving Taskplane's local-first, inspectable architecture.

The result should be a concrete schema/storage proposal, not a vague brainstorm.

## Dependencies

- **TP-180** — Product brief and domain model

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/domain-model.md`
- `docs/explanation/architecture.md`
- `README.md`
- `../OpenClawWorkshop/docs/00-overview.md`
- `../OpenClawWorkshop/docs/11-event-log-spec.md`
- `../OpenClawWorkshop/docs/17-run-state-schema.md`

## Environment

- **Workspace:** `docs/specifications/`, `.taskplane/` conventions, `taskplane-tasks/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/planning-artifacts.md` (new)
- `docs/specifications/operator-console/planning-storage-layout.md` (new)
- `docs/specifications/operator-console/planning-migration-notes.md` (new)

## Steps

### Step 0: Preflight

- [ ] Read TP-180 outputs and relevant architecture docs
- [ ] Identify what planning information exists today only implicitly (task titles, docs, folder structure, history)
- [ ] Define requirements for a planning layer that does not fight the file-backed model

### Step 1: Planning artifact schema

Create `docs/specifications/operator-console/planning-artifacts.md` with:
- [ ] Artifact types: idea, spec, initiative, milestone (and any justified minimal additions)
- [ ] Required/optional fields for each
- [ ] Linking model to task packets and batches
- [ ] Audit/history expectations

### Step 2: Storage layout proposal

Create `docs/specifications/operator-console/planning-storage-layout.md` with:
- [ ] Proposed on-disk layout (likely under `.taskplane/project/` or similar)
- [ ] Naming/ID conventions
- [ ] How canonical planning files are discovered and rendered
- [ ] How this coexists with task packets, `.pi/` state, and workspace mode

### Step 3: Migration and adoption notes

Create `docs/specifications/operator-console/planning-migration-notes.md` with:
- [ ] How existing projects can adopt the planning layer incrementally
- [ ] What remains optional in v1
- [ ] Why a database is not required yet
- [ ] Risks and future triggers that might justify a different storage model later

### Step 4: Verification & Delivery

- [ ] Verify the proposal is practical for mono-repo and workspace mode
- [ ] Ensure it does not create duplicate canonical state with task packets/runtime data
- [ ] Log follow-up tasks or prerequisites

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/planning-artifacts.md` (new)
- `docs/specifications/operator-console/planning-storage-layout.md` (new)
- `docs/specifications/operator-console/planning-migration-notes.md` (new)

**Check If Affected:**
- `docs/explanation/architecture.md` — only if the planning layer becomes part of the currently documented architecture immediately

## Completion Criteria

- [ ] Planning artifacts are concretely defined
- [ ] Storage layout is local-first, inspectable, and compatible with workspace mode
- [ ] Migration path is incremental and explicit
- [ ] No unnecessary database or service dependencies are introduced

## Git Commit Convention

- **Step completion:** `docs(TP-185): complete Step N — description`
- **Hydration:** `hydrate: TP-185 expand Step N checkboxes`

## Do NOT

- Implement the planning layer in code in this task
- Replace task packets as the execution contract
- Introduce a database requirement without strong evidence
- Create a generalized PM platform spec far beyond Taskplane’s scope

---

## Amendments (Added During Execution)
