# Taskplane Operator Console v1 View Models

## Status

Draft for TP-181.

## Purpose

Define the derived data shapes that Operator Console v1 needs in order to render backlog, task detail, batch summary, approvals, and recommended actions on top of Taskplane’s file-backed runtime.

These are **UI-facing view models**, not new canonical storage schemas. Each model should be reproducible from Taskplane files, runtime artifacts, and future planning files where present.

## Modeling Rules

1. **Source of truth stays outside the UI.** These shapes are projections over packet files, batch state, run history, approvals, and artifacts.
2. **Fields should tolerate partial data.** If the current backend cannot provide a field yet, the model should allow `unknown`, `null`, or a fallback summary rather than inventing a nonexistent API.
3. **Scope must be explicit.** Each model identifies whether it is workspace-, batch-, task-, or approval-subject-scoped.
4. **Actionability is separate from status.** “What happened?” and “what should I do next?” should be represented as related but distinct fields.
5. **Evidence should stay nearby.** Any action affordance should include the minimum context needed for a safe operator decision.

## Common Reference Shapes

## Display status
A UI-friendly status projection used across views.

```ts
interface DisplayStatus {
  key:
    | "ready"
    | "blocked"
    | "running"
    | "waiting"
    | "needs-approval"
    | "succeeded"
    | "failed"
    | "stalled"
    | "skipped"
    | "unknown";
  label: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  reason?: string | null;
  source: string[]; // e.g. ["STATUS.md", "batch-state", "approval"]
}
```

## Linked reference
Used for reusable links to related entities.

```ts
interface LinkedReference {
  kind: "idea" | "spec" | "initiative" | "task" | "batch" | "run" | "approval" | "artifact";
  id: string;
  label: string;
  href?: string | null;
  exists: boolean;
}
```

## Evidence summary
Compact evidence that can sit beside a status or action.

```ts
interface EvidenceSummary {
  summary: string;
  updatedAt?: string | null;
  references: LinkedReference[];
}
```

## Backlog View Model

**Scope:** workspace-scoped list with optional repo filtering.

Backlog is the operator’s daily home view, so its model must balance quick scanning with enough evidence to justify the next action.

### Backlog collection

```ts
interface BacklogViewModel {
  scope: {
    workspaceId: string;
    repoId?: string | null;
    filters: {
      repoId?: string | null;
      status?: string[];
      ownerView?: "all" | "ready" | "attention" | "running";
      textQuery?: string | null;
    };
  };
  summary: {
    total: number;
    ready: number;
    blocked: number;
    running: number;
    needsApproval: number;
    recentlyCompleted: number;
  };
  groups: BacklogGroup[];
  recommendedAction?: RecommendedAction | null;
  state: ViewLoadState;
}

interface BacklogGroup {
  key: "recommended" | "ready" | "attention" | "blocked" | "running" | "completed";
  label: string;
  count: number;
  items: BacklogItem[];
}
```

### Backlog row/card shape

```ts
interface BacklogItem {
  taskId: string;
  title: string;
  summary?: string | null;
  areaLabel?: string | null;
  repoId?: string | null;
  packetPath?: string | null;
  status: DisplayStatus;
  readiness: {
    isReady: boolean;
    blockedBy: LinkedReference[];
    waitingOn?: string | null; // e.g. approval, dependency, active batch
  };
  currentContext: {
    batch?: LinkedReference | null;
    run?: LinkedReference | null;
    laneLabel?: string | null;
    lastActivityAt?: string | null;
    lastActivitySummary?: string | null;
  };
  planningContext: {
    idea?: LinkedReference | null;
    spec?: LinkedReference | null;
    initiative?: LinkedReference | null;
  };
  counts: {
    dependencyCount?: number | null;
    reviewCount?: number | null;
    artifactCount?: number | null;
  };
  nextAction?: RecommendedAction | null;
  affordances: TaskAffordance[];
}
```

### Minimum backlog requirements

- Row/card must support compact list rendering and richer card rendering.
- Status must explain **why** an item is blocked, waiting, or recommended.
- A task already in an active batch should remain visible with a running/in-batch cue instead of disappearing from the backlog.
- If planning artifacts do not exist yet, `planningContext` is optional rather than required.

## Task Detail View Model

**Scope:** task-scoped detail surfaced from any parent view.

Task detail needs to assemble the task packet, runtime context, history, approvals, and evidence into one inspectable object.

```ts
interface TaskDetailViewModel {
  scope: {
    workspaceId: string;
    repoId?: string | null;
    taskId: string;
    parentView?: "backlog" | "live-batch" | "approvals" | "history" | "message";
  };
  header: {
    taskId: string;
    title: string;
    summary?: string | null;
    status: DisplayStatus;
    repoId?: string | null;
    areaLabel?: string | null;
  };
  packet: {
    promptPath?: string | null;
    statusPath?: string | null;
    taskFolderPath?: string | null;
    checklist: {
      checked?: number | null;
      total?: number | null;
      currentStep?: string | null;
      iteration?: number | null;
      reviewCount?: number | null;
    };
  };
  readiness: {
    isReady: boolean;
    blockers: LinkedReference[];
    missingPrerequisites: string[];
    explanation: string;
  };
  activeContext: {
    batch?: LinkedReference | null;
    run?: LinkedReference | null;
    lane?: {
      laneNumber?: number | null;
      sessionId?: string | null;
      branch?: string | null;
    } | null;
    activeSegmentLabel?: string | null;
    telemetry?: RuntimeTelemetrySummary | null;
  };
  latestOutcome: {
    result?: DisplayStatus | null;
    finishedAt?: string | null;
    exitReason?: string | null;
    summary?: string | null;
  };
  approvals: ApprovalSummary[];
  artifacts: ArtifactSummary[];
  related: {
    dependencies: LinkedReference[];
    dependents: LinkedReference[];
    planningContext: LinkedReference[];
    batches: LinkedReference[];
    runs: LinkedReference[];
  };
  recommendedAction?: RecommendedAction | null;
  affordances: TaskAffordance[];
  state: ViewLoadState;
}
```

### Supporting shapes

```ts
interface RuntimeTelemetrySummary {
  elapsedLabel?: string | null;
  toolsUsed?: number | null;
  contextPct?: number | null;
  tokenSummary?: string | null;
  costUsd?: number | null;
  lastTool?: string | null;
}

interface ApprovalSummary {
  approvalId: string;
  subjectType: "task" | "run" | "batch" | "integrate";
  status: DisplayStatus;
  requestedAt?: string | null;
  requestedBy?: string | null;
  summary: string;
  evidence: EvidenceSummary;
}

interface ArtifactSummary {
  label: string;
  kind: "prompt" | "status" | "review" | "log" | "diff" | "summary" | "other";
  path?: string | null;
  updatedAt?: string | null;
  preview?: string | null;
}
```

### Minimum task detail requirements

- Must show both canonical paths and operator-friendly summaries.
- Must keep drill-ins to STATUS/conversation/history evidence close to the header and active context.
- Must allow partial rendering if only packet metadata is available and live batch data is absent.
- Must expose blockers and dependents clearly enough for skip/retry/integrate decisions.

## Batch Summary and Recommended Action Models

**Scope:** batch-scoped summary used in Live Batch and History; action model reused in Backlog, Task Detail, and Approvals.

The prompt requires a batch summary / “next recommended action” shape. These should be separated so follow-on UI can render a status summary independently from action prompts.

### Batch summary

```ts
interface BatchSummaryViewModel {
  scope: {
    workspaceId: string;
    batchId: string;
    repoId?: string | null;
    mode: "live" | "history";
  };
  identity: {
    batchId: string;
    phase: string;
    startedAt?: string | null;
    updatedAt?: string | null;
    endedAt?: string | null;
  };
  progress: {
    overallPct?: number | null;
    taskCounts: {
      total: number;
      pending: number;
      running: number;
      succeeded: number;
      failed: number;
      stalled: number;
      skipped?: number | null;
    };
    currentWave?: number | null;
    totalWaves?: number | null;
  };
  runtimeHealth: {
    supervisorStatus?: string | null;
    liveLaneCount?: number | null;
    failedLaneCount?: number | null;
    pendingApprovals?: number | null;
    activeWarnings: string[];
  };
  telemetry: {
    totalTokensLabel?: string | null;
    totalCostUsd?: number | null;
    elapsedLabel?: string | null;
  };
  highlights: EvidenceSummary[];
  recommendedAction?: RecommendedAction | null;
}
```

### Recommended action

```ts
interface RecommendedAction {
  key:
    | "start-batch"
    | "inspect-task"
    | "approve"
    | "retry-task"
    | "skip-task"
    | "integrate"
    | "review-history"
    | "wait"
    | "none";
  label: string;
  priority: "low" | "medium" | "high";
  reason: string;
  subject?: LinkedReference | null;
  prerequisites?: string[];
  evidence: EvidenceSummary;
  enabled: boolean;
  disabledReason?: string | null;
  commandBacking?: string | null; // explicit mapping to existing Taskplane capability when known
}
```

### Requirements for recommended actions

- Must distinguish **informational recommendation** from an immediately executable control.
- Must include the minimum evidence needed to justify the action nearby.
- Must surface `enabled: false` with a reason when the UI cannot safely invoke the action yet.
- Must not imply a backend mutation path that does not exist.

## Approval and Action Affordance Models

**Scope:** approval-subject scoped, reused in task detail and approvals inbox.

```ts
interface ApprovalInboxViewModel {
  scope: {
    workspaceId: string;
    repoId?: string | null;
    filters: {
      status?: string[];
      subjectType?: string[];
    };
  };
  summary: {
    pending: number;
    approvedRecently: number;
    rejectedRecently: number;
  };
  items: ApprovalInboxItem[];
  state: ViewLoadState;
}

interface ApprovalInboxItem {
  approvalId: string;
  subject: LinkedReference;
  subjectType: "task" | "run" | "batch" | "integrate";
  status: DisplayStatus;
  requestedAt?: string | null;
  channel?: string | null;
  summary: string;
  evidence: EvidenceSummary;
  affordances: TaskAffordance[];
}
```

### Action affordance shape

```ts
interface TaskAffordance {
  key:
    | "open-task"
    | "open-batch"
    | "open-status"
    | "open-conversation"
    | "start-batch"
    | "approve"
    | "reject"
    | "retry"
    | "skip"
    | "integrate";
  label: string;
  style: "primary" | "secondary" | "danger" | "link";
  enabled: boolean;
  disabledReason?: string | null;
  requiresConfirmation: boolean;
  commandBacking?: string | null;
  evidenceHint?: string | null;
}
```

### Minimum affordance requirements

- Every destructive or high-impact action must declare whether confirmation is required.
- `commandBacking` must be omitted or marked unknown when no real Taskplane command/path is available yet.
- `evidenceHint` should tell the operator what to inspect before acting.
- Approvals inbox and task detail should share the same affordance model so guardrails stay consistent.

## Empty / Loading / Error State Variants

The prompt explicitly requires empty/loading/error states. These are part of the view model, not just presentation copy, because the console will often operate over partial or evolving file-backed data.

```ts
interface ViewLoadState {
  kind: "ready" | "loading" | "empty" | "partial" | "error";
  title?: string | null;
  message?: string | null;
  retryable?: boolean;
  blocking?: boolean;
  missingData?: string[];
  suggestedNextStep?: string | null;
}
```

### Backlog state variants
- **loading:** scanning task packets or refreshing workspace projections
- **empty:** no discovered task packets in scope
- **partial:** packet list loaded but planning links, approvals, or history summaries unavailable
- **error:** workspace discovery or parsing failed

### Task detail state variants
- **loading:** opening the task and assembling related batch/run/artifact context
- **empty:** requested task ID no longer exists in scope
- **partial:** task packet exists but active batch/history/approval context is missing or stale
- **error:** packet files could not be read or parsed

### Approval/action state variants
- **loading:** approval inbox or subject evidence still resolving
- **empty:** no items require attention in the current scope
- **partial:** approval subject found but supporting evidence is incomplete
- **error:** approval data source unavailable or unsupported in the current runtime

### Batch summary state variants
- **loading:** live stream connected but initial batch snapshot incomplete
- **empty:** no active batch in current workspace and no history selected
- **partial:** batch exists but some lane, telemetry, or supervisor sections are unavailable
- **error:** state stream failed or selected history entry could not be loaded

## Partial Data and Compatibility Rules

Because v1 must fit the current dashboard architecture, the models should support staged rollout:

1. **Backlog can launch with packet-derived fields first** and add planning references later.
2. **Task detail can degrade to packet + STATUS + latest batch context** before richer approvals/history linking exists.
3. **Approvals can begin as a thin projection** over existing runtime approval evidence and mailbox events.
4. **Recommended actions can render disabled** when command wiring is not yet implemented.
5. **History can reuse existing batch summary data** before task-to-detail deep linking is complete.

## Implementation Notes for Follow-on Tasks

- The current dashboard already exposes enough runtime material to populate large portions of `BatchSummaryViewModel`, `RuntimeTelemetrySummary`, and evidence-driven affordances.
- New backlog and task-detail work should avoid inventing server-owned mutable state; instead, derive from packet folders, STATUS metadata, dependencies, reviews, history, and runtime snapshots.
- Future planning files should plug into `LinkedReference` and `planningContext` fields rather than creating separate ad hoc UI-only shapes.