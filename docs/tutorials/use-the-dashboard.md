# Use the Dashboard

Taskplane includes a web dashboard for monitoring orchestration in real time.
It now opens with a backlog-first operator view when no batch is active, while
preserving the existing live batch workspace during execution.

## What it shows

- backlog discovery outside active batches, with readiness/status cards and lightweight filters
- task detail inspection (mission, dependencies, file scope, current step, latest execution log)
- operator actions from the task detail panel, including direct start/integrate triggers plus copyable recovery commands when direct execution is not yet supported
- batch phase and summary counters
- wave/lane progress
- task-level status and checkbox progress (from `STATUS.md`)
- lane sidecar state (`.pi/lane-state-*.json`)
- batch history (`.pi/batch-history.json`)
- repo-aware filtering and grouping (workspace mode)
- supervisor status, recovery actions, and conversation history (when supervisor is active)

---

## Start the dashboard

From your project root:

```bash
taskplane dashboard
```

Defaults:

- port: `8099`
- root: current directory
- browser auto-opens unless disabled

Options:

```bash
taskplane dashboard --port 3000
taskplane dashboard --no-open
```

---

## Typical workflow

Terminal A:

```bash
taskplane dashboard
```

Terminal B:

```bash
pi
```

Inside pi:

```text
/orch all
```

Dashboard updates live while orchestration runs.

When no batch is active, the dashboard lands on **Backlog** and keeps batch
history available as secondary context. When a batch is active, it defaults to
**Live Batch** with one-click switching back to Backlog.

Select a task from **Backlog**, **Live Batch**, or **Batch Summary** to open the
shared **Task Detail** panel. The panel surfaces the task mission, dependency
state, file scope, current step, and most recent execution log entry without
opening raw `PROMPT.md` or `STATUS.md` files.

The same detail panel now hosts the first operator controls:

- **Start task** — launches a batch for the selected ready task when no batch is actively running
- **Integrate batch** — runs `/orch-integrate` when the current batch is completed
- **Retry/Skip task** — shown as copyable recovery commands today, with inline reasons when the dashboard cannot execute them directly yet

Direct actions always ask for confirmation. Disabled actions explain why they
are unavailable so the operator can tell whether they need to wait, resume, or
switch back to the console.

---

## Supervisor panel

When the supervisor agent is active, the dashboard shows a collapsible
**Supervisor** panel with:

- **Status indicator** — active/inactive badge with autonomy level and heartbeat age
- **Recovery actions** — chronological timeline of supervisor interventions (from `actions.jsonl`)
- **Conversation history** — operator ↔ supervisor messages
- **Batch summary** — rendered when available (post-batch)

The panel appears automatically when supervisor data is available. For
pre-supervisor batches (or when no supervisor files exist), the panel is
hidden — no extra clutter.

---

## Data sources

Dashboard server reads:

- `.pi/batch-state.json`
- `.pi/lane-state-*.json`
- task `STATUS.md` files
- `.pi/batch-history.json`
- `.pi/supervisor/lock.json` (supervisor status)
- `.pi/supervisor/actions.jsonl` (recovery actions)
- `.pi/supervisor/events.jsonl` (supervisor events)

Updates are pushed to browser clients via Server-Sent Events (SSE).

---

## Workspace mode (multi-repo)

When orchestrating across multiple repositories (workspace mode), the
dashboard automatically shows repo-aware features:

- **Repo badges** appear on lanes and tasks, showing which repo each belongs to
- **Repo filter dropdown** lets you focus on a single repository
- **Merge outcomes** are grouped per repo, showing individual branch/status details

These features activate when multiple repositories are in scope. The same repo
filter applies to both **Backlog** and **Live Batch**, so you can narrow cards
and task rows consistently without changing the underlying workspace scope.
For single-repo runs, the dashboard looks and behaves exactly as before — no
extra clutter.

The summary bar and footer always show global batch or backlog totals regardless
of any active repo filter.

---

## When to use dashboard vs terminal

Use dashboard when you want:

- cross-lane overview
- visual progress tracking
- quick health checks during long runs

Use terminal output when you want:

- command interactions (`/orch-*`, `/task-*`)
- focused debugging of one lane/session

They complement each other.

---

## Troubleshooting

### Dashboard doesn’t open

Open manually in browser:

- `http://localhost:8099` (or chosen port)

### No live updates

Check that `.pi/` state files are changing during batch execution.

### Port already in use

Run with another port:

```bash
taskplane dashboard --port 3010
```

---

## Next step

- [Pause, Resume, or Abort a Batch](../how-to/pause-resume-abort-a-batch.md)
