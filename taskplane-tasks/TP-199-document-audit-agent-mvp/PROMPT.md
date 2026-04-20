# Task: TP-199 - Document Audit Agent MVP

**Created:** 2026-04-20
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Design task for a bounded document-audit agent that flags stale, review-due, superseded, or misleading docs. Important because docs can silently poison planning and execution if they remain ungoverned.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Canonical Task Folder

```text
taskplane-tasks/TP-199-document-audit-agent-mvp/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Define an MVP for a **Document Audit Agent** that scans project docs, evaluates provenance/freshness/lifecycle metadata, and flags documents that should be reviewed, archived, superseded, or handled carefully during task creation.

The MVP should remain conservative:
- diagnose and report first,
- recommend review/archive/supersession actions,
- and avoid broad autonomous document rewrites.

## Dependencies

- **TP-197** — Documentation governance policy
- **TP-198** — Document provenance and freshness model
- **TP-192** — Recovery / Helpdesk Agent product brief (adjacent; useful for thinking about doc drift as a recovery input)

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/documentation-governance-policy.md`
- `docs/specifications/operator-console/document-provenance-model.md`
- `docs/specifications/operator-console/document-freshness-model.md`
- representative docs in `docs/`

## Environment

- **Workspace:** `docs/specifications/`, future doc-governance tooling only
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/document-audit-agent-mvp.md` (new)
- `docs/specifications/operator-console/document-audit-report-schema.md` (new)

## Steps

### Step 0: Preflight

- [ ] Review governance, provenance, and freshness outputs
- [ ] Identify which doc states should be discoverable by an audit agent
- [ ] Identify what evidence the agent can use safely without guessing

### Step 1: MVP scope

Create `docs/specifications/operator-console/document-audit-agent-mvp.md` with:
- [ ] Goals and non-goals
- [ ] Inputs (docs, metadata, task progression, supersession links, maybe code/doc mismatch signals later)
- [ ] Outputs (review-due flags, stale-suspect flags, archive/supersede recommendations)
- [ ] Why the MVP is diagnose/report-first, not rewrite-first

### Step 2: Report schema

Create `docs/specifications/operator-console/document-audit-report-schema.md` with:
- [ ] Per-document fields: path, authority level, lifecycle state, provenance metadata, freshness status, evidence, recommendation
- [ ] Batch/project-level summary fields
- [ ] Confidence and ambiguity handling
- [ ] Suggested follow-up task output if a doc needs major review or archival work

### Step 3: Integration notes

In the MVP doc, define:
- [ ] How operators or supervisors might invoke doc audit
- [ ] How helpdesk/recovery could consume doc-drift findings
- [ ] Which actions remain manual or approval-gated

### Step 4: Verification & Delivery

- [ ] Verify the MVP stays bounded and conservative
- [ ] Verify the report shape supports future automation
- [ ] Log implementation follow-up tasks if the design is sound

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/document-audit-agent-mvp.md` (new)
- `docs/specifications/operator-console/document-audit-report-schema.md` (new)

**Check If Affected:**
- `docs/README.md` — only if doc audit becomes part of operator-maintainer workflow messaging soon

## Completion Criteria

- [ ] Document Audit Agent MVP is clearly defined and bounded
- [ ] Report schema is concrete enough for future tooling
- [ ] Interaction with helpdesk/recovery is acknowledged without merging responsibilities blindly
- [ ] Unsafe autonomous doc mutation is explicitly excluded

## Git Commit Convention

- **Step completion:** `docs(TP-199): complete Step N — description`
- **Hydration:** `hydrate: TP-199 expand Step N checkboxes`

## Do NOT

- Implement the document-audit agent in this task
- Auto-archive or rewrite docs in bulk
- Assume freshness metadata alone proves a doc is wrong
- Collapse helpdesk and doc-audit into one undifferentiated mega-agent

---

## Amendments (Added During Execution)
