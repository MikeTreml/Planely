# TP-198: Document Provenance and Freshness Model — Status

**Current Step:** Step 2: Freshness model
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 1
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
**Status:** 🟨 In Progress
- [ ] Define task-distance freshness rules
- [ ] Define review windows by doc type
- [ ] Define derived freshness states

---

### Step 3: Encoding options and recommendation
**Status:** ⬜ Not Started
- [ ] Compare frontmatter, sidecar, and manifest options
- [ ] Recommend a default approach
- [ ] Define migration/adoption guidance

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify practicality and tooling readiness
- [ ] Log follow-up tasks

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| 1 | Plan | 1 | APPROVE | _inline_ |

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

---

## Blockers

*None*

---

## Notes

Provenance/freshness design task for document lifecycle metadata and review heuristics.
| 2026-04-20 20:19 | Review R001 | plan Step 1: APPROVE |
