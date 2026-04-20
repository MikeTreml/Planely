# Document Freshness Model

## Status

Draft for TP-198.

## Purpose

Define how Taskplane / Planely should evaluate whether a document is still likely to reflect current project reality.

Freshness in this model does **not** mean correctness, only review confidence. A document can be fresh and still wrong if the review was weak; a document can be old and still trustworthy if the area is stable and the document's role is historical. The goal is to produce a practical, automation-ready model for deciding when a doc is still active, review-due, or stale-suspect.

This model builds on `documentation-governance-policy.md` and the provenance fields defined in `document-provenance-model.md`.

## Why Date-Only Freshness Is Not Enough

Calendar age is a useful signal, but it is not strong enough on its own.

Date-only freshness fails because:
1. stable reference docs can remain valid for long periods,
2. fast-moving areas can drift within days if multiple related tasks land,
3. historical documents are expected to be old and should not be punished for that alone,
4. superficial edits can make a doc look recent without re-validating its assumptions,
5. and different authority levels carry different risk when stale.

Examples:
- A reference doc reviewed 10 days ago may already be unsafe if six related tasks changed command behavior.
- A migration retrospective reviewed 200 days ago may still be correctly historical with no need for routine freshness pressure.
- A roadmap touched yesterday for formatting should not be treated as substantively refreshed.

Therefore freshness must combine **task distance**, **authority level**, **doc type**, **lifecycle state**, and **substantive review markers**, with dates used only as supporting evidence.

## Core Inputs

A freshness calculation should look at the following inputs.

| Input | Source | Why it matters |
|------|--------|----------------|
| `lastReviewedTask` | provenance metadata | Anchor for measuring project movement since the last explicit review. |
| `lastReviewedAt` | provenance metadata | Supports calendar-based reminders and operator visibility. |
| `lastMaterialUpdateTask` | provenance metadata | Distinguishes content-changing work from review-only reaffirmation. |
| `reviewWindowTasks` | provenance metadata / doc defaults | Defines the task-distance budget before review is due. |
| `authorityLevel` | provenance metadata | Higher-authority docs should usually become review-due sooner when the area moves. |
| `docType` | provenance metadata | Different doc classes need different review pressure. |
| `lifecycleState` | provenance metadata | Historical or archived docs should not be evaluated like active guidance. |
| related task count | derived from task history | Measures how much relevant project motion has happened since last review. |
| calendar age | derived from timestamps | Helpful reminder signal, but secondary to task distance. |
| substantive review flag | review process evidence | Prevents typo-only changes from resetting freshness. |

## Task-Distance Freshness Rules

### Definition

**Task distance** is the amount of relevant project change that occurred after a document's last explicit review. It is measured by counting or weighting tasks that materially affect the document's subject area.

Task distance should be computed from the document's owning area and adjacent subsystems, not from every task in the repository.

### Base rule

A document remains comfortably fresh while:
- its lifecycle state is intended for active use,
- it has not crossed its `reviewWindowTasks`,
- and no high-impact change has invalidated a core assumption.

A document becomes **review-due** when either:
- relevant task distance reaches or exceeds the review window,
- or calendar reminders indicate the doc has been untouched longer than expected for its class.

A document becomes **stale-suspect** when one or more of the following hold:
- task distance substantially exceeds the review window,
- a major feature phase or architecture shift landed after the last review,
- current code/specs contradict the document's assumptions,
- or the doc keeps requiring caveats in task packets because trust is uncertain.

### Relevant task selection

A task should count toward task distance when it:
- changes runtime behavior the doc describes,
- changes operator workflows the doc instructs,
- changes schema/config/state that the doc treats as current truth,
- supersedes an adjacent design document,
- or creates repeated reviewer/operator confusion around the doc's claims.

A task should usually **not** count when it:
- only changes unrelated areas,
- makes cosmetic doc edits,
- or touches implementation detail with no effect on the document's meaning.

### Weighted events

Future tooling may use simple counts first, but the model should allow weighting.

Suggested weighting:
- `1` for ordinary related implementation/planning tasks,
- `2` for major design shifts or milestone-completion tasks,
- immediate stale escalation for explicit contradiction or supersession.

This keeps the model simple enough for early tooling while leaving room for better heuristics later.

## Review Windows by Document Type and Authority Level

Review windows should vary along **two axes**:
1. document type,
2. authority level.

Doc type captures how the document is used. Authority level captures the risk of relying on it.

### Baseline windows by doc type

| Doc type | Typical use | Baseline review window |
|---------|-------------|------------------------|
| `reference` | exact commands, config, schema, or file semantics | 3-5 relevant tasks |
| `how-to` | operator procedure and workflows | 4-6 relevant tasks |
| `tutorial` | onboarding flows and examples | 5-8 relevant tasks |
| `spec` | active design / implementation planning | 3-6 relevant tasks while area is shipping |
| `roadmap` / `adoption` | contextual planning and sequencing | 6-10 relevant tasks |
| `investigation` / `incident` | rationale and provenance record | review once after stabilization, then usually historical |
| `historical implemented spec` | retained implementation lineage | no routine task window once clearly historical |

### Authority-level modifiers

Apply the following modifiers to the baseline window.

| Authority level | Modifier | Rationale |
|-----------------|----------|-----------|
| `authoritative` | tighten by 1-2 tasks | Readers are likely to trust these docs directly. Drift is expensive. |
| `contextual` | use baseline | Useful for reasoning, but not sole decision authority. |
| `historical` | usually exempt from routine freshness windows | Value is provenance, not current operational guidance. |

### Example combined windows

| Doc type | Authority | Suggested window |
|---------|-----------|------------------|
| reference | authoritative | 3-4 relevant tasks |
| reference | contextual | 4-5 relevant tasks |
| how-to | authoritative | 4-5 relevant tasks |
| spec | authoritative | 3-4 relevant tasks during active delivery |
| roadmap | contextual | 6-10 relevant tasks |
| investigation | historical | no ongoing window after historical framing is explicit |

### Calendar backstop

Task distance is primary, but a calendar backstop is still useful.

Suggested backstop posture:
- reference/how-to docs: review if untouched for roughly 30-60 days,
- active specs: review if untouched for roughly 30 days during active delivery,
- roadmaps/adoption notes: review if untouched for roughly 60-90 days,
- historical docs: no routine backstop unless ambiguity exists.

The calendar backstop should trigger review reminders, not override obvious task-distance evidence.

## Derived Freshness States

Freshness should be derivable from provenance plus project activity. The following states are sufficient for initial tooling.

### `fresh-active`

Use when:
- the doc is `active`,
- task distance remains below the review window,
- and no contradiction/supersession signal exists.

Interpretation:
- safe to cite normally according to its authority level.

### `review-due`

Use when:
- the doc is still believed useful,
- but task distance or calendar reminders crossed the expected review window,
- without strong evidence of contradiction.

Interpretation:
- cite with caution in fast-moving areas,
- queue explicit review soon,
- can return to `fresh-active` after reaffirmation.

### `stale-suspect`

Use when:
- task distance materially exceeded the review window,
- or the doc's assumptions likely diverge from reality,
- or the document keeps needing caveats because its trust level is unclear.

Interpretation:
- should not be treated as primary authority,
- should be triaged into re-review, superseded, archived, or historical handling.

### `superseded`

Use when:
- a replacement document is known,
- and the old doc is no longer the current source of truth.

Interpretation:
- freshness is no longer about review cadence; the key action is preserving explicit lineage.

### `historical-stable`

Use when:
- the document is intentionally historical,
- its framing is explicit,
- and no routine review pressure is needed.

Interpretation:
- safe to retain for provenance,
- not part of the active guidance surface.

## State Transition Triggers

Suggested automation-friendly triggers:

| From | To | Trigger |
|------|----|---------|
| `fresh-active` | `review-due` | relevant task distance >= review window, or calendar backstop exceeded |
| `review-due` | `fresh-active` | substantive review completed and doc reaffirmed |
| `review-due` | `stale-suspect` | contradiction, supersession pressure, or task distance well beyond threshold |
| `stale-suspect` | `fresh-active` | substantive review/update resolves drift and resets provenance |
| `stale-suspect` | `superseded` | replacement doc recorded |
| `review-due` / `stale-suspect` | `historical-stable` | doc is intentionally retained as historical rather than active guidance |

## Substantive Review Rules

Freshness should reset only on **substantive review**, not on any file change.

A review is substantive when the reviewer or task:
- checks the doc against current code/spec/runtime reality,
- affirms or updates the authority/lifecycle placement,
- and records `lastReviewedTask` and `lastReviewedAt` intentionally.

The following should **not** reset freshness by themselves:
- typo fixes,
- formatting cleanup,
- link repairs,
- moving a file without re-validating its content,
- or automated mass edits with no semantic verification.

If a task materially rewrites the document, it may update both `lastMaterialUpdateTask` and `lastReviewedTask` in the same change.

## Practical Readiness for Tooling

The model is designed so future tooling can:
- compute freshness from metadata plus task history,
- flag docs approaching or exceeding review windows,
- warn when task packets cite `review-due` or `stale-suspect` docs,
- distinguish historical docs from neglected active docs,
- and produce audit views without forcing filename-based conventions.

## Interaction with Encoding Choices

Freshness metadata should be stored using the provenance model's preferred encoding posture:
1. inline metadata for most Markdown docs,
2. sidecars for render-sensitive files such as some `README.md` documents,
3. optional manifest aggregation for audits and dashboards.

The freshness logic should be independent of whether the metadata was stored inline or in a sidecar.

## Outcome

A practical freshness model for Taskplane docs should judge trust by project movement, not age alone. Task distance is the primary signal, adjusted by doc type and authority level, with derived states that future operators and tooling can compute consistently without renaming files or pretending recent timestamps equal reliable guidance.
