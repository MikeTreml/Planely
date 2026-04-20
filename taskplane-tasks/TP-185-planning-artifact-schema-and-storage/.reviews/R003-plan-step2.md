## Plan Review: Step 2: Storage layout proposal

### Verdict: REVISE

### Summary
The Step 2 plan covers the basic storage outcomes, but it is still missing two requirement-level outcomes from `PROMPT.md`: a concrete discovery/rendering model and an explicit workspace-mode placement/resolution strategy. Those are the main places this step can go wrong, because TP-180 intentionally deferred exact planning-file storage and indexing decisions, and the current Taskplane docs distinguish sharply between repo-local state and workspace config-repo state.

### Issues Found
1. **[Severity: important]** — The plan does not explicitly include how canonical planning files will be discovered and rendered. `PROMPT.md:74-78` makes that a core Step 2 deliverable, but `STATUS.md:31-35` only tracks on-disk layout, naming/ID conventions, and coexistence with task/runtime state. Add an explicit outcome covering root discovery, file enumeration/indexing expectations, and what renderable/cached views are allowed versus derived at read time so the storage proposal cannot skip the operator-console lookup path.
2. **[Severity: important]** — The plan does not explicitly require a workspace-mode storage/resolution rule. That is risky because existing project docs already distinguish between repo-local `.pi/` state and workspace config-repo `.taskplane/` state (`docs/specifications/settings-and-onboarding-spec.md:222-247`), and Step 1’s schema relies on packet paths remaining valid in mono-repo and workspace mode (`docs/specifications/operator-console/planning-artifacts.md:329-332`). Add an outcome that the proposal defines where planning artifacts live in repo mode vs workspace mode, how the canonical project root is resolved, and how this avoids turning workspace-root `.pi/` pointer/cache files into a second source of truth.

### Missing Items
- Explicit discovery/indexing/rendering rules for canonical planning files.
- Explicit repo-mode vs workspace-mode placement and root-resolution rules for planning artifacts.

### Suggestions
- Reuse the Step 1 source-of-truth language when describing any optional indexes or summaries: if a registry/cache is proposed, state clearly that it is derived and reproducible from canonical planning files.
- When drafting the storage doc, include a short matrix for repo mode, monorepo, and workspace mode so later implementation tasks do not have to infer path behavior from prose.
