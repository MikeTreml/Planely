# TP-198: Document Provenance and Freshness Model — Status

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
- [x] Review TP-197 and current doc types
- [x] Evaluate metadata encoding options
- [x] Identify special cases like README files

---

### Step 1: Provenance model
**Status:** ✅ Complete
- [x] Define provenance fields and meanings
- [x] Define required vs optional fields
- [x] Cover special-case docs cleanly

---

### Step 2: Freshness model
**Status:** ✅ Complete
- [x] Define task-distance freshness rules
- [x] Define review windows by doc type and authority level
- [x] Define derived freshness states
- [x] Explain why date-only freshness is insufficient

---

### Step 3: Encoding options and recommendation
**Status:** ✅ Complete
- [x] Compare frontmatter, sidecar, and manifest options
- [x] Recommend a default approach
- [x] Define migration/adoption guidance

---

### Step 4: Verification & Delivery
**Status:** 🟨 In Progress
- [ ] Verify practicality and tooling readiness
- [ ] Log follow-up tasks

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| 1 | Plan | 1 | APPROVE | _inline_ |
| 2 | Plan | 2 | REVISE | `.reviews/R002-plan-step2.md` |
| 3 | Plan | 2 | APPROVE | _inline_ |
| 4 | Plan | 3 | APPROVE | _inline_ |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-20 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 20:18 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 20:18 | Step 0 started | Preflight |
| 2026-04-20 20:24 | Step 0 completed | Reviewed TP-197 policy, current doc types, metadata options, and README special cases |
| 2026-04-20 20:24 | Step 1 started | Provenance model |
| 2026-04-20 20:25 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 20:31 | Step 1 completed | Documented provenance fields, required/optional rules, encoding guidance, and README-safe handling |
| 2026-04-20 20:31 | Step 2 started | Freshness model |
| 2026-04-20 20:31 | Review R002 | plan Step 2: REVISE |
| 2026-04-20 20:33 | Review R003 | plan Step 2: APPROVE |
| 2026-04-20 20:37 | Step 2 completed | Documented task-distance freshness rules, authority-aware review windows, derived states, and date-only limitations |
| 2026-04-20 20:37 | Step 3 started | Encoding options and recommendation |
| 2026-04-20 20:38 | Review R004 | plan Step 3: APPROVE |
| 2026-04-20 20:41 | Step 3 completed | Added encoding comparison matrix, default metadata priority, and incremental adoption guidance |
| 2026-04-20 20:41 | Step 4 started | Verification & Delivery |

---

## Blockers

*None*

---

## Notes

Provenance/freshness design task for document lifecycle metadata and review heuristics.
Reviewer suggestions to keep in mind:
- Make freshness thresholds concrete enough that future tooling can compute `active`, `review-due`, and `stale-suspect` consistently.
- Keep freshness tied to substantive review rather than cosmetic edits so typo-only changes do not reset trust signals.
| 2026-04-20 20:19 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 20:22 | Review R002 | plan Step 2: REVISE |
| 2026-04-20 20:23 | Review R003 | plan Step 2: APPROVE |
| 2026-04-20 20:25 | Review R004 | plan Step 3: APPROVE |
