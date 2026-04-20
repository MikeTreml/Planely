# TP-193: Failure Taxonomy and Decision Matrix — Status

**Current Step:** Step 1: Failure taxonomy
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 1
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Review TP-192 and recent incident patterns
- [x] Separate failure classes cleanly
- [x] Gather concrete evidence examples

---

### Step 1: Failure taxonomy
**Status:** ✅ Complete
- [x] Define core failure categories
- [x] Define symptoms and evidence
- [x] Define common false positives

---

### Step 2: Decision matrix
**Status:** ⬜ Not Started
- [ ] Define action choices by class
- [ ] Define retry vs redirect vs replan conditions
- [ ] Cover doc-drift and planning-mismatch cases

---

### Step 3: One-time vs recurring fixes
**Status:** ⬜ Not Started
- [ ] Distinguish temporary vs systemic fixes
- [ ] Add examples and follow-up guidance
- [ ] Define expected recommendation shape

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify matrix usefulness and clarity
- [ ] Log open questions

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-20 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 19:11 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 19:11 | Step 0 started | Preflight |
| 2026-04-20 19:16 | Preflight evidence review | Read TP-192 brief/status, recent supervisor summaries, and diagnostic reports; confirmed recurring incident themes: missing snapshot files / lane checkout gaps, repo-state mismatches, merge-verification assumption mismatches, and stale doc/spec grounding. |
| 2026-04-20 19:18 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 19:18 | Step 1 started | Failure taxonomy |
| 2026-04-20 19:22 | Taxonomy categories drafted | Created `recovery-failure-taxonomy.md` with nine evidence-oriented recovery classes covering implementation, flaky behavior, testing, merge verification, repo state, config, stale docs/specs, planning mismatch, and runtime/orchestrator faults. |
| 2026-04-20 19:26 | Taxonomy evidence model added | Added per-category typical symptoms and required evidence so classification can be grounded in diffs, tests, merge logs, packet references, config sources, and supervisor/runtime artifacts. |
| 2026-04-20 19:29 | Taxonomy overlap guidance added | Added false-positive guidance for missing-file, flaky, test-vs-implementation, merge-vs-repo-state, stale-spec-vs-planning, and config-vs-runtime overlaps plus evidence quality rules. |

---

## Blockers

*None*

---

## Notes

Defines the evidence-driven recovery classification system for future helpdesk behavior.
- Preflight distinction: implementation failures should be separated from repo-state/worktree integrity, config/environment mismatches, stale documentation/spec grounding, planning mismatch, and orchestrator/runtime faults because the same symptom (missing file, failed verification, task stall) implies different owners and actions.
- Concrete evidence examples gathered for the taxonomy: `.pi/supervisor/treml-20260419T215723-summary.md` documents blocked workers caused by prompt-scoped files absent from the repo snapshot; `.pi/diagnostics/treml-20260420T094622-report.md` shows a failed task within an otherwise successful batch; TP-192 notes cite post-merge verification mismatches such as `extensions dir not found` and stale docs/spec assumptions.
| 2026-04-20 19:13 | Review R001 | plan Step 1: APPROVE |
