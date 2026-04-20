## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
This revision closes the earlier JSON/YAML precedence and pointer-metadata issues I flagged in R005–R010, and the new backlog loader/tests are directionally correct. However, there is still one blocking workspace-mode bug: when the dashboard follows a pointer to a config repo, it still resolves task-area paths relative to the workspace root instead of the pointer-resolved config repo, so backlog discovery fails in the standard polyrepo layout.

### Issues Found
1. **[dashboard/server.cjs:1690-1703] [important]** `loadBacklogData()` loads task areas from the pointer-resolved config root, but then resolves every `area.path` with `path.resolve(REPO_ROOT, area.path)`. In workspace mode, `REPO_ROOT` is the workspace root, while `taskplane init` places the shared config under `<config-repo>/.taskplane/` and task areas under the config repo (for example `repo-a/taskplane-tasks/CONTEXT.md`; see `docs/tutorials/install.md:107-119`). That means a normal workspace config like `taskAreas.general.path = "taskplane-tasks"` is scanned as `<workspace-root>/taskplane-tasks` instead of `<config-repo>/taskplane-tasks`, producing an empty/error backlog even though valid packets exist. I reproduced this directly against the current helper block: a pointed config repo containing `repo-a/taskplane-tasks/TP-999...` returns `items: []` with `Task area not found: taskplane-tasks`. Fix by resolving backlog scan roots from the same pointer-resolved config/project root that supplied the config (for example, return both config data and its root from the loader, or add a helper that resolves task-area paths against the config repo root rather than `REPO_ROOT`).

### Pattern Violations
- The dashboard still partially diverges from the shared config/discovery semantics: it follows the pointer for reading config, but not for resolving the task-area paths described by that config.

### Test Gaps
- Missing regression coverage for the canonical polyrepo layout where `.pi/taskplane-pointer.json` points at `<config-repo>/.taskplane/taskplane-config.json` and the actual task packets live under `<config-repo>/taskplane-tasks/`. The current pointer test only passes because it writes the task packet at the workspace root.

### Suggestions
- If possible, reuse or mirror the same root-resolution contract used by the main config/discovery pipeline so the dashboard does not need to keep re-deriving pointer/config/task-area semantics on its own.
