# TP-184: Task Creation Form and Packet Preview — Status

**Current Step:** Step 3: UI implementation
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 2
**Review Counter:** 7
**Iteration:** 1
**Size:** L

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read packet creation skill and examples
- [x] Define minimum task-authoring fields
- [x] Decide preview/write architecture

---

### Step 1: Creation data model and preview contract
**Status:** ✅ Complete
- [x] Define form and preview shapes
- [x] Define validation rules
- [x] Define complexity assessment contract
- [x] Preserve packet compatibility
- [x] Align generated PROMPT/STATUS preview with canonical template sections
- [x] Update preview contract tests to enforce canonical packet invariants
- [x] Add remaining canonical template invariants (targeted tests, artifacts, commit conventions, guardrails, STATUS hydration note)

---

### Step 2: Write path and safety semantics
**Status:** ✅ Complete
- [x] Implement safe packet write flow
- [x] Update Next Task ID safely
- [x] Block duplicates/overwrites
- [x] Make failure states explicit and recoverable

---

### Step 3: UI implementation
**Status:** 🟨 In Progress
- [ ] Add create-task form UI
- [ ] Add preview UI
- [ ] Add success/failure navigation and feedback

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Test validation and duplicate cases
- [ ] Verify generated packets are orch-launchable
- [ ] Update docs if shipped
- [ ] Log discoveries

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
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 20:18 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 20:18 | Step 0 started | Preflight |
| 2026-04-20 20:24 | Step 0 completed | Packet inputs, preview/write approach, and safety rules scoped |
| 2026-04-20 20:24 | Step 1 started | Creation data model and preview contract |
| 2026-04-20 20:25 | Review R001 | plan Step 1 returned REVISE; complexity rubric contract missing |
| 2026-04-20 20:39 | Step 1 progress | Added server-authored task authoring metadata/preview contract plus targeted tests |
| 2026-04-20 20:39 | Step 1 completed | Preview generator now emits canonical packet markdown and validation metadata |
| 2026-04-20 20:39 | Step 2 started | Write path and safety semantics |
| 2026-04-20 20:41 | Review R003 | code Step 1 returned REVISE; preview/template parity incomplete |
| 2026-04-20 20:46 | Step 1 revise | Added canonical Testing & Verification plus Documentation & Delivery preview sections |
| 2026-04-20 20:46 | Step 1 review fixes complete | Preview contract tests now enforce canonical packet invariants |
| 2026-04-20 20:48 | Review R004 | code Step 1 returned REVISE; additional template invariants still missing |
| 2026-04-20 20:52 | Step 1 revise | Added targeted-test/artifact blocks, canonical commit guardrails, and STATUS hydration/testing wording |
| 2026-04-20 20:54 | Review R006 | plan Step 2 returned REVISE; failure handling outcome added to plan |
| 2026-04-20 21:04 | Step 2 progress | Added create endpoint, counter update safeguards, duplicate blocking, and rollback/error handling tests |

---

## Blockers

*None*

---

## Notes

Brings structured task authoring into the Operator Console.

Preflight findings:
- Minimum authoring inputs should cover area, title, mission, size, explicit complexity rubric inputs (blast radius, pattern novelty, security, reversibility), optional override review level notes if needed, optional dependencies, optional context refs, and optional file scope; server can derive task ID, folder slug, timestamps, assessment prose, score breakdown, canonical paths, and initial STATUS scaffolding.
- Preview/write should be server-authored from a shared generator so the dashboard does not fork packet formatting; client submits form data, server returns rendered PROMPT.md/STATUS.md preview plus derived task metadata, then a confirmed write uses the same generation path.
- Safety rules should include reading area config from `.pi/taskplane-config.json`, reserving the current `Next Task ID` from `CONTEXT.md`, rejecting duplicate task IDs/folder names, creating the new folder only when absent, writing canonical files explicitly, and updating `Next Task ID` only after successful packet creation.
- Reviewer suggestions to keep in mind: preview payload should return both rendered markdown and structured derived metadata; validation should separate operator-fixable field errors from server-side generation failures.
- Step 1 implementation now exposes `/api/task-authoring` metadata and `/api/task-authoring/preview` so the UI can load area defaults and request server-authored PROMPT.md/STATUS.md previews from one shared generator.
- Code review follow-up: the preview generator must emit canonical `Testing & Verification` plus `Documentation & Delivery` sections and tests must enforce those template invariants.
- Additional review follow-up: preview output still needs Step 1 targeted-test/artifact content, fuller testing/build wording, canonical `test(...)` commit entry, standard Do NOT bullets, and STATUS hydration/testing language.
- Step 2 review follow-up: write flow must surface duplicate/conflict/partial-write failures explicitly and keep preview/write output byte-aligned from the shared generator.
- Step 2 implementation now exposes `/api/task-authoring/create`, writes packet files from the shared preview generator, stages files in a temp folder before final placement, and seeds an empty `.reviews/` directory in the created packet.
| 2026-04-20 20:39 | Review R007 | plan Step 2: APPROVE |
