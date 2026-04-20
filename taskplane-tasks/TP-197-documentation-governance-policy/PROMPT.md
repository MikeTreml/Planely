# Task: TP-197 - Documentation Governance Policy

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Governance/spec task defining how docs remain trustworthy as the project evolves. Important because stale docs can poison planning and execution even when the code is healthy.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-197-documentation-governance-policy/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define a documentation governance policy for Planely / Taskplane project artifacts so docs can be treated as trustworthy, reviewable, and archivable as the project evolves.

The policy should address the real operational problem:
- old docs continue to look current,
- ideas change without docs being archived or superseded,
- task packets may cite stale material,
- and project progress can outpace document review.

The policy should prefer metadata/provenance and explicit lifecycle states over fragile filename hacks.

## Dependencies

- **TP-192** — Recovery / Helpdesk Agent product brief (adjacent; helps frame doc drift as a recovery concern)

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/README.md`
- `docs/specifications/operator-console/*.md`
- `README.md`
- representative historical docs/specs in `docs/specifications/` and `docs/explanation/`

## Environment

- **Workspace:** `docs/specifications/`, documentation governance only
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/documentation-governance-policy.md` (new)

## Steps

### Step 0: Preflight

- [ ] Review the current docs layout and categories
- [ ] Identify common drift patterns: stale-but-active docs, superseded docs, historical docs still cited, missing provenance
- [ ] Evaluate filename-based freshness ideas vs metadata-based alternatives

### Step 1: Define lifecycle states

Create `docs/specifications/operator-console/documentation-governance-policy.md` with:
- [ ] Doc lifecycle states: draft, active, review-due, stale-suspect, superseded, archived, historical (or equivalent bounded set)
- [ ] Meaning and expected handling for each state
- [ ] Rules for when a doc should be reviewed, archived, or superseded

### Step 2: Define governance rules

In the same file, define:
- [ ] Which docs are authoritative vs contextual vs historical
- [ ] How supersession should be recorded
- [ ] How stale docs should be cited or avoided in future task packets
- [ ] Why filename encoding is insufficient as the primary mechanism

### Step 3: Connect docs to project progress

In the same file, add:
- [ ] How task progression should influence review expectations
- [ ] Why date-only freshness is insufficient
- [ ] Initial guidance for task-distance-based review windows by doc type

### Step 4: Verification & Delivery

- [ ] Verify the policy is practical for maintainers and future tooling
- [ ] Verify the policy supports archive / review workflows without excessive churn
- [ ] Log follow-up tasks for metadata, auditing, and supervisor/helpdesk integration

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/documentation-governance-policy.md` (new)

**Check If Affected:**
- `docs/README.md` — only if governance states should be surfaced in the docs index immediately

## Completion Criteria

- [ ] Documentation lifecycle states are clearly defined
- [ ] Governance avoids relying primarily on filenames for freshness
- [ ] Task-distance / project-progress review thinking is captured
- [ ] Follow-up work is clearly identified

## Git Commit Convention

- **Step completion:** `docs(TP-197): complete Step N — description`
- **Hydration:** `hydrate: TP-197 expand Step N checkboxes`

## Do NOT

- Implement doc metadata or auditing in this task
- Rename docs en masse
- Assume every old doc is wrong merely because it is old
- Make filenames carry the entire governance system

---

## Amendments (Added During Execution)
