## Code Review: Step 1: Creation data model and preview contract

### Verdict: REVISE

### Summary
The server-authored metadata/preview contract and the added endpoint coverage are a good foundation, and the earlier R003 issue about missing testing/documentation sections was partially addressed. However, the generated PROMPT/STATUS preview still diverges in several important ways from the canonical task packet template, so Step 1 has not yet fully met its stated requirement to preserve current Taskplane packet conventions.

### Issues Found
1. **[dashboard/server.cjs:2070-2118, 2141-2168]** [important] — The generated packet still omits multiple canonical template requirements from `skills/create-taskplane-task/references/prompt-template.md:71-168,199-250`. In PROMPT.md, Step 1 lacks the required targeted-test checkbox and `Artifacts:` block (`prompt-template.md:81-90`), the Testing & Verification step omits the integration-test gate and concrete full-suite/build command placeholders (`prompt-template.md:122-130`), and the Git Commit Convention / Do NOT sections are still missing canonical items like the `test(...)` commit form and the standard guardrails (`prompt-template.md:152-168`). In STATUS.md, the hydration guidance block and the canonical testing checkbox wording are also missing (`prompt-template.md:199-201,235-250`). Since this feature is supposed to generate canonical task packets rather than a dashboard-specific variant, the preview builder should be brought into closer parity with the template before Step 1 is approved.
2. **[extensions/tests/dashboard-task-authoring-contract.test.ts:141-161]** [important] — The contract test only asserts the subset of canonical sections added in response to R003, so it still permits the remaining template drift above. Extend the preview contract test to verify the missing invariants too: targeted-test/artifact content in Step 1, integration-test/build/full-suite wording, canonical commit convention entries, standard Do NOT bullets, and the STATUS hydration/testing wording.

### Pattern Violations
- The dashboard preview still hardcodes a partial packet format instead of matching the canonical packet template closely enough to serve as the same contract.

### Test Gaps
- No regression assertion checks that generated PROMPT.md includes Step 1 targeted-test and `Artifacts:` sections.
- No regression assertion checks the canonical `test([TASK-ID])` commit convention entry or the standard Do NOT bullets.
- No regression assertion checks the STATUS hydration note and canonical testing checkbox wording.

### Suggestions
- Consider extracting shared packet-section builders or deriving more of the preview from `skills/create-taskplane-task/references/prompt-template.md` semantics so future template changes do not require hand-syncing another copy in `dashboard/server.cjs`.
