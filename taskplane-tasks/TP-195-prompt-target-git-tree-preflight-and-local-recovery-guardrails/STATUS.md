# TP-195: Prompt-Target Git-Tree Preflight and Local Recovery Guardrails — Status

**Current Step:** Not Started
**Status:** 🔵 Ready for Execution
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 0
**Iteration:** 0
**Size:** L

---

### Step 0: Preflight
**Status:** ⬜ Not Started
- [ ] Inspect current prompt-target and discovery behavior
- [ ] Decide placement and confidence model for the guardrail
- [ ] Identify existing test coverage and gaps

---

### Step 1: Design the guardrail
**Status:** ⬜ Not Started
- [ ] Define checked references and mismatch behavior
- [ ] Define local-only detection behavior
- [ ] Define explicit non-goals and operator messaging

---

### Step 2: Implement bounded detection
**Status:** ⬜ Not Started
- [ ] Add committed-vs-local comparison
- [ ] Emit actionable diagnostics
- [ ] Preserve normal discovery behavior when healthy

---

### Step 3: Tests and operator guidance
**Status:** ⬜ Not Started
- [ ] Add mismatch tests
- [ ] Add false-positive avoidance tests
- [ ] Update docs if needed

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify the real incident pattern is covered
- [ ] Verify no silent state mutation is introduced
- [ ] Log follow-up work

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

---

## Blockers

*None*

---

## Notes

Guardrail task aimed at catching local-only restored files before orchestration fails.
