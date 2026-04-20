# Task: TP-184 - Task Creation Form and Packet Preview

**Created:** 2026-04-19
**Size:** L

## Review Level: 2 (Plan + Code)

**Assessment:** Introduces task-authoring UX on top of file-backed packet generation. Moderate novelty and some risk around preserving canonical task conventions.
**Score:** 5/8 — Blast radius: 1, Pattern novelty: 2, Security: 0, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-184-task-creation-form-and-packet-preview/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Add a lightweight task creation flow to the Operator Console so an operator can draft a new Taskplane task packet from the UI, preview the generated packet content, and then write the canonical files (`PROMPT.md`, `STATUS.md`, `CONTEXT.md` counter update) safely.

This should respect the existing `create-taskplane-task` skill and task packet conventions rather than inventing a second incompatible task format.

## Dependencies

- **TP-180** — Product framing
- **TP-181** — UX / IA blueprint
- **TP-183** — Task detail/actions groundwork is helpful for the detail/preview interaction model

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `skills/create-taskplane-task/SKILL.md` — packet creation expectations
- `taskplane-tasks/TP-179-dashboard-state-and-server-fixes/PROMPT.md` — representative modern packet structure
- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `docs/specifications/operator-console/ux-ia.md`
- `docs/specifications/operator-console/view-models.md`
- `docs/specifications/operator-console/interaction-flows.md`

## Environment

- **Workspace:** `dashboard/`, `skills/`, `taskplane-tasks/`
- **Services required:** None

## File Scope

- `dashboard/server.cjs`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `skills/create-taskplane-task/SKILL.md` (only if task packet conventions need documented clarification)
- `docs/tutorials/use-the-dashboard.md` or new authoring docs if the feature ships
- `extensions/tests/*` or dashboard tests as appropriate

## Steps

### Step 0: Preflight

- [ ] Read the create-taskplane-task skill and current packet examples
- [ ] Identify the minimum fields needed to generate a valid packet
- [ ] Decide whether preview generation happens server-side, client-side, or both
- [ ] Define safety rules for writing packet files and incrementing `Next Task ID`

### Step 1: Creation data model and preview contract

- [ ] Define the UI form shape (area, title, mission, size, review level, dependencies, context refs, file scope)
- [ ] Define the preview output shape for PROMPT.md and STATUS.md
- [ ] Define validation/error messages for missing/invalid inputs
- [ ] Ensure output remains compatible with current Taskplane packet conventions

### Step 2: Write path and safety semantics

- [ ] Implement safe write flow for new task folders/files
- [ ] Ensure Next Task ID updates are correct and race-aware enough for current local-first usage
- [ ] Prevent accidental overwrite of existing task IDs/folders
- [ ] Make failure states recoverable and explicit

### Step 3: UI implementation

- [ ] Add create-task form UI
- [ ] Add packet preview UI before commit/write
- [ ] Add success/failure feedback and navigation to the new task detail/backlog entry
- [ ] Keep the UX lightweight and focused; no giant workflow builder

### Step 4: Verification & Delivery

- [ ] Test valid creation, validation failure, duplicate ID/folder, and preview fidelity cases
- [ ] Verify generated packets are launchable by `/orch`
- [ ] Update docs if shipped user-facing
- [ ] Log discoveries and follow-on gaps

## Documentation Requirements

**Must Update:**
- Dashboard/user docs if the UI feature is shipped

**Check If Affected:**
- `skills/create-taskplane-task/SKILL.md` — only if the canonical packet rules or assumptions need clarification for UI parity

## Completion Criteria

- [ ] Operator can draft and preview a valid packet from the UI
- [ ] Writing the packet produces canonical Taskplane files
- [ ] Existing task packet conventions remain intact
- [ ] Duplicate/invalid writes are safely blocked

## Git Commit Convention

- **Step completion:** `feat(TP-184): complete Step N — description`
- **Bug fixes:** `fix(TP-184): description`
- **Hydration:** `hydrate: TP-184 expand Step N checkboxes`

## Do NOT

- Introduce a second task definition format
- Skip packet preview before write
- Overwrite existing task packets silently
- Build a generalized workflow editor in this task

---

## Amendments (Added During Execution)
