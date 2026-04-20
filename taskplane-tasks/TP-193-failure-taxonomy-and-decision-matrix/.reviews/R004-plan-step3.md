## Plan Review: Step 3: One-time vs recurring fixes

### Verdict: APPROVE

### Summary
The Step 3 plan covers the required outcomes from `PROMPT.md`: distinguishing one-time repairs from systemic fixes, defining the recommendation/output shape for recurring fixes, and adding examples plus follow-up guidance for when a new task packet is the right response instead of recovering the current one. It also builds naturally on the already-drafted decision matrix, so the worker has enough direction to complete the step without over-specifying implementation details.

### Issues Found
1. **[Severity: minor]** — The STATUS item “Add examples and follow-up guidance” is broader than the prompt wording, so the worker should make sure those examples explicitly include cases where the correct answer is to open a new task packet rather than continue recovery on the current packet. Suggested fix: keep that example set visibly tied to the Step 3 requirement when drafting the matrix additions.

### Missing Items
- None.

### Suggestions
- Reuse the evidence-oriented framing already established in the taxonomy and decision matrix so “one-time” vs “recurring/systemic” is determined by observable scope, repetition, and ownership signals rather than intuition.
- In the recurring-fix recommendation shape, include the broken assumption, scope of impact, recommended owner, and whether the follow-up should be a repair packet, planning packet, or runtime-maintenance packet.
- Make at least one example about shared repo/config/runtime failures and one about stale-doc or planning-mismatch cases, since those are the most likely scenarios where a new packet is safer than recovering the current task.
