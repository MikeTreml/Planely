## Plan Review: Step 2: Freshness model

### Verdict: REVISE

### Summary
The Step 2 plan is close to the prompt’s intent, but it currently drops two required outcomes from the task definition: explaining why date-only freshness is insufficient, and defining review windows by both document type and authority level. Because this task is design-only, the plan does not need more implementation detail than that, but it does need to explicitly cover those missing outcomes so the resulting spec is complete.

### Issues Found
1. **[Severity: important]** — The Step 2 checklist in `STATUS.md` omits the prompt requirement to explain **why date-only freshness is not enough**. That is a named outcome in `PROMPT.md`, not an optional rationale section, so the plan should explicitly include it.
2. **[Severity: important]** — The plan says “Define review windows by doc type,” but `PROMPT.md` requires review windows by **doc type / authority level**. Without the authority-level dimension, the freshness model could miss an important part of the governance policy’s trust model.

### Missing Items
- Add an explicit outcome for documenting why date-only freshness fails and why task distance must be combined with other signals.
- Add an explicit outcome for review windows that vary by authority level as well as document type.

### Suggestions
- When defining derived states, make the thresholds/triggers between `active`, `review-due`, and `stale-suspect` concrete enough that future tooling could compute them consistently.
- Reuse the governance policy’s distinction between substantive review and superficial edits so “freshness” is not accidentally reset by typo-only changes.
