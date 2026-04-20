## Code Review: Step 2: Write path and safety semantics

### Verdict: REVISE

### Summary
The new create endpoint and shared preview-backed packet writer cover the main happy path well, and the added tests validate core creation, duplicate detection, and rollback on `CONTEXT.md` write failure. However, the current rollback logic can delete a legitimate task folder created by another concurrent request/process, which breaks the step's "safe write" and "prevent accidental overwrite" goals.

### Issues Found
1. **[dashboard/server.cjs:2353-2356] [important]** — The `TASK_WRITE_FAILED` catch block unconditionally calls `cleanupTaskAuthoringFolder(finalFolderPath)`. If another request creates the real target folder after the earlier `existsSync` check but before `fs.renameSync(tempFolderPath, finalFolderPath)`, this code will delete that other successfully-created task packet. This turns a race into data loss/overwrite instead of a recoverable conflict. Suggested fix: only remove `tempFolderPath` in this catch, and treat a rename collision as a conflict without touching `finalFolderPath` unless you can prove this request created it (for example by tracking whether `renameSync` succeeded, or by writing directly into a uniquely-owned temp path and never deleting the final path on pre-commit failures).

### Pattern Violations
- None beyond the rollback safety issue above.

### Test Gaps
- Missing a regression test for the rename-race case where `finalFolderPath` appears between the initial existence check and `renameSync`; the expected behavior should be "return conflict / leave the pre-existing folder intact," not deletion.

### Suggestions
- Consider returning a 409-style conflict for rename collisions that indicate the folder was claimed concurrently, to align operator feedback with the stale `Next Task ID` conflict handling already present later in the flow.
