## Plan Review: Step 2: Define governance rules

### Verdict: REVISE

### Summary
The Step 2 plan is close to the prompt and is scoped around the right outcomes: authority classes, supersession recording, and guidance for handling stale material in future planning. However, it omits one explicit required outcome from PROMPT.md: the policy must also explain why filename encoding is insufficient as the primary governance mechanism.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-197-documentation-governance-policy/STATUS.md:27-30` does not include the PROMPT.md requirement to define **why filename encoding is insufficient as the primary mechanism**. Step 0 notes mention evaluating filename ideas, but the Step 2 plan itself should still carry this outcome so it is not accidentally skipped in the final policy. Add an explicit Step 2 item covering the rationale for metadata/provenance over filename-based freshness.

### Missing Items
- Add a Step 2 outcome for explaining why filename-based freshness/authority signals are inadequate as the primary governance system, and that filenames/folders are at most secondary aids.

### Suggestions
- When defining authoritative vs contextual vs historical materials, make the interaction with lifecycle states explicit so future readers understand that authority and freshness are separate dimensions.
- In the supersession section, prefer requiring explicit replacement links in both directions where practical (`supersededBy` and `supersedes`) since that will support later indexing/tooling work.
- For stale-doc citation guidance, include the planner/reviewer expectation that citing stale or historical material should trigger an explicit caveat or follow-up review task rather than being treated as silent authority.
