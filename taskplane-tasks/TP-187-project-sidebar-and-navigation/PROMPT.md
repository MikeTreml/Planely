# Task: TP-187 - Project Sidebar and Navigation

**Created:** 2026-04-19
**Size:** M

## Review Level: 2 (Plan + Code)

**Assessment:** Operator-console UX enhancement that introduces a new primary navigation surface in the dashboard. Moderate blast radius across frontend layout, view state, and likely server payload shape.
**Score:** 4/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 2

## Canonical Task Folder

```text
taskplane-tasks/TP-187-project-sidebar-and-navigation/
├── PROMPT.md
├── STATUS.md
├── .reviews/
└── .DONE
```

## Mission

Add a project sidebar to the dashboard/operator console so the user can quickly move between projects and reduce clutter in the active workspace. The sidebar should support at least:
- Active projects
- Archived projects
- Recent projects (if the data exists or can be introduced safely)

This is primarily a navigation and UX task. It should not invent a heavyweight account system or remote sync model.

## Dependencies

- **TP-180** — Operator Console product framing
- **TP-181** — UX / IA
- **TP-185** — Planning/storage direction is helpful for project-level identity and persistence
- **TP-188** — If project registry/state is not already available, coordinate closely with the registry task

## Context to Read First

**Tier 2 (area context):**
- `taskplane-tasks/CONTEXT.md`

**Tier 3 (load only if needed):**
- `docs/specifications/operator-console/product-brief.md`
- `docs/specifications/operator-console/ux-ia.md`
- `docs/specifications/operator-console/planning-storage-layout.md`
- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `dashboard/server.cjs`

## Environment

- **Workspace:** `dashboard/`, `docs/specifications/`
- **Services required:** None

## File Scope

- `dashboard/public/index.html`
- `dashboard/public/app.js`
- `dashboard/public/style.css`
- `dashboard/server.cjs` (if sidebar data needs a new payload/endpoint)
- `docs/tutorials/use-the-dashboard.md` (if user-facing behavior is shipped)
- tests under the current dashboard/test conventions as appropriate

## Steps

### Step 0: Preflight

- [ ] Read relevant Operator Console specs/tasks
- [ ] Inventory current dashboard layout and identify where the sidebar can be added without breaking live views
- [ ] Determine the minimum project identity data needed for rendering the sidebar
- [ ] Identify whether project data is available now or requires TP-188 registry support

### Step 1: Sidebar UX contract

- [ ] Define sidebar sections: Active, Archived, Recent (or explicitly justify any deferment)
- [ ] Define what each project row shows: name, last activity, active batch badge, archived state, etc.
- [ ] Define selection/navigation behavior and empty states
- [ ] Define archive visibility behavior: archived projects hidden from active by default but still accessible

### Step 2: UI implementation

- [ ] Add sidebar shell/layout to the dashboard
- [ ] Render sectioned project list
- [ ] Add project selection behavior and selected-state styling
- [ ] Ensure the main content area responds correctly when switching projects
- [ ] Preserve current dashboard usability on narrower layouts

### Step 3: Integration behavior

- [ ] Wire sidebar selection into existing dashboard state/view loading
- [ ] Show project-level status badges if safe and grounded in real data
- [ ] Handle missing/stale/unavailable project data gracefully
- [ ] Keep archived projects discoverable but visually de-emphasized

### Step 4: Verification & Delivery

- [ ] Verify active vs archived navigation behavior
- [ ] Verify no regression to current single-project live-batch monitoring
- [ ] Update dashboard docs if the feature is shipped
- [ ] Log follow-up UI gaps (pinning, search, badges, etc.)

## Documentation Requirements

**Must Update:**
- `docs/tutorials/use-the-dashboard.md` — if sidebar ships user-facing

**Check If Affected:**
- `README.md` — only if the sidebar becomes a notable product feature immediately

## Completion Criteria

- [ ] Dashboard has a usable project sidebar
- [ ] Active and archived projects are visually separated
- [ ] Project switching/navigation is clear and stable
- [ ] Existing operator-console/dashboard views still function correctly

## Git Commit Convention

- **Step completion:** `feat(TP-187): complete Step N — description`
- **Bug fixes:** `fix(TP-187): description`
- **Hydration:** `hydrate: TP-187 expand Step N checkboxes`

## Do NOT

- Build a full multi-user workspace system
- Introduce cloud sync/account requirements
- Delete archived projects instead of hiding/de-emphasizing them
- Replace canonical project/runtime state with UI-only state

---

## Amendments (Added During Execution)
