## Code Review: Step 2: Server implementation

### Verdict: REVISE

### Summary
The Step 2 server work is close and it does address the earlier R005–R009 findings: backlog loading is wired into `buildDashboardState()`, pointer-aware config lookup was added, and the new tests cover the main happy/compatibility paths. However, there is still one config-precedence gap in the dashboard-specific workspace repo loader: it can fall back to stale `taskplane-workspace.yaml` data even when `taskplane-config.json` is present, which breaks the project’s JSON-first config contract and can produce the wrong workspace scope or pointer resolution.

### Issues Found
1. **[dashboard/server.cjs:1404-1423] [important]** `loadDashboardWorkspaceRepos()` reads `workspace.repos` from `taskplane-config.json`, but if that object is missing/empty it falls through to legacy `taskplane-workspace.yaml`. That does **not** match the canonical loader behavior: when `taskplane-config.json` exists, it is authoritative and legacy workspace YAML should not override it. In the current implementation, a migrated workspace with an intentionally empty/partial JSON workspace section plus stale `taskplane-workspace.yaml` can make the dashboard infer the wrong repo set, misreport `backlog.scope.mode`, or resolve `.pi/taskplane-pointer.json` against the wrong repo map. Fix by treating the presence of `taskplane-config.json` at `REPO_ROOT` as authoritative for workspace metadata too: return the JSON-derived repo map (or `{}`) and only consult `taskplane-workspace.yaml` when the JSON config file is absent.

### Pattern Violations
- The dashboard still partially reimplements config precedence instead of matching the shared loader semantics. `workspace` metadata currently has different JSON-vs-YAML precedence than `loadProjectOverrides()` in `extensions/taskplane/config-loader.ts`.

### Test Gaps
- Missing regression coverage for workspace repo discovery precedence when both `taskplane-config.json` and `taskplane-workspace.yaml` exist. Add a test proving that a present JSON config suppresses legacy workspace YAML for repo-map/pointer resolution, even if the YAML file defines repos.

### Suggestions
- Since I flagged earlier Step 2 reviews around config drift (R005–R009), this is the same class of problem in the remaining workspace-metadata path; if feasible, centralize dashboard config/workspace lookup on shared helpers rather than continuing to mirror precedence rules in `server.cjs`.
