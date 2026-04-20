# Recovery Failure Taxonomy

## Status

Draft for TP-193.

## Purpose

Define a failure classification system for Taskplane recovery decisions. The taxonomy should help a future Recovery / Helpdesk Agent, the supervisor, and human operators distinguish failures that need local implementation repair from failures that require repo repair, packet revision, batch control changes, or follow-up planning work.

## Classification Principles

- Classify by the most likely **current blocker**, not by the loudest symptom.
- Prefer categories with **observable evidence** in task packets, review artifacts, supervisor summaries, diagnostics, and batch state.
- Treat uncertainty explicitly: if two classes remain plausible, report the ambiguity rather than collapsing them into a generic task failure bucket.
- Do not default to retry when the evidence points to stale assumptions, invalid packet grounding, or broken execution context.

## Core Failure Categories

### 1. Implementation failure
A worker changed the wrong files, applied an incomplete fix, or failed to satisfy the packet requirements even though the packet, repo state, and runtime context were materially valid.

**Typical symptoms**
- targeted tests fail in the changed area after a plausible edit,
- required files or sections were left untouched,
- reviewer feedback points to a concrete logic or contract mistake,
- the worker completed a checkbox but the deliverable is still absent or incorrect.

**Required evidence**
- diff or file inspection showing the wrong or incomplete change,
- failing targeted test output or review findings tied to the changed code,
- confirmation that referenced files, packet grounding, and repo state are otherwise intact.

### 2. Flaky implementation
The task appears implemented or nearly implemented, but results are inconsistent across retries because the changed code or test interaction is nondeterministic.

**Typical symptoms**
- the same task alternates between pass and fail without materially different inputs,
- tests fail intermittently in the same area,
- race-sensitive or ordering-sensitive behavior appears in changed code,
- retry temporarily masks the problem without increasing confidence.

**Required evidence**
- repeated runs with inconsistent outcomes,
- logs showing timing, ordering, or state-sensitive instability,
- confirmation that the environment and packet grounding are unchanged between attempts.

### 3. Test failure
The change may compile or look plausible, but verification fails in a stable, reproducible way that indicates incorrect behavior, incorrect expectations, or missing follow-through on required validation.

**Typical symptoms**
- targeted or full-suite tests fail consistently,
- verification step omitted required coverage,
- a change passes local inspection but fails the documented validation contract,
- failures point to behavior regressions rather than missing files or bad checkout state.

**Required evidence**
- reproducible test output with stable failing assertions or process errors,
- mapping from the failing test to the expected contract,
- confirmation that the failure is not caused by missing dependencies, broken worktree state, or bad config selection.

### 4. Merge verification failure
A task may pass in the lane or worktree but fail during merge-time or post-merge verification because the merged environment, verification inputs, or integration assumptions differ from the lane context.

**Typical symptoms**
- lane-local checks pass but merge or post-merge verification fails,
- merged-tree commands fail with path or artifact assumptions that did not fail in-lane,
- failures appear only after integration,
- operator sees incidents such as post-merge `extensions dir not found` rather than worker-local logic defects.

**Required evidence**
- merge logs or verification output from the merged environment,
- comparison between lane success and post-merge failure,
- confirmation of which directories, inputs, or environment expectations changed across the boundary.

### 5. Repo-state issue
The primary blocker is the state of the lane worktree, snapshot, checkout, branch, or file tree rather than the worker’s intended implementation.

**Typical symptoms**
- packet-referenced files are absent from the lane even though the source repo says they should exist,
- git state, checkout integrity, or snapshot contents differ from packet assumptions,
- workers are blocked before they can implement because foundational files are missing,
- supervisor summaries show blocked workers caused by absent prompt-scoped files.

**Required evidence**
- file-system or git evidence showing missing or inconsistent tree state,
- comparison against the canonical repo or packet expectations,
- confirmation that the missing artifact is expected to exist rather than newly created by the task.

### 6. Config issue
Execution fails because required configuration, environment selection, paths, or policy inputs are missing, malformed, contradictory, or resolved from the wrong source.

**Typical symptoms**
- commands fail because config files, path roots, or settings are unresolved,
- behavior changes depending on which config source is loaded,
- verification or discovery uses stale fallback config instead of authoritative JSON,
- the task is blocked even though source files and packet scope are otherwise valid.

**Required evidence**
- the effective config source and values used during failure,
- error output showing malformed, missing, or contradictory config,
- confirmation that fixing code alone would not resolve the incident without correcting configuration.

### 7. Stale-doc or spec mismatch
The task packet or referenced source material is stale, missing, contradictory, or no longer authoritative, so the worker cannot reliably ground the requested work.

**Typical symptoms**
- prompt-cited docs or architecture references are absent from the execution snapshot,
- instructions reference files, commands, or contracts that no longer exist,
- packet guidance conflicts with current code or current repo layout,
- workers would need to invent missing truth to proceed.

**Required evidence**
- side-by-side comparison of packet claims and current repo/doc reality,
- missing-path or stale-reference evidence from the snapshot,
- confirmation that the mismatch is in the packet or source material, not just an implementation omission.

### 8. Planning mismatch
The packet is conceptually mis-scoped or incorrectly decomposed: the requested work bundles incompatible concerns, assumes a wrong owner, or asks the worker to proceed down a plan that no longer matches the actual repo problem.

**Typical symptoms**
- a single packet mixes diagnosis, repo repair, and feature implementation unsafely,
- the worker can explain the issue but cannot safely complete the requested task as one unit,
- repeated plan revisions reveal that the packet structure, not just the code, is wrong,
- the right answer is to split tasks, redirect ownership, or rewrite the plan.

**Required evidence**
- packet scope analysis showing incompatible concerns or wrong ownership,
- execution history demonstrating retries do not reduce uncertainty,
- explanation of why a narrower or differently owned packet would be safer.

### 9. Orchestrator or runtime issue
The failure originates in the execution machinery itself: spawning, lane coordination, persistence, review routing, merge orchestration, telemetry, or resume behavior.

**Typical symptoms**
- discovery fails before any task can start,
- worker/session lifecycle, resume, or merge orchestration behaves incorrectly,
- dashboard or telemetry state disagrees with actual execution reality,
- multiple tasks fail in a pattern tied to runtime mechanics rather than task content.

**Required evidence**
- runtime logs, supervisor summaries, or diagnostics showing control-plane failure,
- evidence that the same packet would likely succeed under a healthy runtime path,
- correlation across tasks or lifecycle stages implicating shared orchestration machinery.

## Common False Positives and Confusing Overlaps

### Missing file ≠ always implementation failure
A missing file in the lane can mean:
- the worker forgot to create a required artifact,
- the lane snapshot or checkout is incomplete,
- the packet references a file that no longer exists,
- merge verification is looking in the wrong directory.

Disambiguate by asking whether the file should already exist before the task starts, whether the canonical repo contains it, and whether the failure appears only after merge.

### Repeated failure ≠ automatically flaky implementation
Several repeated failures look “flaky” at first but are actually:
- stable test failures from a deterministic bug,
- config selection drift,
- repo-state corruption that persists across retries,
- planning mismatch where the task can never succeed as written.

Only use the flaky class when outcomes vary under materially unchanged inputs.

### Test failure vs implementation failure
These often co-occur. Use:
- **implementation failure** when the diff itself is clearly wrong or incomplete,
- **test failure** when verification is the primary observed blocker and the task now needs contract-level correction or validation follow-through.

If both are true, classify by the first action needed. If code must change before any meaningful re-run, implementation failure is usually primary.

### Merge verification failure vs repo-state issue
Both can present as “path not found” or “artifact missing.”
- classify as **repo-state issue** when the lane tree or snapshot is already wrong before merge,
- classify as **merge verification failure** when the lane succeeds and the problem appears only in merged or integration-time verification.

### Stale-doc/spec mismatch vs planning mismatch
These are related but distinct.
- **stale-doc/spec mismatch** means the packet’s cited truth is outdated, missing, or contradictory,
- **planning mismatch** means the task may be grounded in real artifacts but is scoped or assigned incorrectly for safe execution.

A stale spec often forces replanning, but not every replan is caused by stale documentation.

### Config issue vs orchestrator/runtime issue
Both may show as startup or discovery failures.
- choose **config issue** when correcting project/user/task configuration would resolve the failure without changing runtime code,
- choose **orchestrator/runtime issue** when the control-plane machinery is malfunctioning even with valid configuration.

## Evidence Quality Rules

Before choosing a class, prefer evidence in this order:
1. direct artifacts from the failing run: STATUS, review files, supervisor summaries, diagnostics, logs, and test output,
2. comparisons between lane behavior and merged-tree behavior,
3. packet references and current repo/doc reality,
4. hypotheses about likely causes.

When evidence is split across categories, report:
- primary class,
- competing class(es),
- missing evidence needed to resolve the ambiguity,
- the safest next action that avoids blind retry.
