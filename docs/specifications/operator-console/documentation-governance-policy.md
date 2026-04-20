# Documentation Governance Policy

## Status

Draft for TP-197.

## Purpose

Define a practical governance model for Planely / Taskplane documentation so maintainers, task authors, reviewers, and future tooling can distinguish:
- current guidance from historical context,
- authoritative instructions from exploratory design notes,
- and healthy docs from material that is due for review or likely stale.

The policy is intended to reduce a recurring operational failure mode: old docs continue to look current, task packets cite them as if they were authoritative, and project progress quietly outruns the assumptions captured in the document.

## Design Principles

1. **Metadata over filename tricks.** Filenames and folder placement may help navigation, but they must not carry the full trust model.
2. **Bounded lifecycle states.** Every maintained doc should fit a small, shared state model.
3. **Authority must be explicit.** Readers need to know whether a doc is normative, contextual, or historical before they use it for planning.
4. **Review pressure should follow project change.** Fast-moving areas should be reviewed more aggressively than stable historical records.
5. **Archive by intent, not by age alone.** Old docs are not automatically wrong; they become risky when their relationship to current truth is unclear.
6. **Low-churn governance.** The system should work with lightweight metadata updates and should not require frequent renames or mass rewrites.

## Recommended Metadata Envelope

The preferred long-term mechanism is lightweight metadata or a predictable frontmatter/header block that tooling can parse. The exact machine format can be added later, but the policy assumes each governed document should eventually expose at least:
- `status`
- `authority`
- `created`
- `lastReviewed`
- `reviewAfter` or equivalent review cadence hint
- `owner` or owning area
- `supersedes` / `supersededBy` when applicable
- `relatedRuntimeVersion`, `relatedTaskIds`, or other provenance fields where useful

This policy does **not** require implementing those fields in this task. It defines the model that future metadata and auditing work should enforce.

## Lifecycle States

The lifecycle model should stay bounded to the following states.

### 1. Draft

A document in active authoring or early review.

Expected handling:
- May be cited for ongoing design discussion.
- Must not be treated as settled operator guidance unless another authoritative source says so.
- Should move to `active`, `historical`, or be abandoned within a reasonable window.

### 2. Active

A current document that is intended to guide implementation, operations, or decision-making.

Expected handling:
- Safe to cite in task packets and reviews as current guidance.
- Must have a clear authority classification.
- Should have a review expectation appropriate to its doc type and project velocity.

### 3. Review-Due

A document that is still believed to be useful, but whose review window has elapsed.

Expected handling:
- May still be cited, but citations should be cautious when newer work may have overtaken it.
- Should be queued for explicit review instead of silently left in circulation.
- Can return to `active` after review without major edits if still accurate.

### 4. Stale-Suspect

A document whose assumptions are likely outpaced by implementation, architecture, or adjacent shipped work, but which has not yet been formally superseded or archived.

Expected handling:
- Should not be used as primary planning authority.
- If cited, the citation should explicitly acknowledge its stale-suspect status and explain why it is still relevant.
- Should be triaged into `active`, `superseded`, `archived`, or `historical` rather than remaining indefinite.

### 5. Superseded

A document that has been replaced by one or more newer documents for current guidance.

Expected handling:
- Remains useful as change history or rationale.
- Must point to the replacement authority.
- Should not be used as the primary basis for new tasks except when reconstructing prior decisions.

### 6. Archived

A document intentionally retained for recordkeeping, but no longer part of the active planning or operator corpus.

Expected handling:
- Kept for traceability and audit.
- Should normally be excluded from default planning/documentation recommendations unless a user asks for historical material.
- May still be useful during incident review, migration archaeology, or release reconstruction.

### 7. Historical

A completed migration record, investigation log, or era-specific document preserved primarily to explain how the project evolved.

Expected handling:
- Valuable as context and provenance.
- Not normative for present behavior unless reaffirmed by newer active docs or the code.
- Usually does not require frequent freshness review once its historical framing is explicit.

## State Transition Rules

### When a doc should become `active`

A doc should become `active` when:
- it is intended to guide current implementation or operations,
- the owning area agrees it represents current direction,
- and its provenance is explicit enough that future workers can place it correctly.

### When a doc should become `review-due`

A doc should move to `review-due` when:
- its planned review window has elapsed,
- major related work has landed since the last review,
- or repeated tasks keep depending on it without anyone reaffirming it.

`review-due` is a maintenance signal, not a condemnation.

### When a doc should become `stale-suspect`

A doc should become `stale-suspect` when:
- code or shipped behavior clearly diverges from its assumptions,
- newer related specs exist but supersession has not been recorded,
- task packets repeatedly need caveats such as “use cautiously” or “partially outdated,”
- or the document mixes old and new reality in a way that makes operator trust unsafe.

### When a doc should become `superseded`

A doc should become `superseded` when:
- a newer document replaces it for current decision-making,
- the old document is still worth keeping for rationale,
- and the replacement relationship can be stated explicitly.

### When a doc should become `archived` or `historical`

A doc should become `archived` or `historical` when:
- it is no longer part of the active decision surface,
- preserving it still has explanatory or audit value,
- and its relationship to current truth is clearly framed.

Use `historical` when the document is deliberately retained as an era or migration record.
Use `archived` when the value is mostly retention and traceability.

## Authority Classes

Lifecycle state answers **how current** a document is. Authority answers **how much it should control decisions**.

### Authoritative

Documents that define the current source of guidance for a topic.

Typical examples:
- current reference docs,
- current operator runbooks,
- active design/spec documents that are intentionally steering implementation,
- maintained project instructions that govern execution behavior.

Rules:
- Must have explicit owner/provenance.
- Should be the default material cited in task packets.
- If an authoritative doc becomes review-due or stale-suspect, tasks should call that out instead of treating it as silently safe.

### Contextual

Documents that add rationale, design exploration, roadmap framing, or transition guidance but are not alone sufficient as the normative source.

Typical examples:
- planning notes,
- adoption or migration guidance,
- exploratory design memos,
- roadmap documents that explain intended sequencing.

Rules:
- Useful for planning, but should usually be paired with current authoritative docs or code evidence.
- Can remain active while still being non-authoritative.
- Should not outrank current reference/runtime truth during conflicts.

### Historical

Documents primarily retained to preserve decision history, investigations, migrations, or prior architecture eras.

Typical examples:
- implemented-era specs kept in `implemented/`,
- investigation logs,
- migration writeups,
- earlier framework designs kept for lineage.

Rules:
- Valuable for context, archaeology, and “why did we do this?” questions.
- Not default planning authority for new task packets.
- Should be clearly marked so their continued presence does not imply currency.

## Supersession Recording Rules

Supersession should be explicit and bidirectional where practical.

Minimum policy:
1. A superseded document should state that it is superseded.
2. It should identify the replacement document(s).
3. A replacement document should, where reasonable, note which document(s) it supersedes.
4. Indexes or doc catalogs should eventually surface this relationship.

Preferred future metadata fields:
- `supersededBy: [path...]`
- `supersedes: [path...]`
- optional `supersessionReason`

This explicit linkage matters because folder moves or filename conventions alone do not explain *why* a document stopped being authoritative.

## Why Filename Encoding Is Insufficient

Filename-based freshness schemes are attractive because they look simple, but they are not strong enough as the primary governance mechanism.

Problems with filename-led governance:
1. **Dates in filenames do not express authority.** A recent filename can still represent exploratory work, and an older file can remain the best active record.
2. **Renames create churn.** Every review or state change would pressure maintainers to rename files and update links across the repo, task packets, and outside references.
3. **Supersession is relational, not lexical.** A filename cannot explain which newer doc replaced the old one or whether the old file remains historically useful.
4. **Folder placement is only partially reliable.** `implemented/` is helpful, but many docs still carry current or historical meaning through their content rather than their path alone.
5. **Operators need richer provenance.** Review dates, task distance, owning area, and linked runtime versions are all stronger signals than filename patterns.

Therefore:
- filenames and directories may remain helpful navigation cues,
- but lifecycle state and provenance metadata should be the authoritative trust mechanism.

## Citation Rules for Future Task Packets

### Preferred citation order

When task packets gather context, they should prefer:
1. active authoritative docs,
2. active or review-due contextual docs with explicit caveats,
3. historical docs only when reconstructing rationale or comparing prior approaches.

### What to avoid

Task packets should avoid treating the following as primary authority unless no better source exists and the limitation is stated:
- `stale-suspect` docs,
- superseded docs,
- archived docs,
- historical investigation or migration records.

### If a stale or historical doc must be cited

The packet should explicitly say why it is being cited, for example:
- to preserve earlier reasoning,
- to compare rejected and current approaches,
- to recover missing provenance,
- or because the active replacement does not yet exist.

### Planner/reviewer expectation

When a task packet cites non-active material, planners and reviewers should ask:
- Is there a newer authoritative source?
- Is the cited doc being used for current guidance or only background?
- Should the task include a documentation review/update follow-up because the corpus is drifting?

## Project Progress and Review Expectations

Document freshness cannot be judged by date alone. It also depends on how far the project has moved since the document was last affirmed.

### Task-distance review thinking

A useful heuristic is **task distance**: how much implementation and planning change has occurred in the relevant area since the doc was last reviewed.

Signals that task distance has grown:
- multiple related task IDs landed after the doc’s last review,
- a major feature phase completed,
- the owning subsystem’s runtime model changed,
- an adjacent spec now references newer assumptions than the doc does,
- or repeated operator confusion suggests the doc’s model no longer matches reality.

A short calendar gap can still imply high drift if ten relevant tasks landed in that period.
A long calendar gap may be fine for a historical migration record whose purpose is fixed.

### Why date-only freshness is insufficient

Date-only heuristics fail because:
1. **Stable docs can remain valid for long periods.** Some reference material changes slowly.
2. **Fast-moving areas can drift within days.** Runtime architecture and operator workflows may change rapidly during active implementation.
3. **Historical docs are intentionally old.** Their age is expected and not itself a defect.
4. **A recent edit can be superficial.** A typo fix or formatting change does not prove a doc was substantively re-reviewed.

Therefore a future audit system should combine dates with task distance, area ownership, lifecycle state, and supersession links.

## Initial Review Windows by Doc Type

These are starting heuristics, not hard SLAs.

### Reference and operator guidance

Suggested review window: **every 30-60 days**, or sooner after major command/config/runtime changes.

Reasoning:
- These docs are most likely to be treated as authoritative by users and task packets.
- Drift here has direct operator cost.

### Active implementation/design specs

Suggested review window: **every 30 days** while the area is actively shipping, then reassess.

Additional trigger:
- review after meaningful milestone completion or several related task deliveries.

### Roadmaps and adoption/migration notes

Suggested review window: **every 60-90 days** or when phase assumptions materially change.

Reasoning:
- These docs are often contextual rather than normative, but they can mislead planning if left unchecked.

### Investigation logs and incident writeups

Suggested review window: **review once when the follow-up architecture or fix stabilizes**, then usually mark historical instead of repeatedly refreshing.

Reasoning:
- Their main value is provenance, not ongoing operational instruction.

### Implemented / historical specs

Suggested review window: **no routine freshness review once clearly framed as historical**, but ensure supersession and authority markers are present.

Reasoning:
- These should stay available without creating needless churn.

## Practical Maintenance Rules

1. **Do not assume old means wrong.** Reaffirmed docs may remain active.
2. **Do not assume new means authoritative.** Drafts and exploratory notes still need authority labeling.
3. **Prefer state flips and metadata updates over renames.** Governance should create clarity with minimal repo churn.
4. **Escalate ambiguous docs quickly.** If maintainers cannot tell whether a doc is active, it should become review-due or stale-suspect until clarified.
5. **Keep archive paths searchable but non-default.** Historical material should remain discoverable without dominating planning context.
6. **Record review intent, not just timestamps.** A substantive review marker is more valuable than a cosmetic update date.

## Suggested Follow-up Work

This policy implies future implementation tasks, but they are intentionally deferred from TP-197.

1. **Metadata schema task** — define the exact frontmatter/header fields and validation rules.
2. **Documentation audit task** — scan the current corpus, classify docs by state/authority, and flag missing provenance.
3. **Docs index surfacing task** — expose lifecycle state and authority in `docs/README.md` or another discoverable index.
4. **Task packet citation guardrails** — teach task creation/planning flows to prefer active authoritative docs and warn on stale/historical citations.
5. **Supervisor/helpdesk integration** — allow operator tooling to answer questions such as “is this doc still trusted?” based on metadata and audit results.
6. **Low-churn archival workflow** — define how archived/historical docs stay linked without frequent path churn.

## Overall Policy Outcome

The governing posture for Planely / Taskplane docs should be:
- explicit lifecycle state,
- explicit authority class,
- explicit supersession links,
- review expectations influenced by project progress and task distance,
- and historical retention that preserves provenance without pretending old material is current.

That approach keeps documentation trustworthy without turning filenames into a fragile pseudo-database or forcing maintainers into constant rename churn.
