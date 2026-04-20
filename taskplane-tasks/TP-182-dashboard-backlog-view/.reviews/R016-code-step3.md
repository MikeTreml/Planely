## Code Review: Step 3: Frontend implementation

### Verdict: APPROVE

### Summary
This iteration addresses the earlier broken backlog action cleanly: backlog selection now only exposes `View STATUS.md` when the selected task is part of the active batch, and otherwise degrades to a non-broken hint. The frontend changes also deliver the Step 3 outcomes well, with clearer backlog scope/filter affordances, richer empty/partial/error states, and preserved live-batch behavior when no batch is active.

### Issues Found
1. **None blocking** — I did not find a correctness issue in the current Step 3 frontend diff after re-checking the prior R015 concern.

### Pattern Violations
- None noted.

### Test Gaps
- `extensions/tests/dashboard-backlog-ui.test.ts:13-37` is still a structural/string-presence test rather than a behavioral UI test, so it would not catch regressions in selection fallback, clear-filter behavior, or the guarded STATUS action. This is not blocking for Step 3, but Step 4 would be a good time to add at least one behavior-oriented regression around those flows.

### Suggestions
- `dashboard/public/app.js:1507-1516` currently includes the global repo filter in the active-filter summary, while the `Clear` button at `app.js:501-506` only resets search and status. Consider either excluding repo scope from that button's messaging or expanding the affordance so operators are not surprised that repo scoping remains active after clicking Clear.
