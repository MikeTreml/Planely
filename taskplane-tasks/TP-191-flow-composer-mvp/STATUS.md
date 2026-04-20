# TP-191: Flow Composer MVP — Status

**Current Step:** Step 3: Compile/execution model
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 3
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read Operator Console outputs
- [x] Review current Taskplane execution concepts
- [x] Separate clean-fit ideas from deferred ideas

---

### Step 1: MVP scope and UX
**Status:** ✅ Complete
- [x] Define problem statement and goals
- [x] Define MVP scope and non-goals
- [x] Define initial operator flows

---

### Step 2: Block model
**Status:** ✅ Complete
- [x] Define primitive blocks
- [x] Define control/container blocks
- [x] Define metadata and validation rules
- [x] Mark v1 vs deferred blocks

---

### Step 3: Compile/execution model
**Status:** 🟨 In Progress
- [ ] Define visual-flow to Taskplane mapping
- [ ] Define representation/compile format
- [ ] Define multi-agent role assignment without a second runtime
- [ ] Define safe loop and parallel semantics
- [ ] Define guardrails

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify Taskplane remains runtime of record
- [ ] Verify the MVP is incremental and bounded
- [ ] Log discoveries and follow-ups

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Flow Composer can safely compile to packet/orchestration templates because Taskplane already owns tasks, batches, waves, lanes, supervisor control, and review semantics. | Carry into MVP and compile-model docs | docs/specifications/operator-console/flow-composer-*.md |
| Freeform drag-and-drop automation, arbitrary scripting blocks, and open-ended loop behavior would create a second runtime/authority layer instead of a bounded UX surface. | Explicitly defer beyond MVP | docs/specifications/operator-console/flow-composer-*.md |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 19:11 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 19:11 | Step 0 started | Preflight |

---

## Blockers

*None*

---

## Notes

This task defines the first bounded spec for workflow blocks / Flow Composer.

Preflight fit summary:
- Clean fit today: template-driven flow setup, bounded block composition, human approvals, and multi-agent execution that compiles down to existing task packets, orchestrator plans, waves/lanes, and review boundaries.
- Needs deferral: arbitrary canvas automation, runtime-mutating scripts, unconstrained branching, dynamic fan-out loops, and any model where the UI becomes a second execution scheduler or state authority.
- R003 suggestion logged: keep saved-flow definition, bounded intermediate JSON, and launch-time Taskplane artifacts as separate concepts in the compile model.
| 2026-04-20 19:14 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 19:16 | Review R002 | plan Step 2: APPROVE |
| 2026-04-20 19:18 | Review R003 | plan Step 3: REVISE |
