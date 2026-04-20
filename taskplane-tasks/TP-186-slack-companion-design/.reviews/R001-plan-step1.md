## Plan Review: Step 1: Slack companion scope

### Verdict: APPROVE

### Summary
The Step 1 plan is appropriately scoped for a design-only task: it covers the required outcomes for the companion-spec doc while staying aligned with TP-180’s “web primary, Slack secondary” posture and TP-185’s canonical-state boundary. The preflight notes already capture the main risk decisions needed to make the scope implementable, especially around deferred high-risk actions and dashboard deep-linking.

### Issues Found
1. **[Severity: minor]** — `STATUS.md:23-25` is intentionally concise, but when drafting the scope doc, make sure the v1 action list uses Taskplane’s real operator vocabulary rather than Slack-native shorthand. In particular, “cancel” should be framed against actual orchestrator concepts such as bounded stop/abort requests so Step 4 can map it cleanly back to existing commands.

### Missing Items
- None.

### Suggestions
- In `slack-companion.md`, explicitly separate **what Slack may initiate** from **what remains dashboard-only/deferred**; the preflight note at `STATUS.md:95` already gives a strong starting boundary.
- When defining notification categories, note whether each is primarily **batch-level**, **task-level**, or **approval-level** so the later message-contract step has a clean subject model.
- Reuse the deep-link targets captured in `STATUS.md:96` as named scope anchors for the doc; that will make the Step 2 contract work more concrete without overcommitting to URL shape yet.
