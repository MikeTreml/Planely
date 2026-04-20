# TP-186: Slack Companion Design — Status

**Current Step:** Step 4: Verification & Delivery
**Status:** ✅ Complete
**Last Updated:** 2026-04-20
**Review Level:** 1
**Review Counter:** 5
**Iteration:** 1
**Size:** M

---

### Step 0: Preflight
**Status:** ✅ Complete
- [x] Read TP-180/TP-185 outputs and OpenClaw Slack docs
- [x] Classify safe vs deferred Slack actions
- [x] Identify dashboard deep-link needs

---

### Step 1: Slack companion scope
**Status:** ✅ Complete
- [x] Define goals, non-goals, and v1 actions
- [x] Define notification categories
- [x] Define source-of-truth relationship to dashboard/orchestrator

---

### Step 2: Message/action contracts
**Status:** ✅ Complete
- [x] Define message shapes
- [x] Define status lookup and decision payloads
- [x] Define stop/defer contract boundaries for lightweight control
- [x] Define deep-link and idempotency rules

---

### Step 3: Safety model
**Status:** ✅ Complete
- [x] Define audit, authorization, and confirmation rules
- [x] Define rate limiting and forbidden/deferred actions
- [x] Explain why Slack cannot own canonical run state
- [x] Define failure/fallback behavior

---

### Step 4: Verification & Delivery
**Status:** ✅ Complete
- [x] Verify the design is bounded and incremental
- [x] Ensure actions map to real orchestrator/app commands
- [x] Log follow-up implementation tasks

---

## Reviews

| # | Type | Step | Verdict | File |
|---|------|------|---------|------|
| R001 | plan | 1 | APPROVE | `.reviews/R001-plan-step1.md` |
| R002 | plan | 2 | REVISE | `.reviews/R002-plan-step2.md` |
| R003 | plan | 2 | APPROVE | `.reviews/R003-plan-step2.md` |
| R004 | plan | 3 | REVISE | `.reviews/R004-plan-step3.md` |
| R005 | plan | 3 | APPROVE | `.reviews/R005-plan-step3.md` |

---

## Discoveries

| Discovery | Disposition | Location |
|-----------|-------------|----------|
| Dashboard needs stable deep-link routing for live batch, historical batch, task, and approval focus states so Slack can link to durable targets instead of ad-hoc UI state. | Follow-up implementation task | `docs/specifications/operator-console/slack-companion.md`, `docs/specifications/operator-console/slack-message-contracts.md` |
| Slack approve/reject and bounded stop actions require a shared canonical action/approval backend with actor mapping, idempotency keys, and audit logging before any UI integration should ship. | Follow-up implementation task | `docs/specifications/operator-console/slack-message-contracts.md`, `docs/specifications/operator-console/slack-safety-model.md` |
| Slack identity-to-operator authorization policy and rate-limiting behavior need dedicated implementation work before mutating Slack actions can be enabled safely. | Follow-up implementation task | `docs/specifications/operator-console/slack-safety-model.md` |

---

## Execution Log

| Timestamp | Action | Outcome |
|-----------|--------|---------|
| 2026-04-19 | Task staged | PROMPT.md and STATUS.md created |
| 2026-04-20 16:38 | Task started | Runtime V2 lane-runner execution |
| 2026-04-20 16:38 | Step 0 started | Preflight |
| 2026-04-20 16:49 | Preflight sources read | Reviewed TP-180/TP-185 prompts, statuses, operator-console docs, and OpenClaw Slack/web control-plane guidance |
| 2026-04-20 16:53 | Slack action triage | Safe v1 candidates: notifications, status lookup, approve/reject, and bounded cancel/pause-abort requests; defer retry/skip/force-merge/resume/start until web-first flows and stronger context/confirmation exist |
| 2026-04-20 16:55 | Deep-link scan | Current dashboard exposes batch history and STATUS.md/task views via API, so the minimum Slack-linkable targets are live batch, historical batch, task detail/status, and approval-focused views encoded as future dashboard URLs rather than Slack-owned state |
| 2026-04-20 16:56 | Step 0 complete | Ready to draft Slack companion scope docs |
| 2026-04-20 17:01 | Slack companion draft started | Created `docs/specifications/operator-console/slack-companion.md` with goals, non-goals, positioning, and bounded v1 actions |
| 2026-04-20 17:02 | Notification scope defined | Documented v1 Slack notification categories: started, blocked, approval, failure, completion, and integration |
| 2026-04-20 17:03 | Authority boundary captured | Spec defines Slack as companion-only, with dashboard as rich control surface and Taskplane/planning files as canonical state |
| 2026-04-20 17:03 | Step 1 complete | Ready to define message and action contracts |
| 2026-04-20 17:05 | Review R002 | plan Step 2 returned REVISE; expanded Step 2 outcomes for status lookup, bounded stop/cancel treatment, and approval deep-link coverage |
| 2026-04-20 17:13 | Message contracts drafted | Created `docs/specifications/operator-console/slack-message-contracts.md` with shared envelope and notification message shapes |
| 2026-04-20 17:14 | Lookup and decision contracts defined | Added compact batch/task status lookup responses plus approve/reject payload semantics and response states |
| 2026-04-20 17:15 | Lightweight control boundary defined | Documented bounded `request_stop` contract and explicitly kept retry/skip/resume/force-merge outside Slack v1 |
| 2026-04-20 17:16 | Deep-link rules defined | Spec now covers batch/task/approval link targets plus duplicate delivery, repeated click, and stale action idempotency cases |
| 2026-04-20 17:16 | Step 2 complete | Ready to define Slack safety and fallback rules |
| 2026-04-20 17:18 | Review R004 | plan Step 3 returned REVISE; expanded Step 3 outcomes for authorization, rate limiting, and canonical-state guardrails |
| 2026-04-20 17:22 | Safety model drafted | Created `docs/specifications/operator-console/slack-safety-model.md` with audit requirements, identity mapping constraints, and action-sensitive confirmation rules |
| 2026-04-20 17:23 | Action guardrails defined | Classified allowed, confirmation-required, rate-limited, dashboard-only, and forbidden Slack actions for v1 |
| 2026-04-20 17:24 | Canonical-state rationale captured | Safety doc explicitly explains why Slack messages cannot become the run-state ledger or second execution authority |
| 2026-04-20 17:25 | Failure handling defined | Added explicit stale, unauthorized, unavailable, rate-limited, and dashboard-confirmation fallback responses |
| 2026-04-20 17:25 | Step 3 complete | Ready to verify bounded scope and log follow-up implementation work |
| 2026-04-20 17:29 | Scope verification | Re-read the three Slack specs together and added explicit bounded-delivery/follow-up sections to keep v1 limited to notifications, lookup, decisions, and deep links |
| 2026-04-20 17:30 | Command mapping check | Grounded Slack actions against current dashboard/runtime reads plus orchestrator pause/abort and explicitly kept retry/skip/force-merge/resume/integrate out of Slack v1 |
| 2026-04-20 17:31 | Follow-up work logged | Added implementation follow-ups for deep-link routing, canonical Slack action backend, and identity/rate-limit enforcement |
| 2026-04-20 17:31 | Step 4 complete | Slack companion design verified and follow-up implementation tasks recorded |

---

## Blockers

*None*

---

## Notes

Slack is intentionally secondary; this task defines bounded companion behavior.

Preflight findings:
- TP-180 positions the web console as the primary operator surface and Slack as a lightweight companion for awareness, quick approvals, and links back to richer context.
- TP-185 establishes `.taskplane/project/planning/*.json` as future canonical planning context, while task packets, batches, runs, approvals, and artifacts remain the execution truth.
- OpenClaw's relevant guidance matches that posture: Slack should provide notifications, quick status, approve/reject, and cancel, but not own canonical state or complex recovery flows.
- Safe v1 Slack actions should stay low-risk and map cleanly to existing operator intents: view status, acknowledge/approve/reject a pending decision, and request a bounded batch/task stop. More destructive or recovery-heavy controls such as start, resume, retry, skip, and force-merge should stay deferred to the dashboard until identity, confirmation, and broader context are stronger.
- Minimum dashboard deep-link targets for Slack are: a live batch view (`batchId`), a historical batch summary (`history/<batchId>`), a task-focused view (`taskId`, likely opening STATUS/task detail), and an approval-focused landing state (`approvalId` plus related batch/task IDs). The links should only identify canonical objects and desired focus; the dashboard should resolve current state from Taskplane files/APIs.

Reviewer notes:
- Step 2 must define compact status lookup contracts, not just push notifications and approvals.
- Step 2 must either define the bounded stop/cancel request contract or explicitly mark what is deferred pending the Step 3 safety model.
- Step 3 must cover rate limiting, Slack identity/authorization constraints, and restate why Slack can never own canonical run state.
