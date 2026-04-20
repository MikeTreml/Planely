# General — Context

**Last Updated:** 2026-04-20
**Status:** Active
**Next Task ID:** TP-192

---

## Current State

This is the default task area for Planely. Tasks that don't belong
to a specific domain area are created here.

Taskplane is configured and ready for task execution. Use `/orch all` for
parallel batch execution or `/orch <path/to/PROMPT.md>` for a single task.

---

## Key Files

| Category | Path |
|----------|------|
| Tasks | `taskplane-tasks/` |
| Config | `.pi/taskplane-config.json` |

---

## Technical Debt / Future Work

_Items discovered during task execution are logged here by agents._

- [ ] **Restore or restage Taskplane architecture/dashboard reference docs in execution snapshots** — TP-180 found prompt-referenced files like `docs/explanation/architecture.md`, `docs/reference/commands.md`, dashboard assets, and OpenClaw reference docs absent from the worker snapshot, which makes grounding follow-on planning tasks harder. (discovered during TP-180)
