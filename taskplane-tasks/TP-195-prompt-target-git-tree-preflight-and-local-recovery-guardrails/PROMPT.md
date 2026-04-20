# Task: TP-195 - Prompt-Target Git-Tree Preflight and Local Recovery Guardrails

**Created:** 2026-04-20
**Size:** L

## Review Level: 2 (Plan + Code)

**Assessment:** Guardrail task that could prevent an entire class of failed execution by checking prompt-scoped file targets against committed git state and local working-tree drift. It touches discovery/preflight behavior and operator guidance.
**Score:** 5/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-195-prompt-target-git-tree-preflight-and-local-recovery-guardrails/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Design and, if feasible within current architecture, implement a preflight guardrail that detects when task prompts reference files absent from the committed git tree but present locally in the operator’s working directory.

This task exists to prevent a repeat of the failure pattern where:
- operators restore or create needed files locally,
- worker lanes cannot see them because they are not committed,
- and orchestration fails or merge verification breaks unexpectedly.

The solution must be conservative and operator-visible. It should guide recovery; it must not silently commit or push files.

## Dependencies

- **TP-193** — Failure taxonomy and decision matrix
- **TP-194** — Recovery report schema and supervisor integration

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `taskplane-tasks/TP-182-dashboard-backlog-view/PROMPT.md`
- `docs/specifications/operator-console/recovery-failure-taxonomy.md`
- `docs/specifications/operator-console/recovery-supervisor-integration.md`
- `extensions/taskplane/discovery.ts`
- `extensions/taskplane/config-loader.ts`
- `extensions/taskplane/git.ts`
- `extensions/tests/*` around discovery / preflight behavior

## Environment

- **Workspace:** `extensions/taskplane/`, `extensions/tests/`, possibly docs/reference if user-visible behavior changes
- **Services required:** None

## File Scope

- `extensions/taskplane/discovery.ts`
- `extensions/taskplane/git.ts` (if helper logic belongs there)
- `extensions/taskplane/types.ts` (if new diagnostic/result types are needed)
- `extensions/tests/*` (new/updated tests)
- `docs/reference/commands.md` or troubleshooting docs if behavior becomes operator-visible enough to document

## Steps

### Step 0: Preflight

- [ ] Inspect how prompt paths / file scope are represented today
- [ ] Determine whether prompt-target extraction is already available or needs a bounded heuristic
- [ ] Decide where this guardrail belongs: discovery, plan, or batch-start preflight

### Step 1: Design the guardrail

- [ ] Define which file references are checked and with what confidence
- [ ] Define how committed-tree absence is detected
- [ ] Define how local-only presence is detected
- [ ] Define operator-facing warning / failure behavior
- [ ] Define explicit non-goals: no silent commit, no silent push, no blind auto-recovery

### Step 2: Implement bounded detection

- [ ] Add committed-tree vs local-working-tree comparison for prompt-target files
- [ ] Emit a clear diagnostic classification when files are local-only
- [ ] Ensure normal tasks are not overblocked by low-confidence heuristics
- [ ] Preserve existing discovery behavior when no mismatch exists

### Step 3: Tests and operator guidance

- [ ] Add tests for committed-present, missing-everywhere, and local-only-present cases
- [ ] Add tests for false-positive avoidance
- [ ] Update docs if the operator sees a new warning/recovery path

### Step 4: Verification & Delivery

- [ ] Verify the new guardrail catches the local-only restored-files case
- [ ] Verify it does not silently mutate project state
- [ ] Log follow-up work such as staged-recovery proposal flows if still needed

## Documentation Requirements

**Must Update:**
- relevant test coverage under `extensions/tests/*`

**Check If Affected:**
- `docs/reference/commands.md`
- `docs/how-to/troubleshoot-common-issues.md`

## Completion Criteria

- [ ] Prompt-target git-tree mismatch is detected before wasting worker effort
- [ ] Local-only restored file situations produce actionable operator guidance
- [ ] No silent commit/push behavior is introduced
- [ ] Tests cover the main mismatch cases

## Git Commit Convention

- **Step completion:** `feat(TP-195): complete Step N — description`
- **Bug fixes:** `fix(TP-195): description`
- **Hydration:** `hydrate: TP-195 expand Step N checkboxes`

## Do NOT

- Auto-commit or auto-push files in this task
- Treat arbitrary prompt prose as authoritative file references without bounds
- Block every task due to vague or non-file-oriented text
- Hide recovery details from the operator

---

## Amendments (Added During Execution)
