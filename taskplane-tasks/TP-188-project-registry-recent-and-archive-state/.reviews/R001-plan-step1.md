## Plan Review: Step 1: Project registry model

### Verdict: REVISE

### Summary
The Step 1 plan is mostly aligned with the task’s intended outcome: it covers the core record shape, canonical-vs-derived boundaries, and active/archived/recent grouping semantics. However, it omits one required outcome from the PROMPT for handling duplicate roots, renamed projects, and missing paths, which is important to avoid ambiguous or conflicting project entries in the future registry/sidebar model.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-188-project-registry-recent-and-archive-state/STATUS.md:21-26` does not include the Step 1 requirement from `taskplane-tasks/TP-188-project-registry-recent-and-archive-state/PROMPT.md:68-75` to define rules for **duplicate roots / renamed projects / missing paths**. Those edge cases are part of the stated Step 1 outcome, and leaving them out risks a registry model that cannot reliably answer whether two entries refer to the same local project or how stale/broken entries should appear in the sidebar. Add an outcome-level item covering identity/conflict and missing-path handling.

### Missing Items
- Explicit Step 1 coverage for duplicate-root detection, renamed-project behavior, and missing/unavailable path semantics.

### Suggestions
- In the Step 1 writeup, tie project identity rules back to the preflight finding that current CLI/dashboard flows assume a single root, so the registry model clearly layers above existing root-based behavior rather than redefining it.
- When defining “recent,” make explicit that it is derived from timestamps on the canonical project record rather than a separate competing recent-project store.
