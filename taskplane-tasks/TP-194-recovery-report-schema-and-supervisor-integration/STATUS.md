# TP-194: Recovery Report Schema and Supervisor Integration — Status

**Current Step:** Step 2: Supervisor integration model
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 1
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Review TP-192 and TP-193 outputs
- [x] Review current supervisor summaries and actions
- [x] Identify what must be structured vs narrative

---

### Step 1: Recovery report schema
**Status:** ✅ Complete
- [x] Define markdown and JSON report contracts
- [x] Define required and optional fields
- [x] Verify schema supports both humans and automation

---

### Step 2: Supervisor integration model
**Status:** 🟨 In Progress
- [ ] Define trigger conditions
- [ ] Define invocation and relay behavior
- [ ] Define approval boundaries

---

### Step 3: Escalation and replan behavior
**Status:** ⬜ Not Started
- [ ] Define redirect / replan outcomes
- [ ] Define follow-up task recommendation behavior
- [ ] Ensure unsafe automation is excluded

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify clarity and implementability
- [ ] Log open questions and prerequisites

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| 1 | Plan | 1 | APPROVE | inline review_step |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Structured fields should cover classification, confidence, immediate action, owner, autonomy boundary, do-not-proceed flag, and follow-up task metadata; narrative should stay in evidence summary and rationale sections. | Apply in report schema and supervisor integration specs. | Step 0 preflight synthesis |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-20 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 20:18 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 20:18 | Step 0 started | Preflight |
| 2026-04-20 20:25 | Reviewed TP-192/TP-193 inputs | Product brief, failure taxonomy, and decision matrix loaded for schema design |
| 2026-04-20 20:27 | Reviewed supervisor artifacts | Current summaries and actions emphasize incidents, terse recommendations, and explicit steer/diagnose commands |
| 2026-04-20 20:29 | Classified structured vs narrative needs | Machine fields separated from human evidence/rationale prose for upcoming specs |
| 2026-04-20 20:30 | Step 1 started | Recovery report schema |
| 2026-04-20 20:31 | Plan review (Step 1) | APPROVE |
| 2026-04-20 20:39 | Drafted recovery report contract | Added markdown section order and JSON envelope in recovery-report-schema.md |
| 2026-04-20 20:40 | Defined field requirements | Captured required vs optional report fields and bounded action vocabulary |
| 2026-04-20 20:41 | Verified dual-audience schema | Added explicit structured-vs-narrative rules and minimum acceptance checks |
| 2026-04-20 20:42 | Step 2 started | Supervisor integration model |

---

## Blockers

*None*

---

## Notes

Defines the report contract and supervisor coupling for future helpdesk investigations.

Preflight synthesis:
- Supervisor summaries today use concise incident/recommendation bullets and action logs with explicit `action`, `classification`, `context`, `command`, and `detail` fields.
- Future automation needs stable machine fields for classification, decision, ownership, approval requirement, recurrence/systemic follow-up hints, and packet/task identifiers.
- Human-facing narrative remains appropriate for evidence explanation, why-alternatives-are-worse reasoning, and operator-ready wording.
| 2026-04-20 20:20 | Review R001 | plan Step 1: APPROVE |
