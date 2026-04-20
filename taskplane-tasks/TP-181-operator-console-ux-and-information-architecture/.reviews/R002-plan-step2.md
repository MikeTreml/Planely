## Plan Review: Step 2: View models

### Verdict: REVISE

### Summary
The Step 2 plan is close to the PROMPT’s intended scope: it covers the major operator-facing data models and remains consistent with Step 1’s lightweight, incremental IA. However, the current checklist does not explicitly plan for one of the required outcomes from `PROMPT.md`, so there is a real risk the resulting spec will miss a required section rather than merely phrasing it differently.

### Issues Found
1. **[Severity: important]** — `STATUS.md:31-33` plans backlog, task detail, and summary/action view models, but it does not explicitly include the required **empty/loading/error states** called out in `PROMPT.md:74-78`. Because this is a spec task, omitting that outcome from the plan can easily lead to a view-model document that defines happy-path shapes only. Add an explicit Step 2 plan item to define state variants/fallbacks for backlog, task detail, approvals/actions, and batch summary surfaces.

### Missing Items
- Explicit coverage for empty/loading/error state requirements in `view-models.md`, including how missing or partial Taskplane data should be represented without inventing backend APIs.

### Suggestions
- Reuse the scope matrix already established in `ux-ia.md` so each view model states whether its fields are workspace-, batch-, task-, or approval-subject-scoped.
- In the batch summary / next-action model, distinguish between informational status and operator action recommendations so follow-on implementation can render “what happened” separately from “what should I do next?”.
- For action affordances, note the minimum evidence each action needs nearby in the model (for example, why a task is blocked, what failed, or what will be skipped/integrated) so Step 3 can define guardrails on top of concrete data requirements.
