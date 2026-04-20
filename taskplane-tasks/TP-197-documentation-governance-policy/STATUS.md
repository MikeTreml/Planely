# TP-197: Documentation Governance Policy — Status

**Current Step:** Step 4: Verification & Delivery
**Status:** ✅ Complete
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 4
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Review current docs layout and drift patterns
- [x] Evaluate filename ideas vs metadata alternatives
- [x] Identify doc categories and authority levels

---

### Step 1: Define lifecycle states
**Status:** ✅ Complete
- [x] Define doc states and meanings
- [x] Define review / archive / supersede handling
- [x] Keep the state model practical

---

### Step 2: Define governance rules
**Status:** ✅ Complete
- [x] Define authoritative vs contextual vs historical docs
- [x] Define supersession recording
- [x] Define how stale docs should be handled in future planning
- [x] Explain why filename encoding is insufficient as the primary mechanism

---

### Step 3: Connect docs to project progress
**Status:** ✅ Complete
- [x] Capture task-distance review thinking
- [x] Explain why date-only freshness is insufficient
- [x] Suggest initial review windows by doc type

---

### Step 4: Verification & Delivery
**Status:** ✅ Complete
- [x] Verify practicality and low-churn governance
- [x] Log metadata/audit follow-up tasks

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| 1 | Plan | 1 | APPROVE | `.reviews/R001-plan-step1.md` |
| 2 | Plan | 2 | REVISE | `.reviews/R002-plan-step2.md` |
| 3 | Plan | 2 | APPROVE | `.reviews/R003-plan-step2.md` |
| 4 | Plan | 3 | APPROVE | `.reviews/R004-plan-step3.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Docs are organized by audience/purpose (`explanation/`, `reference/`, `specifications/`, `how-to/`, `tutorials/`) but governance metadata is inconsistent across specification files. | Use as policy input; prefer bounded lifecycle states plus provenance fields over ad hoc headings. | `docs/`, `docs/specifications/README.md` |
| Common drift patterns already exist: stale-but-still-indexed specs, implemented docs mixed with active drafts, and inconsistent provenance (`Status`, `Created`, `Updated`, task IDs, or none). | Capture directly in the governance policy so future task packets can classify documents before citing them. | `docs/specifications/**/*.md` |
| Filename cues alone are weak: folders like `implemented/` help, but headings such as "Implemented", "Draft", or version notes live inside docs and drift independently of filenames. | Recommend metadata/provenance as the primary mechanism, with filenames/folders used only as secondary aids. | `docs/specifications/taskplane/implemented/*`, `docs/specifications/*.md` |
| Initial category split for the policy is clear enough to proceed: reference/how-to/tutorial docs should be treated differently from forward-looking specifications, implementation records, and historical migration/investigation logs. | Use this to define authoritative vs contextual vs historical material in the policy. | `docs/README.md`, `docs/specifications/**`, `docs/explanation/**` |
| Verification confirmed the new policy includes lifecycle states, authority classes, supersession rules, filename rationale, task-distance review guidance, and follow-up tasks without requiring mass renames or immediate metadata implementation. | Accept as practical/low-churn for maintainers; defer tooling to follow-on tasks. | `docs/specifications/operator-console/documentation-governance-policy.md` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-20 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 19:22 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 19:22 | Step 0 started | Preflight |
| 2026-04-20 19:33 | Step 0 completed | Reviewed docs layout, drift patterns, and governance inputs |
| 2026-04-20 19:33 | Step 1 started | Define lifecycle states |
| 2026-04-20 19:36 | Step 1 completed | Lifecycle states, handling, and practical constraints documented |
| 2026-04-20 19:36 | Step 2 started | Define governance rules |
| 2026-04-20 19:42 | Step 2 completed | Authority classes, supersession rules, stale citation guidance, and filename rationale documented |
| 2026-04-20 19:42 | Step 3 started | Connect docs to project progress |
| 2026-04-20 19:44 | Step 3 completed | Task-distance freshness model and review windows documented |
| 2026-04-20 19:44 | Step 4 started | Verification & Delivery |
| 2026-04-20 19:45 | Step 4 completed | Practicality verified and follow-up tasks logged |

---

## Blockers

*None*

---

## Notes

Policy task for keeping documentation trustworthy as project assumptions evolve.
Reviewer suggestions to keep in mind:
- Make authority and lifecycle separate dimensions in the policy language.
- Prefer bidirectional supersession links where practical.
- Require explicit caveats or follow-up review when stale/historical docs are cited.

Step 0 evidence:
- Reviewed `docs/` layout and `docs/specifications/README.md` index structure.
- Sampled operator-console, taskplane, framework, and implemented specs to compare headers and status conventions.
- Confirmed drift patterns: mixed lifecycle cues, supersession sometimes recorded in prose only, and historical docs remaining navigable without uniform authority markers.
- Compared folder/filename signals (`implemented/`) against in-doc metadata patterns and noted why filename-only freshness would be brittle.
- Identified likely authority bands for later policy language: operational/reference docs, active design specs, implementation records, and historical investigation/migration logs.
- Created `docs/specifications/operator-console/documentation-governance-policy.md` with a bounded lifecycle model covering draft, active, review-due, stale-suspect, superseded, archived, and historical states plus expected handling notes.
- Added state transition rules and explicit guidance for when docs should move into review-due, stale-suspect, superseded, archived, or historical handling.
- Kept the policy implementation-light by preferring a small shared state set, metadata envelopes, and low-churn maintenance rules rather than mandatory renames or tooling in this task.
- Reviewer R002 required Step 2 to explicitly track the filename-insufficiency rationale inside the checklist, not only in Step 0 notes.
- Step 2 policy content now separates lifecycle state from authority and defines authoritative, contextual, and historical classes for future citation decisions.
- Added supersession rules that require explicit replacement links and prefer bidirectional `supersedes` / `supersededBy` recording for future indexing.
- Added citation rules for future task packets so stale-suspect, superseded, archived, and historical docs are not treated as silent primary authority.
- Strengthened the filename-governance section so metadata/provenance are explicitly primary and task packets are told not to infer trust from filenames alone.
- Step 3 includes task-distance review heuristics so freshness is judged by related project movement, not just elapsed calendar time.
- Added an explicit date-only critique covering slow-changing docs, fast-moving areas, historical records, and superficial edits.
- Suggested initial review windows for reference/operator docs, active specs, migration notes, investigation logs, and historical specs.
- Verified by grep that the policy file includes the required lifecycle, governance, progress, and follow-up sections while keeping the mechanism metadata-first and low churn.
- Logged follow-up work in the policy for metadata schema, corpus auditing, docs index surfacing, task-packet guardrails, supervisor/helpdesk integration, and archival workflow.
| 2026-04-20 19:24 | Review R001 | plan Step 1: APPROVE |
| 2026-04-20 19:27 | Review R002 | plan Step 2: REVISE |
| 2026-04-20 19:28 | Review R003 | plan Step 2: APPROVE |
| 2026-04-20 19:29 | Review R004 | plan Step 3: APPROVE |
