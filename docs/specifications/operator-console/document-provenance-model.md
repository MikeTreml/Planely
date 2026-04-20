# Document Provenance Model

## Status

Draft for TP-198.

## Purpose

Define a document-level provenance model for Taskplane / Planely docs so future tooling and operators can answer:
- why a document exists,
- which task created or materially updated it,
- which task last re-affirmed it as still trustworthy,
- what authority the document should carry,
- and how supersession should be recorded without encoding task IDs into filenames.

This model complements the lifecycle and authority policy from `documentation-governance-policy.md`. It focuses on provenance fields and encoding expectations rather than state semantics alone.

## Design Goals

The provenance model must:
1. preserve low-churn filenames and stable links,
2. work for common Markdown docs without forcing repo-wide renames,
3. support future audit tooling and task-packet citation guardrails,
4. separate authorship, review, authority, and supersession concerns,
5. handle special files such as `README.md` cleanly, and
6. degrade gracefully for older docs that do not yet carry full metadata.

## Canonical Provenance Fields

The following fields form the baseline provenance envelope.

| Field | Required? | Meaning |
|------|-----------|---------|
| `createdByTask` | Required for newly governed docs | Task ID that originally created the document or first introduced it into the governed corpus. |
| `createdAt` | Optional | Date the document was first created. Useful for audit context, but not sufficient for freshness on its own. |
| `lastMaterialUpdateTask` | Optional | Most recent task that materially changed the document's guidance, structure, or assumptions. |
| `lastMaterialUpdateAt` | Optional | Date of the last material update. Distinct from cosmetic edits. |
| `lastReviewedTask` | Required for active authoritative/contextual docs once reviewed under the new model | Task ID that last explicitly checked whether the document still matches current project reality. |
| `lastReviewedAt` | Required for active authoritative/contextual docs once reviewed under the new model | Date of the last explicit review. |
| `authorityLevel` | Required | How much decision weight the document should carry. Initial values should align to `authoritative`, `contextual`, or `historical`. |
| `lifecycleState` | Required | Current lifecycle classification such as `draft`, `active`, `review-due`, `stale-suspect`, `superseded`, `archived`, or `historical`. |
| `ownerArea` | Required | Owning area or subsystem responsible for keeping the document trustworthy, such as `taskplane`, `operator-console`, or `docs`. |
| `docType` | Required | High-level document class used for review heuristics, for example `reference`, `how-to`, `tutorial`, `spec`, `roadmap`, or `investigation`. |
| `reviewWindowTasks` | Optional but recommended | Task-distance window after which the document should become review-due if relevant work continues landing. |
| `relatedTaskIds` | Optional | Additional task IDs materially connected to the document, such as major follow-up implementations or migrations. |
| `supersedes` | Optional | Paths of older documents this document replaces for current guidance. |
| `supersededBy` | Optional | Paths of newer documents that replaced this document. |
| `supersessionReason` | Optional | Short explanation of why the supersession happened. |
| `relatedRuntimeVersion` | Optional | Runtime/package/version anchor when a doc is tightly bound to a release-era behavior snapshot. |
| `notes` | Optional | Small human-readable caveat for migration gaps, partial audits, or special handling. |

## Field Semantics

### `createdByTask`

This is the anchor for "why does this doc exist?" It should point to the task that created the document as an intentional project artifact, not merely the first later task that noticed it.

### `lastMaterialUpdateTask`

Use this when the content meaningfully changed. Examples:
- the command model changed,
- the architecture assumption changed,
- the doc was rewritten to match shipped behavior,
- or the authoritative scope moved.

Do not update it for typo fixes, formatting, or index-link repairs.

### `lastReviewedTask`

Use this when a task explicitly checked the document's current validity and decided it still stands, even if no major rewrite was needed. This is the key bridge between documentation trust and project progress.

### `authorityLevel`

This captures decision weight, not freshness. A document can be recently reviewed but still only contextual. Conversely, a historical document can remain valuable for provenance without being authoritative.

### `reviewWindowTasks`

This is the task-distance input to freshness logic. It should usually be a small integer or heuristic band rather than a calendar-only rule. For example:
- reference docs may use a short task window in fast-moving areas,
- historical docs may omit it,
- roadmap docs may use a wider window.

### `supersedes` and `supersededBy`

These fields express replacement relationships explicitly. They should be preferred over filename conventions, folder assumptions, or vague prose such as "newer spec exists." Where practical, record the link in both old and new docs.

## Required vs Optional Rules

### Required for new governed docs

New docs added under this model should include at minimum:
- `createdByTask`
- `authorityLevel`
- `lifecycleState`
- `ownerArea`
- `docType`

These fields give future readers enough information to place the doc correctly even before the first follow-up review cycle.

### Required after first explicit review

Once a document is reviewed under this model and is intended to stay in active circulation, it should also include:
- `lastReviewedTask`
- `lastReviewedAt`

For active docs, omitting these long-term weakens auditability and makes freshness calculations ambiguous.

### Required when supersession exists

If the document is replaced or replaces another governed doc, record:
- `supersededBy` on the old doc,
- `supersedes` on the new doc where practical,
- and `supersessionReason` if the relationship would otherwise be unclear.

### Optional but strongly recommended

These fields improve automation but should not block initial adoption:
- `createdAt`
- `lastMaterialUpdateTask`
- `lastMaterialUpdateAt`
- `reviewWindowTasks`
- `relatedTaskIds`
- `relatedRuntimeVersion`
- `notes`

### Optional for historical carry-forward docs

Historical and archived docs may intentionally omit fields such as `lastReviewedTask` or `reviewWindowTasks` if their purpose is fixed and they are clearly marked as non-current. They should still carry enough provenance to explain why they remain in the corpus.

## Special Cases and Filename-Safe Handling

### `README.md` files

`README.md` files are a core special case because their names carry navigational meaning. Renaming them to include task IDs, dates, or freshness markers would create avoidable churn and break expectations for humans and tooling.

Recommended handling:
- keep the stable `README.md` filename,
- store provenance in frontmatter or a predictable top-of-file metadata block when the README can tolerate it,
- and use a sidecar or registry entry only when the README's rendered presentation must stay free of machine metadata.

This applies to:
- the repo root `README.md`,
- `docs/README.md`,
- section index files such as `docs/specifications/README.md`,
- and any future package/folder README intended as a conventional entry point.

### Render-sensitive docs

Some docs are rendered for user-facing polish or are expected to start immediately with a title/introduction. For these files, an inline metadata block may be visually awkward even if technically valid.

Examples may include:
- landing-page style READMEs,
- terse cheat sheets,
- exported docs mirrored into external publishing flows.

For these docs, provenance may live in a sidecar or registry manifest while the primary file remains presentation-first.

### Historical implemented specs

Docs retained in folders like `specifications/taskplane/implemented/` already have strong historical framing from path and content, but path alone is not enough. They should still record explicit `authorityLevel`, `lifecycleState`, and supersession fields where applicable.

### Legacy docs without known origin task

Some older docs may predate the provenance model or may not have an easily recoverable originating task. In those cases:
- keep `createdByTask` blank only temporarily,
- use `notes` to explain the gap,
- let audit tooling flag the missing origin,
- and avoid inventing a false task ID.

## Encoding Options

The provenance model should support multiple encodings because the corpus is heterogeneous.

### Option A: Frontmatter or top-of-file metadata block

Strengths:
- keeps metadata attached to the document,
- easy for humans and tools to inspect,
- portable with file moves,
- good default for most Markdown specs and guides.

Weaknesses:
- visually intrusive for some `README.md` and polished landing docs,
- requires consistent parser rules,
- may be awkward in externally mirrored docs.

Best fit:
- most specifications,
- how-to/reference docs,
- docs where a metadata header does not hurt readability.

### Option B: Sidecar metadata file

Strengths:
- keeps the primary doc visually clean,
- works for render-sensitive files,
- can encode richer metadata without affecting content rendering.

Weaknesses:
- metadata can drift from the primary doc,
- renames and moves require paired updates,
- harder for casual readers to discover.

Best fit:
- `README.md` files that must stay presentation-first,
- externally synced docs,
- exceptional files with strict layout expectations.

### Option C: Registry manifest

Strengths:
- centralizes audit/query operations,
- useful for bulk tooling and dashboards,
- can cover documents that cannot hold inline metadata.

Weaknesses:
- weakest local discoverability,
- most vulnerable to drift if not enforced by tooling,
- document provenance becomes less obvious during ad hoc reading.

Best fit:
- audit indexes,
- backfill/migration support,
- secondary aggregation layer rather than sole source of truth for normal docs.

## Recommendation

Default posture:
1. use inline frontmatter or a predictable metadata header for most governed Markdown docs,
2. allow sidecars for `README.md` and other render-sensitive exceptions,
3. use a registry manifest as an optional aggregation layer for auditing and dashboards rather than the only provenance source.

This keeps provenance close to the document while still respecting conventional filenames and presentation-sensitive files.

## Adoption Notes

For existing docs without provenance metadata:
1. classify authority and lifecycle first,
2. add minimum required provenance fields during the next substantive review,
3. record unknown fields honestly rather than guessing,
4. and backfill cross-doc supersession links opportunistically as audits proceed.

## Outcome

A document provenance model for Taskplane should treat filenames as stable identifiers for navigation, not as the container for task lineage or freshness. Provenance belongs in explicit metadata fields that future tooling can read, compare, and audit without forcing `README.md` churn or brittle task-ID-in-filename conventions.
