## Code Review: Step 1: Creation data model and preview contract

### Verdict: REVISE

### Summary
The new server-authored metadata and preview endpoints are a solid direction, and the targeted contract test passes. However, the generated PROMPT/STATUS preview is not actually compatible with the repository's canonical task packet template, so Step 1 does not yet satisfy the requirement to preserve current packet conventions.

### Issues Found
1. **[dashboard/server.cjs:2070-2106, 2131-2149]** [important] — The preview generator hardcodes a simplified three-step packet (`Preflight`, `Implement ...`, `Verification & Delivery`) and omits canonical sections required by the task template, including a distinct `Testing & Verification` step with full-suite/build gates and a separate `Documentation & Delivery` step with `"Check If Affected"` review. The project’s canonical template in `skills/create-taskplane-task/references/prompt-template.md:122-143,235-249` explicitly includes those sections, and the task prompt says this feature must respect existing packet conventions rather than invent a second format. Rework the preview contract so generated markdown follows the canonical structure closely enough that a dashboard-authored packet matches what the skill/template would produce.
2. **[extensions/tests/dashboard-task-authoring-contract.test.ts:79-153]** [important] — The new contract test asserts the current simplified preview as “canonical,” which will lock in the incompatible packet shape instead of catching drift from the template. Update the test to validate against the real canonical requirements (for example: presence of testing/documentation steps, expected documentation requirement sections, and other template invariants) so future changes preserve template parity.

### Pattern Violations
- The implementation introduces a dashboard-specific task packet shape instead of reusing the canonical task packet conventions defined under `skills/create-taskplane-task/references/`.

### Test Gaps
- No regression test verifies that generated PROMPT/STATUS include the canonical `Testing & Verification` and `Documentation & Delivery` sections required by the template.
- No test checks that documentation requirement blocks remain aligned with the canonical template structure beyond the current hardcoded `None` placeholders.

### Suggestions
- Consider deriving more of the preview structure from the existing template/reference rules instead of duplicating packet format inline in `server.cjs`; that will reduce drift as task conventions evolve.
