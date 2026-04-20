# TP-197: Documentation Governance Policy — Status

**Current Step:** Step 1: Define lifecycle states
**Status:** 🟡 In Progress
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 0
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
**Status:** 🟨 In Progress
- [ ] Define doc states and meanings
- [ ] Define review / archive / supersede handling
- [ ] Keep the state model practical

---

### Step 2: Define governance rules
**Status:** ⬜ Not Started
- [ ] Define authoritative vs contextual vs historical docs
- [ ] Define supersession recording
- [ ] Define how stale docs should be handled in future planning

---

### Step 3: Connect docs to project progress
**Status:** ⬜ Not Started
- [ ] Capture task-distance review thinking
- [ ] Explain why date-only freshness is insufficient
- [ ] Suggest initial review windows by doc type

---

### Step 4: Verification & Delivery
**Status:** ⬜ Not Started
- [ ] Verify practicality and low-churn governance
- [ ] Log metadata/audit follow-up tasks

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Docs are organized by audience/purpose (`explanation/`, `reference/`, `specifications/`, `how-to/`, `tutorials/`) but governance metadata is inconsistent across specification files. | Use as policy input; prefer bounded lifecycle states plus provenance fields over ad hoc headings. | `docs/`, `docs/specifications/README.md` |
| Common drift patterns already exist: stale-but-still-indexed specs, implemented docs mixed with active drafts, and inconsistent provenance (`Status`, `Created`, `Updated`, task IDs, or none). | Capture directly in the governance policy so future task packets can classify documents before citing them. | `docs/specifications/**/*.md` |
| Filename cues alone are weak: folders like `implemented/` help, but headings such as "Implemented", "Draft", or version notes live inside docs and drift independently of filenames. | Recommend metadata/provenance as the primary mechanism, with filenames/folders used only as secondary aids. | `docs/specifications/taskplane/implemented/*`, `docs/specifications/*.md` |
| Initial category split for the policy is clear enough to proceed: reference/how-to/tutorial docs should be treated differently from forward-looking specifications, implementation records, and historical migration/investigation logs. | Use this to define authoritative vs contextual vs historical material in the policy. | `docs/README.md`, `docs/specifications/**`, `docs/explanation/**` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-20 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 19:22 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 19:22 | Step 0 started | Preflight |
| 2026-04-20 19:33 | Step 0 completed | Reviewed docs layout, drift patterns, and governance inputs |
| 2026-04-20 19:33 | Step 1 started | Define lifecycle states |

---

## Blockers

*None*

---

## Notes

Policy task for keeping documentation trustworthy as project assumptions evolve.

Step 0 evidence:
- Reviewed `docs/` layout and `docs/specifications/README.md` index structure.
- Sampled operator-console, taskplane, framework, and implemented specs to compare headers and status conventions.
- Confirmed drift patterns: mixed lifecycle cues, supersession sometimes recorded in prose only, and historical docs remaining navigable without uniform authority markers.
- Compared folder/filename signals (`implemented/`) against in-doc metadata patterns and noted why filename-only freshness would be brittle.
- Identified likely authority bands for later policy language: operational/reference docs, active design specs, implementation records, and historical investigation/migration logs.
