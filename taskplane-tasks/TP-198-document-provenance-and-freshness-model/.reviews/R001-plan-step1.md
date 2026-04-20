## Plan Review: Step 1: Provenance model

### Verdict: APPROVE

### Summary
The Step 1 plan is appropriately scoped to the prompt’s required outcomes: it covers defining the provenance fields, clarifying required versus optional metadata, and addressing special-case documents like `README.md` that should not depend on filename churn. Given that Step 0 already evaluated encoding options and special cases, this is enough plan detail for a documentation-design step without over-prescribing the eventual spec structure.

### Issues Found
1. **[Severity: minor]** — The Step 1 checklist does not explicitly say the provenance doc should connect its field set back to the governance policy’s lifecycle/authority concepts. This is not blocking because the prompt and Step 0 context already strongly imply that relationship, but the final doc should keep those concepts aligned.

### Missing Items
- None that block Step 1’s stated outcomes.

### Suggestions
- Include at least one concrete example metadata envelope for a normal spec doc and one for a path-stable doc like `README.md`, so future tooling work has an implementation-ready reference.
- Make the required/optional distinction explicit by doc class or encoding mode where useful (for example, fields expected on all governed docs versus fields only needed when supersession exists).
- Clarify whether `createdByTask` and `lastReviewedTask` are single IDs or allow multiple related task IDs, even if the default recommendation is singular for simplicity.
