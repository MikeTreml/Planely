# Task: TP-186 - Slack Companion Design

**Created:** 2026-04-19
**Size:** M

## Review Level: 1 (Plan Only)

**Assessment:** Integration-design task spanning notification semantics, approvals, and operator control boundaries. Important but intentionally non-implementation for now.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 1, Reversibility: 0

## Canonical Task Folder

```text
taskplane-tasks/TP-186-slack-companion-design/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Design a Slack companion for Taskplane Operator Console that provides remote awareness and lightweight control without becoming the canonical source of truth. The design should follow the good instincts from OpenClawWorkshop while remaining grounded in Taskplane’s actual architecture and safety model.

This task should produce an implementable design for notifications, approvals, status lookup, and deep-linking back to the dashboard.

## Dependencies

- **TP-180** — Product brief and domain model
- **TP-185** — Planning/storage proposal for app-level linking context

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/domain-model.md`
- `docs/specifications/operator-console/planning-artifacts.md`
- `../OpenClawWorkshop/docs/06-human-control-plane-slack.md`
- `../OpenClawWorkshop/docs/07-web-control-plane.md`
- `docs/reference/commands.md` — orchestrator command semantics
- `dashboard/server.cjs` — current dashboard URLs/data shape if relevant

## Environment

- **Workspace:** `docs/specifications/`, future integration layer only
- **Services required:** None

## File Scope

- `docs/specifications/operator-console/slack-companion.md` (new)
- `docs/specifications/operator-console/slack-message-contracts.md` (new)
- `docs/specifications/operator-console/slack-safety-model.md` (new)

## Steps

### Step 0: Preflight

- [ ] Read OpenClaw Slack/web control-plane docs and TP-180/TP-185 outputs
- [ ] Enumerate Taskplane actions that are safe for Slack in v1 vs unsafe/deferred
- [ ] Identify the minimum dashboard deep-link strategy needed

### Step 1: Slack companion scope

Create `docs/specifications/operator-console/slack-companion.md` with:
- [ ] Goals and non-goals
- [ ] Notification categories (start, blocked, approval, failed, completed, integrated)
- [ ] Slack commands/actions for v1 (status, approve, reject, cancel, maybe retry if justified)
- [ ] Relationship to dashboard and source-of-truth rules

### Step 2: Message/action contracts

Create `docs/specifications/operator-console/slack-message-contracts.md` with:
- [ ] Message shapes for each notification type
- [ ] Approval/rejection payload semantics
- [ ] Deep-link format to dashboard/task/batch views
- [ ] Idempotency expectations for repeated clicks/actions

### Step 3: Safety model

Create `docs/specifications/operator-console/slack-safety-model.md` with:
- [ ] Which actions require confirmation, rate limiting, or are deferred entirely
- [ ] Audit logging expectations (actor, time, target, outcome)
- [ ] Why Slack must never own canonical run state
- [ ] Failure modes and fallback behavior when Slack actions cannot be completed

### Step 4: Verification & Delivery

- [ ] Confirm the design is incremental and does not require a generalized bot platform
- [ ] Ensure all Slack actions map back to real orchestrator/app commands
- [ ] Log follow-up implementation tasks

## Documentation Requirements

**Must Update:**
- `docs/specifications/operator-console/slack-companion.md` (new)
- `docs/specifications/operator-console/slack-message-contracts.md` (new)
- `docs/specifications/operator-console/slack-safety-model.md` (new)

**Check If Affected:**
- `README.md` — only if Slack becomes part of published near-term roadmap messaging immediately

## Completion Criteria

- [ ] Slack companion v1 scope is concrete and bounded
- [ ] Notification/action payloads are defined
- [ ] Safety and audit rules are explicit
- [ ] Slack remains secondary to web + orchestrator canonical state

## Git Commit Convention

- **Step completion:** `docs(TP-186): complete Step N — description`
- **Hydration:** `hydrate: TP-186 expand Step N checkboxes`

## Do NOT

- Implement the Slack integration in this task
- Make Slack the source of truth
- Design a full chatops platform beyond the bounded v1 use cases
- Assume auth/identity is solved without documenting constraints

---

## Amendments (Added During Execution)
