# Task: TP-198 - Document Provenance and Freshness Model

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Design task for encoding doc provenance and review freshness in a way that is useful to operators and future tooling without relying on brittle filename conventions.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-198-document-provenance-and-freshness-model/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define a provenance and freshness model for project documents that answers:
- when and why a doc was created,
- what task last reviewed or materially updated it,
- whether it is review-due or stale-suspect,
- and how this should be encoded without polluting filenames.

This task should take the core idea of linking docs to task progress seriously, but should evaluate better mechanisms than putting task IDs directly into filenames.

## Dependencies

- **TP-197** — Documentation governance policy

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/documentation-governance-policy.md`
- representative docs in `docs/specifications/`, `docs/explanation/`, and root docs like `README.md`

## Environment

- **Workspace:** `docs/specifications/`
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/document-provenance-model.md` (new)
- `docs/specifications/operator-console/document-freshness-model.md` (new)

## Steps

### Step 0: Preflight

- [ ] Review the documentation governance policy
- [ ] Identify doc types that can easily carry frontmatter vs those that may need sidecars/manifests
- [ ] Evaluate task-ID-in-filename, frontmatter, sidecar, and registry approaches

### Step 1: Provenance model

Create `docs/specifications/operator-console/document-provenance-model.md` with:
- [ ] Canonical provenance fields such as createdByTask, lastReviewedTask, lastReviewedAt, authorityLevel, supersededBy, reviewWindowTasks
- [ ] Meaning of each field
- [ ] Which fields are required vs optional
- [ ] How to handle files like `README.md` that should not be renamed for freshness

### Step 2: Freshness model

Create `docs/specifications/operator-console/document-freshness-model.md` with:
- [ ] Task-distance-based freshness calculation
- [ ] Review windows by doc type / authority level
- [ ] Derived states such as review-due and stale-suspect
- [ ] Why date-only freshness is not enough

### Step 3: Encoding options and recommendation

Across the two docs, add:
- [ ] Comparison of frontmatter, sidecar metadata, and registry manifest approaches
- [ ] Recommended default approach
- [ ] Migration/adoption strategy for existing docs without metadata

### Step 4: Verification & Delivery

- [ ] Verify the model is practical for common doc types
- [ ] Verify the model supports future auditing/automation
- [ ] Log follow-up tasks for implementation and doc-audit tooling

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/document-provenance-model.md` (new)
- `docs/specifications/operator-console/document-freshness-model.md` (new)

**Check If Affected:**
- `docs/README.md` — only if provenance/freshness status should surface there soon

## Completion Criteria

- [ ] Provenance fields are clearly defined
- [ ] Freshness uses task-distance rather than dates alone
- [ ] Filename-based approaches are evaluated but not relied on by default
- [ ] The model is implementation-ready enough for tooling follow-up

## Git Commit Convention

- **Step completion:** `docs(TP-198): complete Step N — description`
- **Hydration:** `hydrate: TP-198 expand Step N checkboxes`

## Do NOT

- Implement metadata rollout in this task
- Rename the whole docs tree
- Force a single encoding method without considering doc type differences
- Treat freshness as the same thing as correctness

---

## Amendments (Added During Execution)
