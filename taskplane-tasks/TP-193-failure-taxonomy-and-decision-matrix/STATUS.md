# TP-193: Failure Taxonomy and Decision Matrix — Status

**Current Step:** Step 4: Verification & Delivery
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 4
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
**Status:** ✅ Complete
- [x] Define action choices by class
- [x] Define retry vs retry-after-fix vs redirect vs replan conditions
- [x] Define skip and split-task conditions
- [x] Cover doc-drift and planning-mismatch cases
- [x] Define batch-level pause vs abort vs restart triggers

---

### Step 3: One-time vs recurring fixes
**Status:** ✅ Complete
- [x] Distinguish temporary vs systemic fixes
- [x] Add examples and follow-up guidance
- [x] Define expected recommendation shape

---

### Step 4: Verification & Delivery
**Status:** ✅ Complete
- [x] Verify matrix usefulness and clarity
- [x] Log open questions

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| R001 | plan | 1 | APPROVE | `.reviews/R001-plan-step1.md` |
| R002 | plan | 2 | REVISE | `.reviews/R002-plan-step2.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Distinguishing flaky implementation from runtime-induced instability will likely need stricter artifact requirements (for example repeated run metadata and control-plane logs) once the helpdesk output contract is implemented. | Logged as follow-up design question for future helpdesk implementation tasks. | `docs/specifications/operator-console/recovery-failure-taxonomy.md` |

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
| 2026-04-20 19:30 | Step 2 started | Decision matrix |
| 2026-04-20 19:31 | Review R002 | plan Step 2: REVISE |
| 2026-04-20 19:33 | Review R003 | plan Step 2: APPROVE |
| 2026-04-20 19:35 | Decision matrix skeleton drafted | Created `recovery-decision-matrix.md` with decision priorities and an immediate-action table mapping each failure class to signals, default owners, and actions to avoid. |
| 2026-04-20 19:38 | Retry decision branches added | Added explicit conditions for plain retry, retry-after-fix, redirect, and replan with evidence-driven rules about packet validity, owner boundaries, and when unchanged re-execution is unsafe. |
| 2026-04-20 19:40 | Skip and split guidance added | Added explicit rules for when to skip a packet with justification versus splitting repair/grounding work from later implementation work. |
| 2026-04-20 19:41 | Doc-drift handling added | Added separate decision rules for archiving/reviewing stale docs/specs versus replanning packets whose scope or ownership is wrong even when the source material is current. |
| 2026-04-20 19:43 | Batch escalation guidance added | Added pause/abort/restart triggers and escalation thresholds so repeated shared failures do not stay trapped inside task-level retry loops. |
| 2026-04-20 19:44 | Step 3 started | One-time vs recurring fixes |
| 2026-04-20 19:46 | One-time vs systemic distinction added | Added decision rules distinguishing local run repairs from recurring failure patterns that should trigger policy, template, documentation, or runtime follow-up work. |
| 2026-04-20 19:48 | Follow-up examples added | Added examples and guidance for when to open a new repair/hardening packet instead of trying to recover the current packet in place. |
| 2026-04-20 19:49 | Recommendation contract added | Added a consistent output shape with classification, confidence, evidence, action, owner, one-time repair, recurring-fix recommendation, and do-not-proceed signaling. |
| 2026-04-20 19:51 | Step 4 started | Verification and delivery |
| 2026-04-20 19:53 | Clarity checklist added | Reviewed the taxonomy/matrix together and added an operator clarity checklist to ensure each recommendation names evidence, owner, next action, retry condition, and whether the packet should stop or continue. |
| 2026-04-20 19:54 | Open questions logged | Added implementation-facing open questions on batch-level evidence thresholds, flaky-vs-runtime disambiguation, stale-doc subclassing, and when recurring incidents should trigger systemic follow-up tasks. |

---

## Blockers

*None*

---

## Notes

Defines the evidence-driven recovery classification system for future helpdesk behavior.
- Preflight distinction: implementation failures should be separated from repo-state/worktree integrity, config/environment mismatches, stale documentation/spec grounding, planning mismatch, and orchestrator/runtime faults because the same symptom (missing file, failed verification, task stall) implies different owners and actions.
- Concrete evidence examples gathered for the taxonomy: `.pi/supervisor/treml-20260419T215723-summary.md` documents blocked workers caused by prompt-scoped files absent from the repo snapshot; `.pi/diagnostics/treml-20260420T094622-report.md` shows a failed task within an otherwise successful batch; TP-192 notes cite post-merge verification mismatches such as `extensions dir not found` and stale docs/spec assumptions.
- R002 suggestion: keep Step 2 matrix branches keyed to observable signals and include escalation thresholds where repeated task-level failures should trigger batch-level intervention.
| 2026-04-20 19:17 | Review R003 | plan Step 2: APPROVE |
| 2026-04-20 19:20 | Review R004 | plan Step 3: APPROVE |
