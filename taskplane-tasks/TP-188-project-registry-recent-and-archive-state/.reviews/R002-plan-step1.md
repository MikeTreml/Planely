## Plan Review: Step 1: Project registry model

### Verdict: APPROVE

### Summary
The Step 1 plan now covers the full set of required outcomes from the task prompt: record shape, canonical-vs-derived boundaries, active/archived/recent grouping, and duplicate-root / rename / missing-path handling. It also aligns with the preflight findings that current CLI/dashboard behavior is still root-based, so the registry model can be defined as a thin layer above existing project-root semantics rather than a competing source of truth.

### Issues Found
1. **[Severity: minor]** — No blocking plan gaps found. The important omission I flagged in R001 (duplicate roots / renamed projects / missing paths) is now explicitly included in `taskplane-tasks/TP-188-project-registry-recent-and-archive-state/STATUS.md:21-26` and matches the Step 1 outcome in `PROMPT.md`.

### Missing Items
- None.

### Suggestions
- In the Step 1 spec, make the identity rule explicit: a project’s root/config location should be the canonical anchor, while display name and “recent” grouping remain mutable/derived-friendly metadata.
- Call out that archived is a reversible visibility/lifecycle flag on the canonical record, not a deletion signal and not a separate storage bucket.
- For missing-path handling, define whether the record remains visible with a degraded/unavailable state so sidebar navigation stays inspectable instead of silently dropping entries.
