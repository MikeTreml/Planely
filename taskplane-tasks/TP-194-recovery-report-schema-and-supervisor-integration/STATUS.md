# TP-194: Recovery Report Schema and Supervisor Integration — Status

**Current Step:** Step 0: Preflight
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 0
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** 🟨 In Progress
- [x] Review TP-192 and TP-193 outputs
- [x] Review current supervisor summaries and actions
- [x] Identify what must be structured vs narrative

---

### Step 1: Recovery report schema
**Status:** ⬜ Not Started
- [ ] Define markdown and JSON report contracts
- [ ] Define required and optional fields
- [ ] Verify schema supports both humans and automation

---

### Step 2: Supervisor integration model
**Status:** ⬜ Not Started
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
