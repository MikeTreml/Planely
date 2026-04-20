## Plan Review: Step 1: Sidebar UX contract

### Verdict: APPROVE

### Summary
The Step 1 plan now covers the required sidebar outcomes and addresses the main gap from the prior review by explicitly adding project-switch state reset and fallback behavior. The contract is also aligned with the operator-console IA and project-registry specs: it keeps sectioning lightweight, grounds row content in canonical registry data, and preserves archived-project accessibility without inventing a heavier project model.

### Issues Found
1. **[Severity: minor]** — `taskplane-tasks/TP-187-project-sidebar-and-navigation/STATUS.md:91-93` captures the reviewer guidance about sidebar ordering and Recent deferment in Notes rather than as an explicit Step 1 checkbox outcome. This is not blocking because the contract itself is already defined in the referenced IA/spec language, but carrying those rules forward clearly in implementation notes will help avoid ad hoc ordering decisions in Step 2/3.

### Missing Items
- None.

### Suggestions
- When implementing, follow the ordering rules already reflected in `docs/specifications/operator-console/project-registry.md` and `docs/specifications/operator-console/ux-ia.md`: current/open project first where applicable, active projects as the default visible list, Recent derived from timestamps when available, and Archived collapsed or visually lower-priority by default.
- If Step 3 has to ship before full registry timestamps exist, document the explicit fallback of rendering only Active and Archived from canonical project records instead of fabricating a separate Recent source.
