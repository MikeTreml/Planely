## Plan Review: Step 2: Storage proposal

### Verdict: REVISE

### Summary
The Step 2 plan is pointed in the right direction: it covers storage location, coexistence with config/workspace mode, and safe local-first updates. However, it still leaves one key storage-boundary decision underspecified and does not explicitly require failure/recovery semantics for the registry file, both of which are important to keep the design aligned with Taskplane's multi-project navigation goal and recoverability principles.

### Issues Found
1. **[Severity: important]** — `taskplane-tasks/TP-188-project-registry-recent-and-archive-state/STATUS.md:30-34` says only “Define registry file location,” but `PROMPT.md:78-82` asks for the proposed registry file location(s) and how that choice fits Taskplane architecture. For this task, the plan should explicitly decide whether the **canonical registry is machine-local** (spanning many known projects) versus project-local/workspace-local, and it should call out any optional derived caches separately. Without that outcome-level decision, the writeup could accidentally place the canonical registry under a current project's `.pi/` or other per-project storage, which would conflict with Step 1's model of a registry that remembers multiple roots across sessions (`docs/specifications/operator-console/project-registry.md:9-24`) and with existing user-scoped storage patterns such as global preferences (`extensions/taskplane/config-loader.ts:618-646`). Add an explicit plan item covering canonical-vs-derived storage boundaries and local scope.
2. **[Severity: important]** — `STATUS.md:32-34` includes “Define safe local-first update semantics,” but it does not explicitly mention what happens when the registry file is missing, partially written, or malformed. For a file-backed registry, safe updates are not just “write atomically”; the storage proposal should also specify read-side recovery/repair behavior so the dashboard/sidebar does not become brittle after interruption or corruption. Add an outcome-level item covering atomic write strategy plus failure-handling semantics (for example: temp+rename, optional backup/repair, and how malformed data is surfaced without silently deleting records).

### Missing Items
- Explicit Step 2 coverage for the **canonical storage scope** of the project registry (machine-local vs project/workspace-local) and any separate derived cache/materialization locations.
- Explicit Step 2 coverage for **corrupt/missing/partial registry file handling** as part of “safe local-first update semantics.”

### Suggestions
- Reuse the boundary language already present in `planning-storage-layout.md:222-234`: one canonical store, optional reproducible caches, and no shadow state.
- In the storage writeup, tie the chosen location back to current root/pointer behavior so it is clear how the registry layers above project-local config and workspace routing instead of competing with them.
