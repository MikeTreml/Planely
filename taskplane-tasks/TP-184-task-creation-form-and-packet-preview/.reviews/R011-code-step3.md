## Code Review: Step 3: UI implementation

### Verdict: REVISE

### Summary
The new dashboard authoring surface is generally wired to the Step 1/2 server contract and covers the requested form, preview, and create flow. However, two UI-state bugs break core authoring behavior: the Reset button clears the loaded metadata and leaves the form unusable, and a successful create leaves the old preview in a “writeable” state even though the server-derived task ID has advanced.

### Issues Found
1. **[dashboard/public/app.js:910-916] [important]** — The Reset handler calls `resetTaskAuthoringState()` and then immediately checks `taskAuthoringState.metadata`, but `resetTaskAuthoringState()` nulls that field on line 589. In practice, clicking **Reset** leaves the area select at `Loading…`, drops the cached area/default metadata, and does not restore project defaults until a later full render happens to refetch metadata. Preserve the existing metadata before resetting, or split “clear form values” from “clear loaded metadata” so Reset restores the current project defaults instead of breaking the form.
2. **[dashboard/public/app.js:634-657, 775-780] [important]** — After a successful create, the UI keeps `dirty = false`, preserves the old preview fingerprint, and only refreshes metadata. Because `createReady` is gated only on form fingerprint equality, the **Write task packet** button becomes enabled again even though the preview still represents the previous `Next Task ID`. A second click can therefore create another task without previewing the newly derived packet, which violates the task’s “preview before write” requirement and makes the on-screen preview stale/misleading. After a successful create, invalidate the preview (or mark the form dirty / require a fresh preview) once metadata advances the next task ID.

### Pattern Violations
- None beyond the blocking UI-state issues above.

### Test Gaps
- No UI test covers the Reset interaction restoring metadata-backed defaults after a preview/edit cycle.
- No UI test covers post-create state to ensure the preview is invalidated (or the create button stays disabled) until the operator generates a fresh preview for the next task ID.

### Suggestions
- Consider surfacing the derived next-task change more explicitly after a successful create (for example, clear the preview panes and show a “Preview the next packet before writing again” message).
