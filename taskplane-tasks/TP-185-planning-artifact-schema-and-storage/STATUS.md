# TP-185: Planning Artifact Schema and Storage — Status

**Current Step:** Step 1: Planning artifact schema
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 1
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read TP-180 outputs and architecture docs
- [x] Identify implicit planning data today
- [x] Define requirements for the planning layer

---

### Step 1: Planning artifact schema
**Status:** 🟨 In Progress
- [ ] Define artifact types and fields
- [ ] Distinguish canonical planning fields from runtime references/projections
- [ ] Define linking model
- [ ] Standardize reference shape/cardinality for task packet and batch links
- [ ] Define audit/history expectations

---

### Step 2: Storage layout proposal
**Status:** ⬜ Not Started
- [ ] Define on-disk layout
- [ ] Define naming/ID conventions
- [ ] Define coexistence with task/runtime state

---

### Step 3: Migration and adoption notes
**Status:** ⬜ Not Started
- [ ] Define incremental adoption path
- [ ] Explain optionality and no-DB rationale
- [ ] Capture risks and triggers for future change

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify mono-repo/workspace practicality
- [ ] Confirm no duplicate canonical state
- [ ] Log discoveries

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| 1 | Plan | 1 | REVISE | `.reviews/R001-plan-step1.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 16:23 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 16:23 | Step 0 started | Preflight |

---

## Blockers

*None*

---

## Notes

Planning-layer design task; no implementation in this packet.

Preflight findings:
- Current planning intent is implicit across task packet titles, mission/dependencies sections, operator-console brief/domain docs, area `CONTEXT.md`, and append-only packet history in `STATUS.md` rather than first-class project artifacts.
- Planning-layer requirements captured for this spec: canonical files must remain human-inspectable; planning artifacts may describe intent but cannot redefine packet/run/batch truth; links must favor stable IDs/paths over embedded copies; history should be append-only where possible; discovery must work in mono-repo and workspace layouts without requiring a database or always-on service.
- Plan review suggestion to fold into Step 1 doc: include a short "not stored here" / non-goals section so later implementation tasks can see duplicate-authority boundaries at a glance.
| 2026-04-20 16:26 | Review R001 | plan Step 1: REVISE |
