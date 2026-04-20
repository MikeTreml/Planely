#!/usr/bin/env node
/**
 * Orchestrator Web Dashboard — Local HTTP server with SSE live updates.
 *
 * Reads .pi/batch-state.json + STATUS.md files and streams state to the
 * browser via Server-Sent Events. Zero external dependencies.
 *
 * Usage:
 *   node dashboard/server.cjs [--port 8099] [--root /path/to/project]
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec, execFile } = require("child_process");
const { tmpdir, homedir } = require("os");
// url module not needed — we parse with new URL() below

// ─── Configuration ──────────────────────────────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, "public");
const DEFAULT_PORT = 8100;
const MAX_PORT_ATTEMPTS = 20;
const POLL_INTERVAL = 2000; // ms between state checks

// REPO_ROOT is resolved after parseArgs() — see initialization below.
// In workspace mode, REPO_ROOT is the workspace root (passed via --root).
// Runtime sidecar state (batch-state, lane-state, conversation logs,
// batch-history) still lives at <REPO_ROOT>/.pi/ and does NOT move with the
// workspace pointer. Config-backed backlog discovery, however, does follow the
// pointer-aware config resolution chain so task areas come from the canonical
// project config location.
let REPO_ROOT;
let BATCH_STATE_PATH;
let BATCH_HISTORY_PATH;
let SELECTED_PROJECT_ID = null;
let SELECTED_PROJECT_ROOT = null;

function getActiveProjectRoot() {
  return SELECTED_PROJECT_ROOT || REPO_ROOT;
}

function batchStatePathForRoot(root) {
  return path.join(root, ".pi", "batch-state.json");
}

function batchHistoryPathForRoot(root) {
  return path.join(root, ".pi", "batch-history.json");
}

function dashboardPreferencesPathForRoot(root) {
  return path.join(root, ".pi", "dashboard-preferences.json");
}

function userProjectRegistryPath() {
  return path.join(homedir(), ".pi", "agent", "taskplane", "project-registry.json");
}

// ─── CLI Args ───────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { port: DEFAULT_PORT, open: true, root: "" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--port" && args[i + 1]) {
      opts.port = parseInt(args[i + 1]) || DEFAULT_PORT;
      i++;
    } else if (args[i] === "--root" && args[i + 1]) {
      opts.root = args[i + 1];
      i++;
    } else if (args[i] === "--no-open") {
      opts.open = false;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Orchestrator Web Dashboard

Usage:
  node dashboard/server.cjs [options]

Options:
  --port <number>   Port to listen on (default: ${DEFAULT_PORT})
  --root <path>     Project root directory (default: current directory)
  --no-open         Don't auto-open browser
  -h, --help        Show this help
`);
      process.exit(0);
    }
  }
  return opts;
}

// ─── Data Loading (ported from orch-dashboard.cjs) ──────────────────────────

function normalizeBatchStateIngress(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.lanes)) {
    return state;
  }

  for (const lane of state.lanes) {
    if (!lane || typeof lane !== "object") continue;
    // Legacy compatibility: older persisted states stored lane session IDs under
    // `tmuxSessionName`. Normalize to `laneSessionId` at ingress and drop legacy key.
    const laneSessionId = typeof lane.laneSessionId === "string"
      ? lane.laneSessionId
      : (typeof lane.tmuxSessionName === "string" ? lane.tmuxSessionName : undefined);
    if (laneSessionId) {
      lane.laneSessionId = laneSessionId;
    }
    if ("tmuxSessionName" in lane) {
      delete lane.tmuxSessionName;
    }
  }

  return state;
}

function loadBatchState(root = getActiveProjectRoot()) {
  try {
    const raw = fs.readFileSync(batchStatePathForRoot(root), "utf-8");
    return normalizeBatchStateIngress(JSON.parse(raw));
  } catch {
    return null;
  }
}

function resolveTaskFolder(task, state, root = getActiveProjectRoot()) {
  if (!task || !task.taskFolder) return null;
  const laneNum = task.laneNumber;
  const lane = (state?.lanes || []).find((l) => l.laneNumber === laneNum);
  if (!lane || !lane.worktreePath) return task.taskFolder;

  // In workspace mode, the worktree is inside a specific repo, not the workspace root.
  // The task folder path needs to be made relative to the repo root (parent of the worktree),
  // not the workspace root. Detect this by finding the repo root from the worktree path.
  const taskFolderAbs = path.resolve(task.taskFolder);
  const worktreeAbs = path.resolve(lane.worktreePath);

  // Try to find the repo root: walk up from the worktree path looking for which
  // ancestor is a prefix of the task folder. The worktree is at <repoRoot>/.worktrees/<name>
  // or a sibling, so the repo root is typically 2 levels up from a subdirectory worktree.
  // Heuristic: find the longest common ancestor between taskFolder and worktree's repo root.
  const repoRootAbs = path.resolve(root);

  // First try: relative to workspace root (works in repo mode where workspace = repo)
  let rel = path.relative(repoRootAbs, taskFolderAbs);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return task.taskFolder;

  // Check if joining with worktree produces a valid path
  const candidate = path.join(worktreeAbs, rel);
  try {
    if (fs.existsSync(candidate)) return candidate;
  } catch { /* fall through */ }

  // Second try: the worktree is inside a repo subdirectory of the workspace root.
  // Strip the repo prefix from the task folder path to get the repo-relative path.
  // e.g., taskFolder = "workspace/platform-docs/task-mgmt/DOC-001/"
  //        worktree  = "workspace/platform-docs/.worktrees/wt-1/"
  //        repo-relative = "task-mgmt/DOC-001/"
  // Find the repo by checking which workspace repo path is a prefix of the task folder.
  const repoRoots = [];
  try {
    const stateMode = state.mode;
    if (stateMode === "workspace" && state.repos) {
      for (const r of state.repos) repoRoots.push(path.resolve(r.path));
    }
  } catch { /* no repo info in state */ }

  // Also try inferring repo root from worktree path pattern:
  // .worktrees/<name> → parent is repo root; sibling worktrees → shared parent
  const worktreeParent = path.dirname(worktreeAbs);
  const worktreeGrandparent = path.dirname(worktreeParent);
  for (const possibleRepoRoot of [worktreeGrandparent, ...repoRoots]) {
    const repoRel = path.relative(possibleRepoRoot, taskFolderAbs);
    if (repoRel && !repoRel.startsWith("..") && !path.isAbsolute(repoRel)) {
      const repoCandidate = path.join(worktreeAbs, repoRel);
      try {
        if (fs.existsSync(repoCandidate)) return repoCandidate;
      } catch { continue; }
    }
  }

  // Fallback: return original task folder (might work if not in worktree)
  return task.taskFolder;
}

function extractMarkdownSection(content, heading) {
  if (!content || !heading) return "";
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|\\n---|\\n$)`, "m"));
  return match ? match[1].trim() : "";
}

function parseMarkdownBulletLines(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split("\n")
    .map((line) => line.match(/^\s*[-*+]\s+(.*)$/)?.[1]?.trim() || "")
    .filter(Boolean);
}

function parseStatusExecutionLog(content) {
  const executionSection = extractMarkdownSection(content, "Execution Log");
  if (!executionSection) return null;

  const lines = executionSection.split("\n").map((line) => line.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const parts = line.split("|").slice(1, -1).map((part) => part.trim());
    if (parts.length < 3) continue;
    if (/^-+$/.test(parts[0].replace(/\s+/g, ""))) continue;
    if (parts[0] === "Timestamp" && parts[1] === "Action") continue;
    rows.push({ timestamp: parts[0], action: parts[1], outcome: parts[2] });
  }
  return rows.length > 0 ? rows[rows.length - 1] : null;
}

function parseStatusMd(taskFolder) {
  const candidates = [taskFolder];
  const taskId = path.basename(taskFolder);
  const archiveBase = taskFolder.replace(/[/\\]tasks[/\\][^/\\]+$/, "/tasks/archive/" + taskId);
  if (archiveBase !== taskFolder) candidates.push(archiveBase);

  for (const folder of candidates) {
    const statusPath = path.join(folder, "STATUS.md");
    try {
      const content = fs.readFileSync(statusPath, "utf-8");
      const stepMatch = content.match(/\*\*Current Step:\*\*\s*(.+)/);
      const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
      const iterMatch = content.match(/\*\*Iteration:\*\*\s*(\d+)/);
      const reviewMatch = content.match(/\*\*Review Counter:\*\*\s*(\d+)/);
      const reviewLevelMatch = content.match(/\*\*Review Level:\*\*\s*(\d+)/);
      const checked = (content.match(/- \[x\]/gi) || []).length;
      const unchecked = (content.match(/- \[ \]/g) || []).length;
      const total = checked + unchecked;
      let updatedAt = null;
      try {
        updatedAt = fs.statSync(statusPath).mtimeMs;
      } catch {
        updatedAt = null;
      }
      return {
        currentStep: stepMatch ? stepMatch[1].trim() : "Unknown",
        status: statusMatch ? statusMatch[1].trim() : "Unknown",
        iteration: iterMatch ? parseInt(iterMatch[1]) : 0,
        reviews: reviewMatch ? parseInt(reviewMatch[1]) : 0,
        reviewLevel: reviewLevelMatch ? parseInt(reviewLevelMatch[1]) : 0,
        checked,
        total,
        progress: total > 0 ? Math.round((checked / total) * 100) : 0,
        updatedAt,
        latestExecution: parseStatusExecutionLog(content),
      };
    } catch {
      continue;
    }
  }
  return null;
}

function getActiveSessions(root = getActiveProjectRoot()) {
  // Runtime V2: return active merger session names from the runtime registry
  // so the dashboard merge pane can display live telemetry for running agents.
  // Terminal statuses indicate the agent is no longer alive.
  const TERMINAL_STATUSES = new Set(["exited", "killed", "crashed", "timed_out"]);
  try {
    const state = loadBatchState(root);
    if (!state || !state.batchId) return [];
    const registry = loadRuntimeRegistry(state.batchId, root);
    if (!registry || !registry.agents) return [];
    return Object.values(registry.agents)
      .filter(a => a.role === "merger" && !TERMINAL_STATUSES.has(a.status))
      .map(a => a.agentId);
  } catch {
    return [];
  }
}

function checkDoneFile(taskFolder) {
  const candidates = [taskFolder];
  const taskId = path.basename(taskFolder);
  const archiveBase = taskFolder.replace(/[/\\]tasks[/\\][^/\\]+$/, "/tasks/archive/" + taskId);
  if (archiveBase !== taskFolder) candidates.push(archiveBase);
  for (const folder of candidates) {
    if (fs.existsSync(path.join(folder, ".DONE"))) return true;
  }
  return false;
}

/** Read lane state sidecar JSON files written by the task-runner. */
function loadLaneStates(root = getActiveProjectRoot()) {
  const piDir = path.join(root, ".pi");
  const states = {};
  try {
    const files = fs.readdirSync(piDir).filter(f => f.startsWith("lane-state-") && f.endsWith(".json"));
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(piDir, file), "utf-8").trim();
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (data.prefix) states[data.prefix] = data;
      } catch { continue; }
    }
  } catch { /* .pi dir may not exist */ }
  return states;
}

// ─── Telemetry JSONL Tailing ────────────────────────────────────────────────

/**
 * Module-level tail state for incremental JSONL reading.
 * Persists across poll ticks within this server process.
 * Key: absolute file path → { offset, partial }
 */
const telemetryTailStates = new Map();

/**
 * Module-level accumulated telemetry per session prefix.
 * Persists across poll ticks so incremental tail reads accumulate correctly.
 * Key: session prefix → { inputTokens, outputTokens, ... }
 */
const telemetryAccumulators = new Map();

/**
 * Tracks which files are currently contributing to each prefix.
 * Key: session prefix → Set of absolute file paths
 * Used to detect file rotation: when files change, accumulator is reset.
 */
const telemetryPrefixFiles = new Map();

/**
 * Parse a telemetry JSONL filename to extract lane number and role.
 * Pattern: {opId}-{batchId}-{repoId}[-{taskId}][-lane-{N}]-{role}.jsonl
 * Roles: worker, reviewer, merger
 * Returns { laneNumber: number|null, role: string, mergeNumber: number|null } or null if unparseable.
 */
function parseTelemetryFilename(filename) {
  // Remove .jsonl extension
  const base = filename.replace(/\.jsonl$/, "");
  // Role is always the last segment
  const lastDash = base.lastIndexOf("-");
  if (lastDash < 0) return null;
  const role = base.slice(lastDash + 1);
  if (role !== "worker" && role !== "reviewer" && role !== "merger") return null;

  // Extract lane number from -lane-{N}- pattern
  const laneMatch = base.match(/-lane-(\d+)-/);
  const laneNumber = laneMatch ? parseInt(laneMatch[1], 10) : null;

  // Extract merge number from -merge-{N}- pattern (merge agents)
  const mergeMatch = base.match(/-merge-(\d+)-/);
  const mergeNumber = mergeMatch ? parseInt(mergeMatch[1], 10) : null;

  return { laneNumber, role, mergeNumber };
}

/**
 * Incrementally read new bytes from a JSONL file, parse events, and return them.
 * Handles: file not yet created, empty reads, partial trailing lines, malformed JSON.
 * @param {string} filePath - Absolute path to the JSONL file
 * @returns {object[]} Array of parsed event objects from new data
 */
function tailJsonlFile(filePath) {
  // Get or create tail state for this file
  let tailState = telemetryTailStates.get(filePath);
  if (!tailState) {
    tailState = { offset: 0, partial: "" };
    telemetryTailStates.set(filePath, tailState);
  }

  // Check file size
  let fileSize;
  try {
    fileSize = fs.statSync(filePath).size;
  } catch {
    return []; // File doesn't exist yet
  }

  // Handle file truncation/recreation (offset beyond current size)
  if (fileSize < tailState.offset) {
    tailState.offset = 0;
    tailState.partial = "";
    tailState.wasReset = true; // Signal to caller that accumulator should be reset
  }

  if (fileSize <= tailState.offset) {
    return []; // No new data
  }

  // Cap read size per tick to avoid ERR_STRING_TOO_LONG on large files.
  // If there's more data remaining, the next SSE tick will pick up the rest.
  const MAX_TAIL_BYTES = 10 * 1024 * 1024; // 10 MB per tick

  // Skip-to-tail on fresh dashboard start with large files.
  // The partial-line handling below already discards the first partial line.
  if (tailState.offset === 0 && fileSize > MAX_TAIL_BYTES) {
    tailState.offset = fileSize - MAX_TAIL_BYTES;
  }

  // Read new bytes from offset, capped to MAX_TAIL_BYTES
  const bytesToRead = Math.min(fileSize - tailState.offset, MAX_TAIL_BYTES);
  const buf = Buffer.alloc(bytesToRead);
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
  } catch {
    return []; // File became inaccessible
  }
  try {
    fs.readSync(fd, buf, 0, bytesToRead, tailState.offset);
  } catch {
    fs.closeSync(fd);
    return []; // Read error — try again next tick
  }
  fs.closeSync(fd);
  tailState.offset += bytesToRead;

  // Split into lines, preserving partial trailing line
  const chunk = tailState.partial + buf.toString("utf-8");
  const lines = chunk.split("\n");
  tailState.partial = lines.pop() || "";

  const events = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const event = JSON.parse(trimmed);
      if (event && event.type) events.push(event);
    } catch {
      // Malformed JSON — skip (concurrent write race, truncated line)
    }
  }
  return events;
}

/**
 * Load and accumulate telemetry from .pi/telemetry/*.jsonl files.
 * Returns telemetry keyed by session prefix (e.g., "orch-lane-1").
 *
 * Uses batch-state lanes to map lane numbers → session prefixes.
 * For standalone /task mode (no lane number in filename), data is keyed as "standalone".
 *
 * @param {object|null} batchState - The batch state from batch-state.json
 * @returns {object} Map of sessionPrefix → accumulated telemetry
 */

// ── Runtime V2 Data Loaders (TP-107) ─────────────────────────────

/**
 * Load the Runtime V2 process registry for the current batch.
 * Returns null if no registry exists (legacy batch).
 */
function loadRuntimeRegistry(batchId, root = getActiveProjectRoot()) {
  if (!batchId) return null;
  const registryPath = path.join(root, ".pi", "runtime", batchId, "registry.json");
  try {
    if (!fs.existsSync(registryPath)) return null;
    return JSON.parse(fs.readFileSync(registryPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Load Runtime V2 lane snapshots for the current batch.
 * Returns a map of laneNumber → snapshot data.
 */
function loadRuntimeLaneSnapshots(batchId, root = getActiveProjectRoot()) {
  if (!batchId) return {};
  const lanesDir = path.join(root, ".pi", "runtime", batchId, "lanes");
  const snapshots = {};
  try {
    if (!fs.existsSync(lanesDir)) return snapshots;
    const files = fs.readdirSync(lanesDir).filter(f => f.startsWith("lane-") && f.endsWith(".json"));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(lanesDir, file), "utf-8"));
        if (data.laneNumber != null) snapshots[data.laneNumber] = data;
      } catch { continue; }
    }
  } catch { /* dir missing */ }
  return snapshots;
}

/**
 * Load Runtime V2 merge agent snapshots for the current batch.
 *
 * Reads all `merge-N.json` files from `.pi/runtime/{batchId}/lanes/`.
 * Returns a map of mergeNumber (string) → snapshot data.
 *
 * Follows the same pattern as {@link loadRuntimeLaneSnapshots}.
 *
 * @since TP-164
 */
function loadRuntimeMergeSnapshots(batchId, root = getActiveProjectRoot()) {
  if (!batchId) return {};
  const lanesDir = path.join(root, ".pi", "runtime", batchId, "lanes");
  const snapshots = {};
  try {
    if (!fs.existsSync(lanesDir)) return snapshots;
    const files = fs.readdirSync(lanesDir).filter(f => f.startsWith("merge-") && f.endsWith(".json"));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(lanesDir, file), "utf-8"));
        if (data.mergeNumber != null) snapshots[data.mergeNumber] = data;
      } catch { continue; }
    }
  } catch { /* dir missing */ }
  return snapshots;
}

/**
 * Load Runtime V2 agent events for a specific agent.
 * Returns the last N events from the agent's events.jsonl.
 */
function loadRuntimeAgentEvents(batchId, agentId, maxEvents, root = getActiveProjectRoot()) {
  if (!batchId || !agentId) return [];
  maxEvents = maxEvents || 200;
  const eventsPath = path.join(root, ".pi", "runtime", batchId, "agents", agentId, "events.jsonl");
  try {
    if (!fs.existsSync(eventsPath)) return [];
    const raw = fs.readFileSync(eventsPath, "utf-8");
    const lines = raw.split("\n").filter(l => l.trim());
    const events = [];
    const start = Math.max(0, lines.length - maxEvents);
    for (let i = start; i < lines.length; i++) {
      try { events.push(JSON.parse(lines[i])); } catch { continue; }
    }
    return events;
  } catch {
    return [];
  }
}

/**
 * Load mailbox message activity for the current batch.
 *
 * TP-093 hardening: event-authoritative model.
 * Primary source: .pi/mailbox/{batchId}/events.jsonl (audit event stream).
 * Fallback: directory scans (inbox/ack/outbox/outbox/processed) for
 * compatibility when events.jsonl is absent.
 *
 * Includes:
 * - Consumed replies (outbox/processed/) so they don't disappear after ack
 * - Per-recipient broadcast delivery state from ack markers
 * - Rate-limited events in the timeline
 */
function loadMailboxData(batchId, root = getActiveProjectRoot()) {
  if (!batchId) return { messages: [], agentIds: [], auditEvents: [] };
  const mbRoot = path.join(root, ".pi", "mailbox", batchId);
  if (!fs.existsSync(mbRoot)) return { messages: [], agentIds: [], auditEvents: [] };

  // ── Primary: events.jsonl audit trail ──
  const auditEvents = loadMailboxAuditEvents(mbRoot);

  // ── Fallback: directory scan ──
  const messages = [];
  const agentIds = [];

  try {
    const dirs = fs.readdirSync(mbRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agentDir of dirs) {
      if (agentDir === "_broadcast") continue;
      agentIds.push(agentDir);

      // Scan inbox (pending), ack (delivered), outbox (active replies), outbox/processed (consumed replies)
      for (const subdir of ["inbox", "ack", "outbox", "outbox/processed"]) {
        const dir = path.join(mbRoot, agentDir, subdir);
        if (!fs.existsSync(dir)) continue;
        try {
          const files = fs.readdirSync(dir).filter(f => f.endsWith(".msg.json"));
          for (const file of files) {
            try {
              const msg = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
              let status;
              if (subdir === "inbox") status = "pending";
              else if (subdir === "ack") status = "delivered";
              else if (subdir === "outbox") status = "reply";
              else status = "reply-acked"; // outbox/processed
              const isBroadcast = msg.to === "_broadcast";
              messages.push({ ...msg, _status: status, _agentDir: agentDir, _isBroadcast: isBroadcast });
            } catch { continue; }
          }
        } catch { continue; }
      }
    }

    // _broadcast: per-recipient delivery state
    const broadcastInbox = path.join(mbRoot, "_broadcast", "inbox");
    const broadcastAck = path.join(mbRoot, "_broadcast", "ack");
    for (const [dir, status] of [[broadcastInbox, "pending"], [broadcastAck, "delivered"]]) {
      if (!fs.existsSync(dir)) continue;
      try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith(".msg.json"));
        for (const file of files) {
          try {
            const msg = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
            messages.push({ ...msg, _status: status, _agentDir: "_broadcast", _isBroadcast: true });
          } catch { continue; }
        }
      } catch { continue; }
    }
  } catch { /* mailbox dir issues */ }

  messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  return { messages, agentIds, auditEvents };
}

/**
 * Load mailbox audit events from events.jsonl.
 * Returns events sorted by timestamp. Includes: message_sent, message_delivered,
 * message_replied, message_escalated, message_rate_limited.
 */
function loadMailboxAuditEvents(mbRoot) {
  const eventsPath = path.join(mbRoot, "events.jsonl");
  if (!fs.existsSync(eventsPath)) return [];
  try {
    const raw = fs.readFileSync(eventsPath, "utf-8");
    const events = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try { events.push(JSON.parse(line)); } catch { continue; }
    }
    return events;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
function loadTelemetryData(batchState, root = getActiveProjectRoot()) {
  const telemetryDir = path.join(root, ".pi", "telemetry");
  const result = {};

  // Build lane number → session prefix mapping from batch state
  const laneToPrefix = {};
  if (batchState && batchState.lanes) {
    for (const lane of batchState.lanes) {
      const laneSessionId = lane.laneSessionId;
      if (lane.laneNumber != null && laneSessionId) {
        laneToPrefix[lane.laneNumber] = laneSessionId;
      }
    }
  }

  // Scan telemetry directory for JSONL files
  let files;
  try {
    files = fs.readdirSync(telemetryDir).filter(f => f.endsWith(".jsonl"));
  } catch {
    // .pi/telemetry/ may not exist (pre-RPC sessions) — degrade gracefully
    return result;
  }

  // Track which files still exist for tail-state cleanup
  const currentFiles = new Set();
  // Track current file→prefix mapping to detect file rotation
  const currentPrefixFiles = new Map(); // prefix → Set<filePath>

  for (const file of files) {
    const filePath = path.join(telemetryDir, file);
    currentFiles.add(filePath);

    // Parse filename to get lane number and role
    const parsed = parseTelemetryFilename(file);
    if (!parsed) continue;

    // Determine the key (session prefix)
    let prefix;
    if (parsed.role === "merger") {
      // Merge agent — derive prefix from lane naming so it matches the
      // session ID used by the client (e.g. "orch-henrylach-merge-1").
      // Lane sessions: "orch-{opId}-lane-{N}" → merge sessions: "orch-{opId}-merge-{N}".
      const firstLanePrefix = Object.values(laneToPrefix)[0]; // e.g. "orch-henrylach-lane-1"
      const opPrefix = firstLanePrefix?.replace(/-lane-\d+$/, ""); // "orch-henrylach"
      if (parsed.mergeNumber != null && opPrefix) {
        prefix = `${opPrefix}-merge-${parsed.mergeNumber}`;
      } else if (parsed.mergeNumber != null) {
        prefix = `orch-merge-${parsed.mergeNumber}`;
      } else {
        prefix = "orch-merge";
      }
    } else if (parsed.laneNumber != null && laneToPrefix[parsed.laneNumber]) {
      prefix = laneToPrefix[parsed.laneNumber];
    } else if (parsed.laneNumber != null) {
      // Lane number found but no batch-state mapping — use heuristic
      prefix = `orch-lane-${parsed.laneNumber}`;
    } else {
      // Standalone /task mode
      prefix = "standalone";
    }

    // Track file→prefix mapping
    if (!currentPrefixFiles.has(prefix)) currentPrefixFiles.set(prefix, new Set());
    currentPrefixFiles.get(prefix).add(filePath);

    // Check if file set for this prefix has changed (file rotation)
    const prevFiles = telemetryPrefixFiles.get(prefix);
    const isNewFile = !prevFiles || !prevFiles.has(filePath);

    // Initialize persistent accumulator for this prefix if needed,
    // or reset if files changed (new file appeared for same prefix)
    if (!telemetryAccumulators.has(prefix) || (isNewFile && !telemetryTailStates.has(filePath))) {
      const fresh = {
        inputTokens: 0, outputTokens: 0, cacheReadTokens: 0,
        cacheWriteTokens: 0, cost: 0, toolCalls: 0,
        lastTool: "", currentTool: "", retries: 0, retryActive: false,
        lastRetryError: "", compactions: 0, latestTotalTokens: 0,
        contextPct: 0, startedAt: 0,
      };
      telemetryAccumulators.set(prefix, fresh);
      // Also reset tail states for ALL files of this prefix to re-read from beginning
      if (prevFiles) {
        for (const pf of prevFiles) {
          telemetryTailStates.delete(pf);
        }
      }
    }

    const acc = telemetryAccumulators.get(prefix);
    result[prefix] = acc; // expose the persistent accumulator in the result

    // Tail the file for new events
    const events = tailJsonlFile(filePath);

    // Check if file was truncated — reset accumulator
    const ts = telemetryTailStates.get(filePath);
    if (ts && ts.wasReset) {
      acc.inputTokens = 0; acc.outputTokens = 0; acc.cacheReadTokens = 0;
      acc.cacheWriteTokens = 0; acc.cost = 0; acc.toolCalls = 0;
      acc.lastTool = ""; acc.currentTool = ""; acc.retries = 0; acc.retryActive = false;
      acc.lastRetryError = ""; acc.compactions = 0; acc.latestTotalTokens = 0;
      acc.contextPct = 0; acc.startedAt = 0;
      ts.wasReset = false;
    }
    for (const event of events) {
      switch (event.type) {
        case "message_end": {
          // A successful message_end means any prior retry resolved.
          // Clear retryActive to prevent stale retry badges from persisting
          // across batches or after transient API errors recover.
          acc.retryActive = false;
          const usage = event.message?.usage;
          if (usage) {
            acc.inputTokens += usage.input || 0;
            acc.outputTokens += usage.output || 0;
            acc.cacheReadTokens += usage.cacheRead || 0;
            acc.cacheWriteTokens += usage.cacheWrite || 0;
            if (usage.cost) {
              acc.cost += typeof usage.cost === "object"
                ? (usage.cost.total || 0)
                : (typeof usage.cost === "number" ? usage.cost : 0);
            }
            // Include cacheRead: totalTokens from pi excludes cache reads,
            // but cached tokens still consume context window capacity.
            const rawTotal = usage.totalTokens
              || ((usage.input || 0) + (usage.output || 0));
            const totalTokens = rawTotal + (usage.cacheRead || 0);
            if (totalTokens > acc.latestTotalTokens) {
              acc.latestTotalTokens = totalTokens;
            }
          }
          break;
        }
        case "tool_execution_start": {
          acc.toolCalls++;
          const toolDesc = event.toolName || "unknown";
          let argPreview = "";
          if (event.args) {
            if (typeof event.args === "string") {
              argPreview = event.args.slice(0, 80);
            } else if (typeof event.args === "object") {
              const firstVal = Object.values(event.args)[0];
              if (typeof firstVal === "string") {
                argPreview = firstVal.slice(0, 80);
              }
            }
          }
          const toolLabel = argPreview ? `${toolDesc} ${argPreview}` : toolDesc;
          acc.lastTool = toolLabel;
          acc.currentTool = toolLabel;
          break;
        }
        case "tool_execution_end": {
          acc.currentTool = "";
          break;
        }
        case "agent_start": {
          if (event.ts && !acc.startedAt) {
            acc.startedAt = event.ts;
          }
          break;
        }
        case "response": {
          // Extract context usage from get_session_stats responses
          const ctxUsage = event.data?.contextUsage;
          if (ctxUsage) {
            // Support both percent (current) and percentUsed (legacy pi versions)
            const pct = typeof ctxUsage.percent === "number" ? ctxUsage.percent
              : typeof ctxUsage.percentUsed === "number" ? ctxUsage.percentUsed
              : null;
            if (pct !== null) acc.contextPct = pct;
          }
          break;
        }
        case "auto_retry_start": {
          acc.retries++;
          acc.retryActive = true;
          acc.lastRetryError = event.errorMessage || event.error || "unknown";
          break;
        }
        case "auto_retry_end": {
          acc.retryActive = false;
          break;
        }
        case "auto_compaction_start": {
          acc.compactions++;
          break;
        }
      }
    }
  }

  // Clean up tail states for files that no longer exist
  for (const [filePath] of telemetryTailStates) {
    if (filePath.startsWith(telemetryDir) && !currentFiles.has(filePath)) {
      telemetryTailStates.delete(filePath);
    }
  }

  // Update prefix→files tracking for next call
  // Clean up accumulators and tracking for prefixes that have no remaining files
  const activePrefixes = new Set(Object.keys(result));
  for (const [prefix] of telemetryAccumulators) {
    if (!activePrefixes.has(prefix)) {
      telemetryAccumulators.delete(prefix);
      telemetryPrefixFiles.delete(prefix);
    }
  }
  // Store current file mappings for next call's rotation detection
  for (const [prefix, fileSet] of currentPrefixFiles) {
    telemetryPrefixFiles.set(prefix, fileSet);
  }

  return result;
}

// ─── Supervisor Data Loading ────────────────────────────────────────────────

/**
 * Module-level tail state for supervisor JSONL files (actions.jsonl, events.jsonl).
 * Reuses the same incremental tailing pattern as telemetry.
 * Key: absolute file path → { offset, partial, entries }
 */
const supervisorTailStates = {
  actions: { offset: 0, partial: "", entries: [] },
  events: { offset: 0, partial: "", entries: [] },
  conversation: { offset: 0, partial: "", entries: [] },
};

/**
 * The last known batchId — used to detect batch changes and reset accumulators.
 */
let supervisorLastBatchId = "";

/**
 * Incrementally tail a JSONL file, accumulating parsed entries.
 * Filters entries by batchId when provided.
 *
 * @param {string} filePath - Absolute path to the JSONL file
 * @param {object} tailState - Mutable tail state { offset, partial, entries }
 * @param {string} batchId - Batch ID to filter by (empty = no filter)
 * @returns {object[]} The accumulated entries array (same reference as tailState.entries)
 */
function tailSupervisorJsonl(filePath, tailState, batchId) {
  // Check file size
  let fileSize;
  try {
    fileSize = fs.statSync(filePath).size;
  } catch {
    return tailState.entries; // File doesn't exist yet — return accumulated
  }

  // Handle file truncation/recreation
  if (fileSize < tailState.offset) {
    tailState.offset = 0;
    tailState.partial = "";
    tailState.entries = [];
  }

  if (fileSize <= tailState.offset) {
    return tailState.entries; // No new data
  }

  // Read new bytes from offset
  const bytesToRead = fileSize - tailState.offset;
  const buf = Buffer.alloc(bytesToRead);
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
  } catch {
    return tailState.entries;
  }
  try {
    fs.readSync(fd, buf, 0, bytesToRead, tailState.offset);
  } catch {
    fs.closeSync(fd);
    return tailState.entries;
  }
  fs.closeSync(fd);
  tailState.offset = fileSize;

  // Split into lines, preserving partial trailing line
  const chunk = tailState.partial + buf.toString("utf-8");
  const lines = chunk.split("\n");
  tailState.partial = lines.pop() || "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const entry = JSON.parse(trimmed);
      // Filter by batchId if provided
      if (batchId && entry.batchId && entry.batchId !== batchId) continue;
      tailState.entries.push(entry);
    } catch {
      // Malformed JSON — skip
    }
  }

  // Cap accumulated entries to prevent unbounded growth (keep last 500)
  if (tailState.entries.length > 500) {
    tailState.entries = tailState.entries.slice(-500);
  }

  return tailState.entries;
}

/**
 * Read supervisor autonomy level from project config.
 *
 * Checks `.pi/taskplane-config.json` for `orchestrator.supervisor.autonomy`.
 * Falls back to "supervised" (the default) if config is missing or malformed.
 * This is needed because the lockfile does not contain the autonomy level.
 *
 * @returns {string} Autonomy level: "interactive" | "supervised" | "autonomous"
 */
function loadSupervisorAutonomy(root = getActiveProjectRoot()) {
  try {
    const configPath = path.join(root, ".pi", "taskplane-config.json");
    const raw = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw);
    const autonomy = config?.orchestrator?.supervisor?.autonomy;
    if (autonomy === "interactive" || autonomy === "supervised" || autonomy === "autonomous") {
      return autonomy;
    }
  } catch {
    // Config missing or malformed — use default
  }
  return "supervised"; // Default per DEFAULT_SUPERVISOR_CONFIG
}

/**
 * Load supervisor data for the dashboard.
 *
 * Reads (all from .pi/supervisor/):
 * - lock.json: supervisor active/stale status, heartbeat, autonomy (from config)
 * - actions.jsonl: recovery action audit trail (batch-scoped, incremental)
 * - events.jsonl: engine + tier 0 events (batch-scoped, incremental)
 * - conversation.jsonl: operator ↔ supervisor interaction log (spec §9.1)
 * - summary.md: human-readable batch summary (generated on completion)
 *
 * Returns null when no supervisor files exist (pre-supervisor batches).
 *
 * @param {object|null} batchState - The batch state from batch-state.json
 * @returns {object|null} Supervisor data object or null
 */
function loadSupervisorData(batchState, root = getActiveProjectRoot()) {
  const supervisorDir = path.join(root, ".pi", "supervisor");
  const batchId = batchState ? (batchState.batchId || "") : "";

  // Detect batch change — reset tail state accumulators
  if (batchId && batchId !== supervisorLastBatchId) {
    supervisorLastBatchId = batchId;
    supervisorTailStates.actions = { offset: 0, partial: "", entries: [] };
    supervisorTailStates.events = { offset: 0, partial: "", entries: [] };
    supervisorTailStates.conversation = { offset: 0, partial: "", entries: [] };
  }

  // ── Lockfile: supervisor status ──
  // The lockfile contains pid, sessionId, batchId, startedAt, heartbeat.
  // It does NOT contain autonomy — that comes from project config.
  let lock = null;
  try {
    const lockPath = path.join(supervisorDir, "lock.json");
    const raw = fs.readFileSync(lockPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && parsed.pid && parsed.sessionId) {
      // Determine if lock is stale (heartbeat older than 90s)
      const heartbeatAge = parsed.heartbeat
        ? Date.now() - new Date(parsed.heartbeat).getTime()
        : Infinity;
      const isStale = heartbeatAge > 90_000;

      lock = {
        active: !isStale,
        pid: parsed.pid,
        sessionId: parsed.sessionId,
        batchId: parsed.batchId || "",
        startedAt: parsed.startedAt || "",
        heartbeat: parsed.heartbeat || "",
        // Autonomy is NOT in the lockfile — derive from project config
        autonomy: loadSupervisorAutonomy(root),
      };
    }
  } catch {
    // No lockfile or malformed — supervisor is inactive
  }

  // ── Actions JSONL: recovery audit trail (batch-scoped, incremental) ──
  const actionsPath = path.join(supervisorDir, "actions.jsonl");
  const actions = tailSupervisorJsonl(actionsPath, supervisorTailStates.actions, batchId);

  // ── Events JSONL: engine events (batch-scoped, incremental) ──
  const eventsPath = path.join(supervisorDir, "events.jsonl");
  const events = tailSupervisorJsonl(eventsPath, supervisorTailStates.events, batchId);

  // ── Conversation JSONL: operator interaction log (spec §9.1) ──
  // The supervisor writes operator↔supervisor messages to conversation.jsonl.
  // Not yet implemented in all supervisor versions — degrade gracefully.
  const conversationPath = path.join(supervisorDir, "conversation.jsonl");
  const conversation = tailSupervisorJsonl(conversationPath, supervisorTailStates.conversation, batchId);

  // ── Summary: human-readable batch summary (generated on completion) ──
  // Per spec §9.1, the supervisor writes .pi/supervisor/summary.md when the
  // batch completes or is abandoned. Read the file if it exists.
  let summary = null;
  try {
    const summaryPath = path.join(supervisorDir, "summary.md");
    summary = fs.readFileSync(summaryPath, "utf-8");
  } catch {
    // No summary yet — batch may still be running, or pre-supervisor batch
  }

  // If nothing exists at all, return null (pre-supervisor batch)
  if (!lock && actions.length === 0 && events.length === 0 && conversation.length === 0 && !summary) {
    // Check if the supervisor directory even exists
    try {
      fs.statSync(supervisorDir);
    } catch {
      return null; // No supervisor dir → pre-supervisor batch
    }
  }

  return {
    lock,
    actions,
    events,
    conversation,
    summary,
  };
}

/**
 * Compute batch total cost from lane states (primary) and telemetry (supplementary).
 * Lane states are authoritative — telemetry provides additional data only for lanes
 * that have no lane-state entry (e.g., very early in session startup).
 */
function computeBatchTotalCost(laneStates, telemetry) {
  let totalCost = 0;
  const coveredPrefixes = new Set();

  // Primary: sum cost from lane states (worker + reviewer)
  for (const [prefix, ls] of Object.entries(laneStates)) {
    if (ls.workerCostUsd) {
      totalCost += ls.workerCostUsd;
      coveredPrefixes.add(prefix);
    }
    if (ls.reviewerCostUsd) {
      totalCost += ls.reviewerCostUsd;
    }
  }

  // Supplementary: add cost from telemetry for uncovered lanes only
  for (const [prefix, tel] of Object.entries(telemetry)) {
    if (!coveredPrefixes.has(prefix) && tel.cost > 0) {
      totalCost += tel.cost;
    }
  }

  return totalCost;
}

function synthesizeLaneStateFromSnapshot(key, snap, fallbackBatchId) {
  const w = snap.worker || {};
  const r = snap.reviewer || null;
  const statusMap = { running: "running", spawning: "running", exited: "done", crashed: "error", killed: "error", timed_out: "error", wrapping_up: "running" };
  const reviewerStatusMap = { running: "running", spawning: "running", wrapping_up: "running", exited: "done", crashed: "done", killed: "done", timed_out: "done" };

  return {
    prefix: key,
    taskId: snap.taskId || null,
    phase: snap.status === "running" ? "worker-active" : snap.status === "complete" ? "complete" : "idle",
    workerStatus: statusMap[w.status] || w.status || "idle",
    workerElapsed: w.elapsedMs || 0,
    workerContextPct: w.contextPct || 0,
    workerLastTool: w.lastTool || "",
    workerToolCount: w.toolCalls || 0,
    workerInputTokens: w.inputTokens || 0,
    workerOutputTokens: w.outputTokens || 0,
    workerCacheReadTokens: w.cacheReadTokens || 0,
    workerCacheWriteTokens: w.cacheWriteTokens || 0,
    workerCostUsd: w.costUsd || 0,
    reviewerStatus: r ? (reviewerStatusMap[r.status] || r.status || "running") : "idle",
    reviewerElapsed: r?.elapsedMs || 0,
    reviewerContextPct: r?.contextPct || 0,
    reviewerLastTool: r?.lastTool || "",
    reviewerToolCount: r?.toolCalls || 0,
    reviewerCostUsd: r?.costUsd || 0,
    reviewerInputTokens: r?.inputTokens || 0,
    reviewerOutputTokens: r?.outputTokens || 0,
    reviewerCacheReadTokens: r?.cacheReadTokens || 0,
    reviewerCacheWriteTokens: r?.cacheWriteTokens || 0,
    reviewerType: r?.reviewType || "",
    reviewerStep: r?.reviewStep || 0,
    batchId: snap.batchId || fallbackBatchId,
    timestamp: snap.updatedAt || Date.now(),
  };
}

/** Build full dashboard state object for the frontend. */
function buildDashboardState(root = getActiveProjectRoot()) {
  const state = loadBatchState(root);
  const sessions = getActiveSessions(root);
  const rawLaneStates = loadLaneStates(root);
  // Filter stale lane states from previous batches.
  // Lane state files persist across batches (same filename), so without
  // filtering the dashboard shows telemetry from old runs.
  const currentBatchId = state?.batchId || null;
  const laneStates = {};
  for (const [key, ls] of Object.entries(rawLaneStates)) {
    if (!currentBatchId || !ls.batchId || ls.batchId === currentBatchId) {
      laneStates[key] = ls;
    }
  }
  const telemetry = loadTelemetryData(state, root);
  const batchTotalCost = computeBatchTotalCost(laneStates, telemetry);
  const supervisor = loadSupervisorData(state, root);
  const history = loadHistory(root);
  const backlog = loadBacklogData(state, history, root);

  if (!state) {
    return {
      projectSidebar: buildProjectSidebar(root, null),
      currentProject: {
        id: SELECTED_PROJECT_ID,
        rootPath: root,
        name: projectDisplayNameFromRoot(root),
      },
      batch: null,
      sessions,
      tmuxSessions: sessions, // Legacy compatibility field for older dashboard clients
      laneStates: {},
      telemetry: {},
      batchTotalCost: 0,
      supervisor: null,
      backlog,
      batchActions: buildBatchActionContract(null),
      timestamp: Date.now(),
    };
  }

  const tasks = (state.tasks || []).map((task) => {
    const effectiveFolder = resolveTaskFolder(task, state, root);
    let statusData = null;
    if (effectiveFolder) {
      statusData = parseStatusMd(effectiveFolder);
    }
    if (!task.doneFileFound && effectiveFolder) {
      task.doneFileFound = checkDoneFile(effectiveFolder);
    }
    return { ...task, statusData };
  });

  // TP-107: Load Runtime V2 data when available
  const runtimeRegistry = loadRuntimeRegistry(state.batchId, root);
  const runtimeLaneSnapshots = loadRuntimeLaneSnapshots(state.batchId, root);
  const mailboxData = loadMailboxData(state.batchId, root);

  // TP-164: Load merge agent snapshots for live dashboard telemetry.
  const runtimeMergeSnapshots = loadRuntimeMergeSnapshots(state.batchId, root);

  // TP-164: Inject merge snapshot telemetry into the telemetry map so
  // `telemetry[sessionName]` resolves for the merge pane.
  // Snapshots are the PRIMARY source for merge telemetry — merge agents don't
  // write to .pi/telemetry/*.jsonl (the JSONL path is for lane workers only).
  // Inject snapshot data when no JSONL-backed entry exists for this session.
  for (const snap of Object.values(runtimeMergeSnapshots)) {
    const key = snap.sessionName;
    if (!key) continue;
    const agent = snap.agent;
    if (!agent) continue;
    // Only inject if there is no existing JSONL-backed telemetry entry.
    // Merge agents don't emit to .pi/telemetry/, so existing will always be
    // absent unless something else wrote to it — in that case defer to it.
    const existing = telemetry[key];
    if (!existing) {
      telemetry[key] = {
        inputTokens: agent.inputTokens || 0,
        outputTokens: agent.outputTokens || 0,
        cacheReadTokens: agent.cacheReadTokens || 0,
        cacheWriteTokens: agent.cacheWriteTokens || 0,
        cost: agent.costUsd || 0,
        toolCalls: agent.toolCalls || 0,
        lastTool: agent.lastTool || "",
        currentTool: snap.status === "running" ? (agent.lastTool || "") : "",
        contextPct: agent.contextPct || 0,
        // startedAt is not in the snapshot; compute from elapsed if possible.
        startedAt: agent.elapsedMs > 0 ? snap.updatedAt - agent.elapsedMs : snap.updatedAt,
        retries: 0,
        retryActive: false,
        lastRetryError: "",
        compactions: 0,
        latestTotalTokens: (agent.inputTokens || 0) + (agent.outputTokens || 0),
        _updatedAt: snap.updatedAt,
        _source: "merge-snapshot",
        // TP-178: Include waveIndex for precise wave-telemetry association (#498)
        waveIndex: snap.waveIndex != null ? snap.waveIndex : undefined,
      };
    }
  }

  // TP-115: Synthesize laneStates from V2 snapshots so the dashboard
  // pipeline works without legacy lane-state-*.json sidecar files.
  // V2 snapshots are authoritative when present.
  if (Object.keys(runtimeLaneSnapshots).length > 0) {
    for (const [laneNum, snap] of Object.entries(runtimeLaneSnapshots)) {
      // Find the matching lane record to get the session name key
      const laneRec = (state.lanes || []).find(l => l.laneNumber === Number(laneNum));
      const key = laneRec ? (laneRec.laneSessionId) : `lane-${laneNum}`;
      if (!laneStates[key] || (snap.updatedAt && snap.updatedAt > (laneStates[key].timestamp || 0))) {
        laneStates[key] = synthesizeLaneStateFromSnapshot(key, snap, state.batchId);
      }
    }
  }

  return {
    projectSidebar: buildProjectSidebar(root, { batch: { batchId: state.batchId, phase: state.phase, updatedAt: state.updatedAt } }),
    currentProject: {
      id: SELECTED_PROJECT_ID,
      rootPath: root,
      name: projectDisplayNameFromRoot(root),
    },
    laneStates,
    telemetry,
    batchTotalCost,
    supervisor,
    // Runtime V2 data (null/empty for legacy batches)
    runtimeRegistry,
    runtimeLaneSnapshots,
    // TP-164: Merge agent snapshots for live dashboard telemetry.
    runtimeMergeSnapshots,
    mailbox: mailboxData,
    backlog,
    batchActions: buildBatchActionContract(state),
    batch: {
      batchId: state.batchId,
      phase: state.phase,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
      currentWaveIndex: state.currentWaveIndex || 0,
      totalWaves: state.totalWaves || (state.wavePlan ? state.wavePlan.length : 0),
      wavePlan: state.wavePlan || [],
      // Lanes already include repoId (string|undefined) from PersistedLaneRecord (v2).
      lanes: state.lanes || [],
      // Tasks already include repoId, resolvedRepoId (string|undefined) from PersistedTaskRecord (v2).
      tasks,
      mergeResults: state.mergeResults || [],
      errors: state.errors || [],
      lastError: state.lastError || null,
      // Workspace mode: "repo" (default/v1) or "workspace" (v2 multi-repo).
      // Additive field — absent in v1 state files, frontend must default to "repo".
      mode: state.mode || "repo",
      // TP-148: Segment records for wave display context (v4+).
      // Each record has taskId, segmentId, repoId, status.
      segments: state.segments || [],
    },
    sessions,
    tmuxSessions: sessions, // Legacy compatibility field for older dashboard clients
    timestamp: Date.now(),
  };
}

// ─── Static File Serving ────────────────────────────────────────────────────

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function serveStatic(req, res) {
  let filePath = new URL(req.url, "http://localhost").pathname;
  if (filePath === "/") filePath = "/index.html";

  const fullPath = path.join(PUBLIC_DIR, filePath);
  // Prevent directory traversal
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(fullPath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
}

// ─── SSE Stream ─────────────────────────────────────────────────────────────

const sseClients = new Set();

// ─── Conversation JSONL ─────────────────────────────────────────────────

function serveConversation(req, res, prefix) {
  const activeRoot = getActiveProjectRoot();
  if (!/^[\w-]+$/.test(prefix)) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Invalid prefix");
    return;
  }

  const filePath = path.join(activeRoot, ".pi", `worker-conversation-${prefix}.jsonl`);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(content);
  } catch {
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(""); // empty — no conversation yet
  }
}

// ─── Dashboard SSE ──────────────────────────────────────────────────────

function handleSSE(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial state immediately
  const state = buildDashboardState();
  res.write(`data: ${JSON.stringify(state)}\n\n`);

  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
}

function broadcastState() {
  if (sseClients.size === 0) return;
  const state = buildDashboardState();
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// ─── Batch History API ──────────────────────────────────────────────────────

// BATCH_HISTORY_PATH is initialized in main() alongside REPO_ROOT.

function readDashboardJsonConfig(root) {
  if (!root) return null;
  const candidates = [
    path.join(root, ".pi", "taskplane-config.json"),
    path.join(root, "taskplane-config.json"),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      return JSON.parse(fs.readFileSync(candidate, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

function hasDashboardConfigFiles(root) {
  if (!root) return false;
  const jsonConfig = readDashboardJsonConfig(root);
  if (jsonConfig && (jsonConfig.taskRunner || jsonConfig.orchestrator)) {
    return true;
  }
  for (const fileName of ["task-runner.yaml", "task-orchestrator.yaml"]) {
    if (fs.existsSync(path.join(root, ".pi", fileName)) || fs.existsSync(path.join(root, fileName))) {
      return true;
    }
  }
  return false;
}

function parseWorkspaceReposYaml(raw, root = getActiveProjectRoot()) {
  const repos = {};
  const lines = String(raw || "").split(/\r?\n/);
  let inRepos = false;
  let reposIndent = 0;
  let currentRepo = null;
  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "    ");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.match(/^\s*/)?.[0]?.length || 0;

    if (!inRepos) {
      if (/^repos\s*:\s*$/.test(trimmed)) {
        inRepos = true;
        reposIndent = indent;
      }
      continue;
    }

    if (indent <= reposIndent) break;

    const repoMatch = line.match(/^\s{2,}([A-Za-z0-9._-]+)\s*:\s*$/);
    if (repoMatch && indent === reposIndent + 2) {
      currentRepo = repoMatch[1];
      repos[currentRepo] = {};
      continue;
    }

    if (!currentRepo) continue;
    const fieldMatch = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+?)\s*$/);
    if (!fieldMatch || indent < reposIndent + 4) continue;
    if (fieldMatch[1] !== "path") continue;
    const value = fieldMatch[2].trim().replace(/\s+#.*$/, "").replace(/^['"]|['"]$/g, "");
    if (!value) continue;
    repos[currentRepo].path = path.resolve(root, value);
  }
  return repos;
}

function loadDashboardWorkspaceRepos(root = getActiveProjectRoot()) {
  const repos = {};
  const workspaceJson = readDashboardJsonConfig(root);
  if (workspaceJson) {
    const rawJsonRepos = workspaceJson?.workspace?.repos;
    if (rawJsonRepos && typeof rawJsonRepos === "object") {
      for (const [repoId, repo] of Object.entries(rawJsonRepos)) {
        if (!repo || typeof repo !== "object") continue;
        if (typeof repo.path !== "string" || !repo.path.trim()) continue;
        repos[repoId] = { path: path.resolve(root, repo.path.trim()) };
      }
    }
    return repos;
  }

  const workspaceConfigCandidates = [
    path.join(root, ".pi", "taskplane-workspace.yaml"),
    path.join(root, "taskplane-workspace.yaml"),
  ];
  const workspaceConfigPath = workspaceConfigCandidates.find((candidate) => fs.existsSync(candidate));
  if (!workspaceConfigPath) return repos;
  try {
    const workspaceRaw = fs.readFileSync(workspaceConfigPath, "utf-8");
    return parseWorkspaceReposYaml(workspaceRaw, root);
  } catch {
    return repos;
  }
}

function resolveDashboardPointerConfigRoot(root = getActiveProjectRoot()) {
  const pointerPath = path.join(root, ".pi", "taskplane-pointer.json");
  if (!fs.existsSync(pointerPath)) return null;

  try {
    const repos = loadDashboardWorkspaceRepos(root);
    const pointer = JSON.parse(fs.readFileSync(pointerPath, "utf-8"));
    const repoId = typeof pointer?.config_repo === "string" ? pointer.config_repo.trim() : "";
    const configPath = typeof pointer?.config_path === "string" ? pointer.config_path.trim() : "";
    if (!repoId || !configPath) return null;
    if (path.isAbsolute(configPath)) return null;
    const normalized = configPath.replace(/\\/g, "/");
    if (normalized.startsWith("..") || normalized.includes("/../") || normalized.endsWith("/..")) return null;
    const repoPath = repos[repoId]?.path;
    if (!repoPath) return null;
    const resolved = path.resolve(repoPath, configPath);
    const rel = path.relative(repoPath, resolved);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
    return resolved;
  } catch {
    return null;
  }
}

function resolveDashboardConfigRoot(root = getActiveProjectRoot()) {
  if (hasDashboardConfigFiles(root)) return root;
  const pointerConfigRoot = resolveDashboardPointerConfigRoot(root);
  if (pointerConfigRoot && hasDashboardConfigFiles(pointerConfigRoot)) return pointerConfigRoot;
  return root;
}

function resolveDashboardTaskAreaBaseRoot(root = getActiveProjectRoot()) {
  const configRoot = resolveDashboardConfigRoot(root);
  const configFiles = ["taskplane-config.json", "task-runner.yaml", "task-orchestrator.yaml"];
  const hasStandardLayout = configFiles.some((fileName) => fs.existsSync(path.join(configRoot, ".pi", fileName)));
  const hasFlatLayout = configFiles.some((fileName) => fs.existsSync(path.join(configRoot, fileName)));
  if (!hasStandardLayout && hasFlatLayout && configRoot !== root) {
    return path.dirname(configRoot);
  }
  return configRoot;
}

function resolveDashboardConfigPath(fileName, root = getActiveProjectRoot()) {
  const configRoot = resolveDashboardConfigRoot(root);
  const candidates = [
    path.join(configRoot, ".pi", fileName),
    path.join(configRoot, fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function normalizeProjectRoot(rootPath) {
  const resolved = path.resolve(String(rootPath || ""));
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function projectDisplayNameFromRoot(rootPath) {
  const base = path.basename(path.resolve(rootPath || ""));
  return base || path.resolve(rootPath || "");
}

function loadProjectRegistry() {
  const registryPath = userProjectRegistryPath();
  try {
    if (!fs.existsSync(registryPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
    const projects = Array.isArray(parsed?.projects) ? parsed.projects : [];
    return projects.filter((project) => project && typeof project === "object" && typeof project.rootPath === "string");
  } catch {
    return [];
  }
}

function writeProjectRegistry(projects) {
  const registryPath = userProjectRegistryPath();
  const dir = path.dirname(registryPath);
  const payload = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    projects,
  };
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${registryPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  fs.renameSync(tempPath, registryPath);
}

function refreshProjectRecency(projectId, rootPath) {
  if (!projectId || !rootPath || !fs.existsSync(rootPath)) return false;
  const projects = loadProjectRegistry();
  let changed = false;
  const now = new Date().toISOString();
  const updated = projects.map((project) => {
    if (String(project?.id || "").trim() !== projectId) return project;
    changed = true;
    return {
      ...project,
      rootPath: path.resolve(project.rootPath || rootPath),
      lastOpenedAt: now,
      updatedAt: now,
    };
  });
  if (changed) {
    writeProjectRegistry(updated);
  }
  return changed;
}

function buildProjectSidebar(root = getActiveProjectRoot(), state = null) {
  const normalizedRoot = normalizeProjectRoot(root);
  const registryProjects = loadProjectRegistry();
  const items = [];
  const seenRoots = new Set();

  for (const project of registryProjects) {
    const rootPath = path.resolve(project.rootPath);
    const normalized = normalizeProjectRoot(rootPath);
    if (seenRoots.has(normalized)) continue;
    seenRoots.add(normalized);

    const lastOpenedAt = project.lastOpenedAt || null;
    const lastBatchAt = project.lastBatchAt || null;
    const lastActivityAt = [lastOpenedAt, lastBatchAt].filter(Boolean).sort().slice(-1)[0] || null;
    const selected = normalized === normalizedRoot;
    const archived = project.archived === true;
    const missing = !fs.existsSync(rootPath);
    const badges = [];
    if (selected) badges.push({ key: "current", label: "Current", tone: "info" });
    if (archived) badges.push({ key: "archived", label: "Archived", tone: "neutral" });
    if (selected && state?.batch?.batchId) badges.push({ key: "running-batch", label: state.batch.phase === "completed" ? "Latest batch" : "Live batch", tone: state.batch.phase === "completed" ? "neutral" : "success" });
    if (missing) badges.push({ key: "missing", label: "Missing path", tone: "warning" });

    items.push({
      id: typeof project.id === "string" && project.id.trim() ? project.id.trim() : normalized,
      name: typeof project.name === "string" && project.name.trim() ? project.name.trim() : projectDisplayNameFromRoot(rootPath),
      rootPath,
      configPath: typeof project.configPath === "string" && project.configPath.trim() ? project.configPath.trim() : null,
      mode: project.mode === "workspace" ? "workspace" : "repo",
      archived,
      selected,
      lastOpenedAt,
      lastBatchAt,
      lastActivityAt,
      badges,
      warnings: missing ? ["Local project path is unavailable."] : [],
    });
  }

  if (!seenRoots.has(normalizedRoot)) {
    const selectedId = SELECTED_PROJECT_ID || `current:${normalizedRoot}`;
    items.push({
      id: selectedId,
      name: projectDisplayNameFromRoot(root),
      rootPath: path.resolve(root),
      configPath: resolveDashboardConfigPath("taskplane-config.json", root),
      mode: resolveDashboardPointerConfigRoot(root) ? "workspace" : "repo",
      archived: false,
      selected: true,
      lastOpenedAt: null,
      lastBatchAt: state?.batch?.updatedAt || null,
      lastActivityAt: state?.batch?.updatedAt || null,
      badges: state?.batch?.batchId ? [{ key: "current", label: "Current", tone: "info" }, { key: "running-batch", label: state.batch.phase === "completed" ? "Latest batch" : "Live batch", tone: state.batch.phase === "completed" ? "neutral" : "success" }] : [{ key: "current", label: "Current", tone: "info" }],
      warnings: [],
    });
  }

  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);
  const recent = active.filter((item) => item.lastActivityAt).sort((a, b) => String(b.lastActivityAt).localeCompare(String(a.lastActivityAt))).slice(0, 5);
  active.sort((a, b) => {
    if (a.selected) return -1;
    if (b.selected) return 1;
    if (a.lastActivityAt && b.lastActivityAt) return String(b.lastActivityAt).localeCompare(String(a.lastActivityAt));
    if (a.lastActivityAt) return -1;
    if (b.lastActivityAt) return 1;
    return a.name.localeCompare(b.name);
  });
  archived.sort((a, b) => a.name.localeCompare(b.name));

  const sections = [
    { key: "active", label: "Active Projects", collapsed: false, items: active },
    { key: "recent", label: "Recent", collapsed: false, items: recent },
    { key: "archived", label: "Archived", collapsed: archived.length > 0, items: archived },
  ].filter((section) => section.items.length > 0);

  return {
    selectedProjectId: (active.find((item) => item.selected) || archived.find((item) => item.selected) || recent.find((item) => item.selected) || null)?.id || null,
    sections,
    emptyMessage: items.length === 0 ? "No known Taskplane projects yet." : null,
  };
}

function parseLegacyTaskAreasYaml(raw) {
  const areas = {};
  const lines = String(raw || "").split(/\r?\n/);
  let inTaskAreas = false;
  let taskAreasIndent = 0;
  let currentArea = null;

  function cleanScalar(value) {
    const trimmed = String(value || "").trim();
    const withoutComment = trimmed.replace(/\s+#.*$/, "").trim();
    if ((withoutComment.startsWith('"') && withoutComment.endsWith('"'))
      || (withoutComment.startsWith("'") && withoutComment.endsWith("'"))) {
      return withoutComment.slice(1, -1);
    }
    return withoutComment;
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "    ");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.match(/^\s*/)?.[0]?.length || 0;

    if (!inTaskAreas) {
      if (/^task_areas\s*:\s*$/.test(trimmed)) {
        inTaskAreas = true;
        taskAreasIndent = indent;
      }
      continue;
    }

    if (indent <= taskAreasIndent) break;

    const areaMatch = line.match(/^\s{2,}([A-Za-z0-9._-]+)\s*:\s*$/);
    if (areaMatch && indent === taskAreasIndent + 2) {
      currentArea = areaMatch[1];
      areas[currentArea] = {};
      continue;
    }

    if (!currentArea) continue;
    const fieldMatch = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+?)\s*$/);
    if (!fieldMatch || indent < taskAreasIndent + 4) continue;
    const key = fieldMatch[1];
    const value = cleanScalar(fieldMatch[2]);
    if (!value) continue;
    if (key === "path") areas[currentArea].path = value;
    else if (key === "prefix") areas[currentArea].prefix = value;
    else if (key === "context") areas[currentArea].context = value;
    else if (key === "repo_id" || key === "repoId") areas[currentArea].repoId = value;
  }

  for (const [name, area] of Object.entries(areas)) {
    if (!area || !area.path) delete areas[name];
  }
  return areas;
}

function loadTaskplaneTaskAreas(root = getActiveProjectRoot()) {
  const configPath = resolveDashboardConfigPath("taskplane-config.json", root);
  if (configPath) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw);
      const areas = config?.taskRunner?.taskAreas;
      return areas && typeof areas === "object" ? areas : {};
    } catch {
      return {};
    }
  }

  for (const fileName of ["task-runner.yaml", "task-orchestrator.yaml"]) {
    try {
      const yamlPath = resolveDashboardConfigPath(fileName, root);
      if (!yamlPath) continue;
      const raw = fs.readFileSync(yamlPath, "utf-8");
      const areas = parseLegacyTaskAreasYaml(raw);
      if (Object.keys(areas).length > 0) return areas;
    } catch {
      continue;
    }
  }

  return {};
}

function formatTaskAuthoringDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTaskAuthoringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeTaskAuthoringScore(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 2 ? parsed : null;
}

function deriveTaskReviewLevel(scoreTotal) {
  if (scoreTotal <= 1) return 0;
  if (scoreTotal <= 3) return 1;
  if (scoreTotal <= 5) return 2;
  return 3;
}

function taskReviewLevelLabel(level) {
  return ({
    0: "None",
    1: "Plan Only",
    2: "Plan + Code",
    3: "Full",
  })[level] || "Unknown";
}

function taskScoreDimensionLabel(name, score) {
  const scale = {
    0: "low",
    1: "moderate",
    2: "high",
  };
  return `${scale[score] || "unknown"} ${name}`;
}

function slugifyTaskAuthoringTitle(title) {
  const normalized = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized || "untitled-task";
}

function formatTaskAuthoringDependencyLine(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^[-*+]\s+\*\*(Task|External|None)\*\*:/i.test(text) || /^[-*+]\s+\*\*None\*\*/i.test(text)) {
    return text;
  }
  const withoutMarker = text.replace(/^[-*+]\s+/, "").trim();
  if (/^\*\*None\*\*$/i.test(withoutMarker) || /^None$/i.test(withoutMarker)) {
    return "- **None**";
  }
  const externalMatch = withoutMarker.match(/^External\s*:\s*(.+)$/i);
  if (externalMatch) return `- **External:** ${externalMatch[1].trim()}`;
  const taskMatch = withoutMarker.match(/^(?:Task\s*:\s*)?((?:[a-z0-9-]+\/)?[A-Z]+-\d+)(.*)$/i);
  if (taskMatch) {
    const suffix = taskMatch[2] ? taskMatch[2].trim() : "";
    return `- **Task:** ${taskMatch[1]}${suffix ? ` ${suffix}` : ""}`;
  }
  return `- **External:** ${withoutMarker}`;
}

function formatTaskAuthoringContextLine(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^[-*+]\s+/.test(text)) return text;
  const [pathPart, notePart] = text.split(/\s+—\s+|\s+-\s+/, 2);
  if (notePart) return `- \`${pathPart.trim()}\` — ${notePart.trim()}`;
  return `- \`${text}\``;
}

function inferTaskAuthoringWorkspace(fileScope, fallback) {
  const roots = [...new Set(fileScope
    .map((entry) => String(entry || "").trim().replace(/\\/g, "/"))
    .filter(Boolean)
    .map((entry) => entry.split("/")[0])
    .filter((entry) => entry && entry !== "."))];
  if (roots.length === 0) return fallback || "Project root";
  if (roots.length === 1) return `\`${roots[0]}/\``;
  return roots.slice(0, 3).map((entry) => `\`${entry}/\``).join(", ");
}

function readTaskAuthoringAreaContext(areaName, area, root = getActiveProjectRoot()) {
  const taskAreaBaseRoot = resolveDashboardTaskAreaBaseRoot(root);
  const areaPath = area?.path ? path.resolve(taskAreaBaseRoot, area.path) : null;
  const configuredContextPath = typeof area?.context === "string" && area.context.trim()
    ? path.resolve(taskAreaBaseRoot, area.context.trim())
    : null;
  const contextPath = configuredContextPath || (areaPath ? path.join(areaPath, "CONTEXT.md") : null);
  let nextTaskId = "";
  if (contextPath && fs.existsSync(contextPath)) {
    try {
      const raw = fs.readFileSync(contextPath, "utf-8");
      nextTaskId = raw.match(/^\*\*Next Task ID:\*\*\s*([A-Z]+-\d+)/m)?.[1] || "";
    } catch {
      nextTaskId = "";
    }
  }
  const prefix = String(area?.prefix || nextTaskId.split("-")[0] || areaName || "TP").trim().toUpperCase() || "TP";
  const relativeContextPath = contextPath ? path.relative(root, contextPath).replace(/\\/g, "/") : null;
  return {
    areaPath,
    contextPath,
    relativeContextPath,
    nextTaskId,
    prefix,
  };
}

function loadTaskAuthoringMetadata(root = getActiveProjectRoot()) {
  const taskAreas = loadTaskplaneTaskAreas(root);
  const areas = Object.entries(taskAreas).map(([areaId, area]) => {
    const contextInfo = readTaskAuthoringAreaContext(areaId, area, root);
    return {
      id: areaId,
      label: String(area?.label || areaId),
      path: area?.path || null,
      prefix: contextInfo.prefix,
      repoId: area?.repoId || null,
      contextPath: contextInfo.relativeContextPath,
      nextTaskId: contextInfo.nextTaskId || null,
    };
  }).filter((area) => area.path);

  return {
    areas,
    defaultAreaId: areas[0]?.id || null,
    defaults: {
      size: "M",
      reviewLevel: 1,
      complexity: {
        blastRadius: 1,
        patternNovelty: 1,
        security: 0,
        reversibility: 0,
      },
    },
  };
}

function buildTaskAuthoringPreview(payload, root = getActiveProjectRoot()) {
  const metadata = loadTaskAuthoringMetadata(root);
  const normalized = {
    areaId: typeof payload?.areaId === "string" ? payload.areaId.trim() : "",
    title: typeof payload?.title === "string" ? payload.title.trim() : "",
    mission: typeof payload?.mission === "string" ? payload.mission.trim() : "",
    size: typeof payload?.size === "string" ? payload.size.trim().toUpperCase() : "",
    reviewLevel: payload?.reviewLevel == null || payload?.reviewLevel === "" ? null : Number.parseInt(String(payload.reviewLevel), 10),
    complexity: {
      blastRadius: normalizeTaskAuthoringScore(payload?.complexity?.blastRadius),
      patternNovelty: normalizeTaskAuthoringScore(payload?.complexity?.patternNovelty),
      security: normalizeTaskAuthoringScore(payload?.complexity?.security),
      reversibility: normalizeTaskAuthoringScore(payload?.complexity?.reversibility),
    },
    dependencies: normalizeTaskAuthoringList(payload?.dependencies),
    contextRefs: normalizeTaskAuthoringList(payload?.contextRefs),
    fileScope: normalizeTaskAuthoringList(payload?.fileScope),
  };

  const errors = [];
  const areaMeta = metadata.areas.find((area) => area.id === normalized.areaId) || null;
  if (!areaMeta) {
    errors.push({ kind: "field", field: "areaId", message: "Choose a task area." });
  }
  if (!normalized.title) {
    errors.push({ kind: "field", field: "title", message: "Title is required." });
  }
  if (!normalized.mission) {
    errors.push({ kind: "field", field: "mission", message: "Mission is required." });
  }
  if (!["S", "M", "L"].includes(normalized.size)) {
    errors.push({ kind: "field", field: "size", message: "Size must be S, M, or L. Split XL work before packet creation." });
  }

  for (const [field, value] of Object.entries(normalized.complexity)) {
    if (value == null) {
      errors.push({ kind: "field", field: `complexity.${field}`, message: "Complexity scores must be integers between 0 and 2." });
    }
  }

  const hasComplexityScores = Object.values(normalized.complexity).every((value) => value != null);
  const scoreTotal = hasComplexityScores
    ? normalized.complexity.blastRadius + normalized.complexity.patternNovelty + normalized.complexity.security + normalized.complexity.reversibility
    : null;
  const derivedReviewLevel = scoreTotal == null ? null : deriveTaskReviewLevel(scoreTotal);
  if (normalized.reviewLevel != null && ![0, 1, 2, 3].includes(normalized.reviewLevel)) {
    errors.push({ kind: "field", field: "reviewLevel", message: "Review level must be between 0 and 3." });
  }
  if (normalized.reviewLevel != null && derivedReviewLevel != null && normalized.reviewLevel !== derivedReviewLevel) {
    errors.push({
      kind: "field",
      field: "reviewLevel",
      message: `Review level ${normalized.reviewLevel} does not match rubric-derived level ${derivedReviewLevel}.`,
    });
  }

  const taskAreas = loadTaskplaneTaskAreas(root);
  const rawArea = normalized.areaId ? taskAreas[normalized.areaId] : null;
  const contextInfo = areaMeta ? readTaskAuthoringAreaContext(normalized.areaId, rawArea, root) : null;
  if (areaMeta && !contextInfo?.nextTaskId) {
    errors.push({ kind: "server", field: "areaId", message: "Could not read Next Task ID from the selected area CONTEXT.md." });
  }

  const taskId = contextInfo?.nextTaskId || null;
  const slug = normalized.title ? slugifyTaskAuthoringTitle(normalized.title) : null;
  const folderName = taskId && slug ? `${taskId}-${slug}` : null;
  const relativeFolderPath = areaMeta?.path && folderName ? `${String(areaMeta.path).replace(/\\/g, "/")}/${folderName}` : null;
  const reviewLevel = normalized.reviewLevel != null ? normalized.reviewLevel : derivedReviewLevel;
  const reviewLabel = reviewLevel != null ? taskReviewLevelLabel(reviewLevel) : null;
  const assessment = scoreTotal == null ? null : [
    `Task authoring rubric indicates ${taskScoreDimensionLabel("blast radius", normalized.complexity.blastRadius)}`,
    taskScoreDimensionLabel("pattern novelty", normalized.complexity.patternNovelty),
    taskScoreDimensionLabel("security", normalized.complexity.security),
    `and ${taskScoreDimensionLabel("reversibility", normalized.complexity.reversibility)}.`,
  ].join(", ");
  const createdDate = formatTaskAuthoringDate();
  const dependencyLines = normalized.dependencies.length > 0
    ? normalized.dependencies.map(formatTaskAuthoringDependencyLine).filter(Boolean)
    : ["- **None**"];
  const contextLines = normalized.contextRefs.map(formatTaskAuthoringContextLine).filter(Boolean);
  const fileScopeLines = normalized.fileScope.length > 0
    ? normalized.fileScope.map((entry) => `- \`${entry}\``)
    : ["- `None declared yet`"];
  const workspaceLabel = inferTaskAuthoringWorkspace(normalized.fileScope, areaMeta?.path ? `\`${areaMeta.path}/\`` : "Project root");
  const promptMarkdown = taskId && folderName && scoreTotal != null && reviewLevel != null
    ? [
      `# Task: ${taskId} - ${normalized.title}`,
      "",
      `**Created:** ${createdDate}`,
      `**Size:** ${normalized.size}`,
      "",
      `## Review Level: ${reviewLevel} (${reviewLabel})`,
      "",
      `**Assessment:** ${assessment}`,
      `**Score:** ${scoreTotal}/8 — Blast radius: ${normalized.complexity.blastRadius}, Pattern novelty: ${normalized.complexity.patternNovelty}, Security: ${normalized.complexity.security}, Reversibility: ${normalized.complexity.reversibility}`,
      "",
      "## Canonical Task Folder",
      "",
      "```text",
      `${relativeFolderPath}/`,
      "├── PROMPT.md",
      "├── STATUS.md",
      "├── .reviews/",
      "└── .DONE",
      "```",
      "",
      "## Mission",
      "",
      normalized.mission,
      "",
      "## Dependencies",
      "",
      ...dependencyLines,
      "",
      "## Context to Read First",
      "",
      "**Tier 2 (area context):**",
      ...(contextInfo?.relativeContextPath ? [`- \`${contextInfo.relativeContextPath}\``] : ["- `CONTEXT.md`"]),
      "",
      "**Tier 3 (load only if needed):**",
      ...(contextLines.length > 0 ? contextLines : ["- None beyond Tier 2."]),
      "",
      "## Environment",
      "",
      `- **Workspace:** ${workspaceLabel}`,
      "- **Services required:** None",
      "",
      "## File Scope",
      "",
      ...fileScopeLines,
      "",
      "## Steps",
      "",
      "### Step 0: Preflight",
      "",
      "- [ ] Read area context and referenced docs",
      `- [ ] Confirm dependencies and file scope for ${taskId}`,
      "",
      `### Step 1: Implement ${normalized.title}`,
      "",
      `- [ ] Implement ${normalized.title} in the declared file scope`,
      "- [ ] Keep behavior aligned with existing Taskplane conventions",
      "- [ ] Run targeted tests for the touched area",
      "",
      "**Artifacts:**",
      ...fileScopeLines,
      "",
      "### Step 2: Testing & Verification",
      "",
      "- [ ] Run FULL test suite: `[test command from project config]`",
      "- [ ] Run integration tests (if applicable)",
      "- [ ] Fix all failures",
      "- [ ] Build passes: `[build command]`",
      "",
      "### Step 3: Documentation & Delivery",
      "",
      "- [ ] \"Must Update\" docs modified",
      "- [ ] \"Check If Affected\" docs reviewed",
      "- [ ] Discoveries logged in STATUS.md",
      "",
      "## Documentation Requirements",
      "",
      "**Must Update:**",
      "- None",
      "",
      "**Check If Affected:**",
      "- None",
      "",
      "## Completion Criteria",
      "",
      "- [ ] All steps complete",
      "- [ ] All tests passing",
      "- [ ] Documentation updated",
      "",
      "## Git Commit Convention",
      "",
      `- **Step completion:** \`feat(${taskId}): complete Step N — description\``,
      `- **Bug fixes:** \`fix(${taskId}): description\``,
      `- **Tests:** \`test(${taskId}): description\``,
      `- **Hydration:** \`hydrate: ${taskId} expand Step N checkboxes\``,
      "",
      "## Do NOT",
      "",
      "- Expand task scope — add tech debt to CONTEXT.md instead",
      "- Skip tests",
      "- Modify framework/standards docs without explicit user approval",
      "- Load docs not listed in \"Context to Read First\"",
      `- Commit without the ${taskId} prefix in the commit message`,
      "",
      "---",
      "",
      "## Amendments (Added During Execution)",
      "",
    ].join("\n")
    : "";

  const statusMarkdown = taskId && reviewLevel != null
    ? [
      `# ${taskId}: ${normalized.title} — Status`,
      "",
      "**Current Step:** Step 0: Preflight",
      "**Status:** 🔵 Ready for Execution",
      `**Last Updated:** ${createdDate}`,
      `**Review Level:** ${reviewLevel}`,
      "**Review Counter:** 0",
      "**Iteration:** 0",
      `**Size:** ${normalized.size}`,
      "",
      "> **Hydration:** Checkboxes represent meaningful outcomes, not individual code changes. Workers expand steps when runtime discoveries warrant it — aim for 2-5 outcome-level items per step, not exhaustive implementation scripts.",
      "",
      "---",
      "",
      "### Step 0: Preflight",
      "**Status:** ⬜ Not Started",
      "- [ ] Read area context and referenced docs",
      `- [ ] Confirm dependencies and file scope for ${taskId}`,
      "",
      "---",
      "",
      `### Step 1: Implement ${normalized.title}`,
      "**Status:** ⬜ Not Started",
      `- [ ] Implement ${normalized.title} in the declared file scope`,
      "- [ ] Keep behavior aligned with existing Taskplane conventions",
      "- [ ] Run targeted tests for the touched area",
      "",
      "---",
      "",
      "### Step 2: Testing & Verification",
      "**Status:** ⬜ Not Started",
      "- [ ] FULL test suite passing",
      "- [ ] Integration tests (if applicable)",
      "- [ ] All failures fixed",
      "- [ ] Build passes",
      "",
      "---",
      "",
      "### Step 3: Documentation & Delivery",
      "**Status:** ⬜ Not Started",
      "- [ ] \"Must Update\" docs modified",
      "- [ ] \"Check If Affected\" docs reviewed",
      "- [ ] Discoveries logged in STATUS.md",
      "",
      "---",
      "",
      "## Reviews",
      "",
      "| # | Type | Step | Verdict | File |",
      "|---|------|------|---------|------|",
      "",
      "---",
      "",
      "## Discoveries",
      "",
      "| Discovery | Disposition | Location |",
      "|-----------|-------------|----------|",
      "",
      "---",
      "",
      "## Execution Log",
      "",
      "| Timestamp | Action | Outcome |",
      "|-----------|--------|---------|",
      `| ${createdDate} | Task staged | PROMPT.md and STATUS.md created |`,
      "",
      "---",
      "",
      "## Blockers",
      "",
      "*None*",
      "",
      "---",
      "",
      "## Notes",
      "",
      "Generated from the dashboard task authoring preview.",
    ].join("\n")
    : "";

  return {
    ok: errors.length === 0,
    metadata,
    errors,
    normalized,
    derived: {
      areaId: areaMeta?.id || null,
      taskId,
      slug,
      folderName,
      relativeFolderPath,
      contextPath: contextInfo?.relativeContextPath || areaMeta?.contextPath || null,
      reviewLevel,
      reviewLabel,
      scoreTotal,
      scoreBreakdown: scoreTotal == null ? null : {
        blastRadius: normalized.complexity.blastRadius,
        patternNovelty: normalized.complexity.patternNovelty,
        security: normalized.complexity.security,
        reversibility: normalized.complexity.reversibility,
      },
      assessment,
      createdDate,
      workspace: workspaceLabel,
    },
    preview: {
      promptMarkdown,
      statusMarkdown,
    },
  };
}

function incrementTaskAuthoringId(taskId) {
  const match = String(taskId || "").trim().match(/^([A-Z]+)-(\d+)$/);
  if (!match) return null;
  const width = match[2].length;
  const nextValue = Number.parseInt(match[2], 10) + 1;
  return `${match[1]}-${String(nextValue).padStart(width, "0")}`;
}

function makeTaskAuthoringError(statusCode, code, message, extra = {}) {
  return {
    ok: false,
    statusCode,
    error: { code, message, ...extra },
  };
}

function cleanupTaskAuthoringFolder(folderPath) {
  try {
    if (folderPath && fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
    return true;
  } catch {
    return false;
  }
}

function createTaskAuthoringPacket(payload, root = getActiveProjectRoot()) {
  const preview = buildTaskAuthoringPreview(payload, root);
  if (!preview.ok) {
    return {
      statusCode: 422,
      ...preview,
    };
  }

  const taskAreas = loadTaskplaneTaskAreas(root);
  const areaId = preview.derived?.areaId;
  const area = areaId ? taskAreas[areaId] : null;
  const contextInfo = areaId ? readTaskAuthoringAreaContext(areaId, area, root) : null;
  const areaPath = contextInfo?.areaPath || null;
  const taskId = preview.derived?.taskId || null;
  const folderName = preview.derived?.folderName || null;
  if (!areaPath || !taskId || !folderName) {
    return makeTaskAuthoringError(500, "AUTHORING_CONFIG_INVALID", "Task authoring paths could not be resolved.", {
      recoverable: true,
      preview: {
        derived: preview.derived,
      },
    });
  }

  if (!fs.existsSync(areaPath)) {
    return makeTaskAuthoringError(500, "AUTHORING_AREA_MISSING", `Task area path does not exist: ${areaPath}`, {
      recoverable: true,
    });
  }

  const finalFolderPath = path.join(areaPath, folderName);
  if (fs.existsSync(finalFolderPath)) {
    return makeTaskAuthoringError(409, "TASK_FOLDER_EXISTS", `Task folder already exists: ${preview.derived.relativeFolderPath}`, {
      recoverable: true,
      taskId,
      folderPath: preview.derived.relativeFolderPath,
      preview: {
        derived: preview.derived,
      },
    });
  }

  try {
    const siblings = fs.readdirSync(areaPath, { withFileTypes: true });
    const conflicting = siblings.find((entry) => entry?.isDirectory?.() && entry.name !== folderName && entry.name.startsWith(`${taskId}-`));
    if (conflicting) {
      return makeTaskAuthoringError(409, "TASK_ID_CONFLICT", `Task ID ${taskId} is already present in ${conflicting.name}.`, {
        recoverable: true,
        taskId,
        folderPath: preview.derived.relativeFolderPath,
        preview: {
          derived: preview.derived,
        },
      });
    }
  } catch (error) {
    return makeTaskAuthoringError(500, "AUTHORING_AREA_UNREADABLE", `Could not inspect task area: ${error.message}`, {
      recoverable: true,
    });
  }

  const nextTaskId = incrementTaskAuthoringId(taskId);
  if (!nextTaskId) {
    return makeTaskAuthoringError(500, "NEXT_TASK_ID_INVALID", `Could not increment task ID ${taskId}.`, {
      recoverable: true,
    });
  }

  const tempFolderPath = path.join(areaPath, `.${folderName}.tmp-${Date.now()}-${process.pid}`);
  cleanupTaskAuthoringFolder(tempFolderPath);

  try {
    fs.mkdirSync(path.join(tempFolderPath, ".reviews"), { recursive: true });
    fs.writeFileSync(path.join(tempFolderPath, "PROMPT.md"), `${preview.preview.promptMarkdown.trimEnd()}\n`, "utf-8");
    fs.writeFileSync(path.join(tempFolderPath, "STATUS.md"), `${preview.preview.statusMarkdown.trimEnd()}\n`, "utf-8");
    fs.renameSync(tempFolderPath, finalFolderPath);
  } catch (error) {
    cleanupTaskAuthoringFolder(tempFolderPath);
    cleanupTaskAuthoringFolder(finalFolderPath);
    return makeTaskAuthoringError(500, "TASK_WRITE_FAILED", `Could not create task packet files: ${error.message}`, {
      recoverable: true,
      taskId,
      folderPath: preview.derived.relativeFolderPath,
      preview: {
        derived: preview.derived,
      },
    });
  }

  let contextRaw = "";
  try {
    if (!contextInfo?.contextPath || !fs.existsSync(contextInfo.contextPath)) {
      throw new Error("Area CONTEXT.md is missing");
    }
    contextRaw = fs.readFileSync(contextInfo.contextPath, "utf-8");
  } catch (error) {
    const cleanupSucceeded = cleanupTaskAuthoringFolder(finalFolderPath);
    return makeTaskAuthoringError(500, "CONTEXT_READ_FAILED", `Could not read area CONTEXT.md: ${error.message}`, {
      recoverable: cleanupSucceeded,
      rollbackAttempted: true,
      rollbackSucceeded: cleanupSucceeded,
      taskId,
      folderPath: preview.derived.relativeFolderPath,
    });
  }

  const currentTaskId = contextRaw.match(/^\*\*Next Task ID:\*\*\s*([A-Z]+-\d+)/m)?.[1] || "";
  if (currentTaskId !== taskId) {
    const cleanupSucceeded = cleanupTaskAuthoringFolder(finalFolderPath);
    return makeTaskAuthoringError(409, "NEXT_TASK_ID_STALE", `Next Task ID changed from ${taskId} to ${currentTaskId || "unknown"} before commit.`, {
      recoverable: cleanupSucceeded,
      rollbackAttempted: true,
      rollbackSucceeded: cleanupSucceeded,
      taskId,
      nextTaskId: currentTaskId || null,
      folderPath: preview.derived.relativeFolderPath,
    });
  }

  const updatedContext = contextRaw.replace(/^\*\*Next Task ID:\*\*\s*[A-Z]+-\d+/m, `**Next Task ID:** ${nextTaskId}`);
  if (updatedContext === contextRaw) {
    const cleanupSucceeded = cleanupTaskAuthoringFolder(finalFolderPath);
    return makeTaskAuthoringError(500, "NEXT_TASK_ID_UPDATE_FAILED", "Could not update Next Task ID in CONTEXT.md.", {
      recoverable: cleanupSucceeded,
      rollbackAttempted: true,
      rollbackSucceeded: cleanupSucceeded,
      taskId,
      folderPath: preview.derived.relativeFolderPath,
    });
  }

  try {
    fs.writeFileSync(contextInfo.contextPath, updatedContext, "utf-8");
  } catch (error) {
    const cleanupSucceeded = cleanupTaskAuthoringFolder(finalFolderPath);
    return makeTaskAuthoringError(500, "CONTEXT_WRITE_FAILED", `Could not update CONTEXT.md: ${error.message}`, {
      recoverable: cleanupSucceeded,
      rollbackAttempted: true,
      rollbackSucceeded: cleanupSucceeded,
      taskId,
      folderPath: preview.derived.relativeFolderPath,
    });
  }

  return {
    ok: true,
    statusCode: 201,
    created: {
      taskId,
      nextTaskId,
      folderPath: preview.derived.relativeFolderPath,
      promptPath: `${preview.derived.relativeFolderPath}/PROMPT.md`,
      statusPath: `${preview.derived.relativeFolderPath}/STATUS.md`,
      contextPath: preview.derived.contextPath,
    },
    preview,
  };
}

function handleTaskAuthoringPreview(req, res) {
  readJsonRequestBody(req, (err, payload) => {
    if (err) {
      sendJson(res, 400, { ok: false, errors: [{ kind: "field", field: "body", message: "Invalid JSON" }] });
      return;
    }

    const preview = buildTaskAuthoringPreview(payload, getActiveProjectRoot());
    sendJson(res, preview.ok ? 200 : 422, preview);
  });
}

function handleTaskAuthoringCreate(req, res) {
  readJsonRequestBody(req, (err, payload) => {
    if (err) {
      sendJson(res, 400, makeTaskAuthoringError(400, "INVALID_JSON", "Invalid JSON", { recoverable: true }));
      return;
    }

    const result = createTaskAuthoringPacket(payload, getActiveProjectRoot());
    sendJson(res, result.statusCode || (result.ok ? 201 : 500), result);
  });
}

function handleTaskAuthoringMetadata(req, res) {
  sendJson(res, 200, loadTaskAuthoringMetadata(getActiveProjectRoot()));
}

function extractBacklogSection(content, heading) {
  if (!content || !heading) return "";
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|\\n---|\\n$)`, "m"));
  return match ? match[1].trim() : "";
}

function parseBacklogBulletLines(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split("\n")
    .map((line) => line.match(/^\s*[-*+]\s+(.*)$/)?.[1]?.trim() || "")
    .filter(Boolean);
}

function normalizeBacklogDependencyRef(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const qualifiedMatch = text.match(/^(?:[a-z0-9-]+\/)?([A-Z]+-\d+)$/i);
  if (qualifiedMatch) return qualifiedMatch[1].toUpperCase();
  const inlineMatch = text.match(/([A-Z]+-\d+)/i);
  return inlineMatch ? inlineMatch[1].toUpperCase() : text.toUpperCase();
}

function extractBacklogPromptMeta(promptPath, taskFolder, areaName) {
  let content = "";
  try {
    content = fs.readFileSync(promptPath, "utf-8");
  } catch {
    return {
      packet: null,
      error: { path: promptPath, message: "Cannot read PROMPT.md" },
    };
  }

  const folderName = path.basename(taskFolder);
  const headingMatch = content.match(/^#\s+Task:\s+([A-Z]+-\d+)\s*[-—]\s*(.+)$/m);
  const folderMatch = folderName.match(/^([A-Z]+-\d+)/);
  const taskId = headingMatch?.[1] || folderMatch?.[1] || null;
  if (!taskId) {
    return {
      packet: null,
      error: { path: promptPath, message: "Task ID missing from PROMPT.md or folder name" },
    };
  }

  const title = (headingMatch?.[2] || folderName.replace(/^([A-Z]+-\d+)[-_]*/, "")).trim() || taskId;
  const missionSection = extractBacklogSection(content, "Mission");
  const summary = missionSection
    ? missionSection
      .split(/\n{2,}/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .find(Boolean) || null
    : null;

  const dependencies = [];
  for (const depLine of parseBacklogBulletLines(extractBacklogSection(content, "Dependencies"))) {
    const depId = normalizeBacklogDependencyRef(depLine);
    if (!depId || depId === taskId || dependencies.includes(depId)) continue;
    dependencies.push(depId);
  }

  const fileScope = parseBacklogBulletLines(extractBacklogSection(content, "File Scope"));

  let promptRepoId = null;
  const executionTargetMatch = extractBacklogSection(content, "Execution Target");
  if (executionTargetMatch) {
    const repoLineMatch = executionTargetMatch.match(/^\s*(?:[-*+]\s+)?Repo:\s*(\S+)/im);
    if (repoLineMatch) promptRepoId = repoLineMatch[1].trim().toLowerCase();
  }
  if (!promptRepoId) {
    const inlineRepoMatch = content.match(/^\*\*(?:Repo|Workspace):\*\*\s+(\S+)/m);
    if (inlineRepoMatch) promptRepoId = inlineRepoMatch[1].trim().toLowerCase();
  }

  return {
    packet: {
      taskId,
      title,
      summary,
      mission: missionSection ? missionSection.replace(/\s+/g, " ").trim() : null,
      area: areaName,
      promptRepoId,
      dependencies,
      fileScope,
      promptPath,
      statusPath: path.join(taskFolder, "STATUS.md"),
      taskFolder,
    },
    error: null,
  };
}

function isBacklogPacketComplete(packet) {
  const statusText = String(packet?.statusData?.status || "").trim();
  return Boolean(
    packet?.doneFileFound
      || packet?.activeTask?.status === "succeeded"
      || /^✅/.test(statusText)
      || /complete/i.test(statusText),
  );
}

function buildBacklogDependencyLink(depId, packetById) {
  const depPacket = packetById.get(depId) || null;
  return {
    kind: "task",
    id: depId,
    label: depId,
    href: depPacket?.taskFolder || null,
    exists: Boolean(depPacket),
  };
}

function findTaskHistoryEntry(history, taskId) {
  if (!Array.isArray(history) || !taskId) return null;
  for (const entry of history) {
    if (!entry || !Array.isArray(entry.tasks)) continue;
    if (entry.tasks.some((task) => task?.taskId === taskId)) return entry;
  }
  return null;
}

function computeBacklogSummary(items) {
  const summary = {
    total: items.length,
    ready: 0,
    blocked: 0,
    running: 0,
    waiting: 0,
    succeeded: 0,
    failed: 0,
    stalled: 0,
    skipped: 0,
    unknown: 0,
  };
  for (const item of items) {
    const key = item?.status?.key || "unknown";
    if (key in summary) summary[key] += 1;
    else summary.unknown += 1;
  }
  return summary;
}

function loadBacklogData(state, history, root = getActiveProjectRoot()) {
  const taskAreas = loadTaskplaneTaskAreas(root);
  const taskAreaBaseRoot = resolveDashboardTaskAreaBaseRoot(root);
  const packets = [];
  const errors = [];
  const activeTaskById = new Map();
  for (const task of (state?.tasks || [])) {
    if (task?.taskId) activeTaskById.set(task.taskId, task);
  }

  for (const [areaName, area] of Object.entries(taskAreas)) {
    if (!area || !area.path) continue;
    const areaPath = path.resolve(taskAreaBaseRoot, area.path);
    if (!fs.existsSync(areaPath)) {
      errors.push({ path: areaPath, message: `Task area not found: ${area.path}` });
      continue;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(areaPath, { withFileTypes: true });
    } catch {
      errors.push({ path: areaPath, message: `Cannot read task area: ${area.path}` });
      continue;
    }

    for (const entry of entries) {
      if (!entry?.isDirectory?.()) continue;
      if (entry.name === "archive") continue;
      const taskFolder = path.join(areaPath, entry.name);
      const promptPath = path.join(taskFolder, "PROMPT.md");
      if (!fs.existsSync(promptPath)) continue;

      const parsed = extractBacklogPromptMeta(promptPath, taskFolder, areaName);
      if (parsed.error || !parsed.packet) {
        errors.push(parsed.error || { path: promptPath, message: "Malformed task packet" });
        continue;
      }

      const activeTask = activeTaskById.get(parsed.packet.taskId) || null;
      packets.push({
        ...parsed.packet,
        repoId: activeTask?.resolvedRepoId || activeTask?.repoId || parsed.packet.promptRepoId || area.repoId || null,
        statusData: parseStatusMd(taskFolder),
        doneFileFound: checkDoneFile(taskFolder),
        activeTask,
      });
    }
  }

  const packetById = new Map(packets.map((packet) => [packet.taskId, packet]));
  const items = packets.map((packet) => {
    const blockedDependencies = [];
    const completedDependencies = [];
    for (const rawDep of packet.dependencies || []) {
      const depId = normalizeBacklogDependencyRef(rawDep);
      if (!depId || depId === packet.taskId) continue;
      const link = buildBacklogDependencyLink(depId, packetById);
      const depPacket = packetById.get(depId) || null;
      if (depPacket && isBacklogPacketComplete(depPacket)) completedDependencies.push(link);
      else blockedDependencies.push(link);
    }

    return buildBacklogItem(packet, {
      activeTask: packet.activeTask,
      blockedDependencies,
      completedDependencies,
      historyEntry: findTaskHistoryEntry(history, packet.taskId),
      batchState: state,
    });
  }).sort((a, b) => a.taskId.localeCompare(b.taskId));

  const repoIds = [...new Set(items.map((item) => item.repoId).filter(Boolean))].sort();
  const workspaceRepos = loadDashboardWorkspaceRepos(root);
  const inferredMode = state?.mode
    || (Object.keys(workspaceRepos).length > 0 || resolveDashboardPointerConfigRoot(root) ? "workspace" : "repo");
  let loadState = { kind: "ready", message: null };
  if (items.length === 0 && errors.length > 0) {
    loadState = { kind: "error", message: "Backlog scan failed" };
  } else if (items.length === 0) {
    loadState = { kind: "empty", message: "No task packets found" };
  } else if (errors.length > 0) {
    loadState = { kind: "partial", message: "Some task packets could not be parsed" };
  }

  return {
    items,
    summary: computeBacklogSummary(items),
    scope: {
      mode: inferredMode,
      repoIds,
      configuredRepoIds: Object.keys(workspaceRepos).sort(),
      taskAreaCount: Object.keys(taskAreas).length,
    },
    errors,
    loadState,
  };
}

function buildBacklogDisplayStatus(packet, context) {
  const blockedDependencies = Array.isArray(context?.blockedDependencies)
    ? context.blockedDependencies.filter(Boolean)
    : [];
  const currentTask = context?.activeTask || null;
  const statusText = String(packet?.statusData?.status || "").trim();

  if (currentTask?.status === "running") {
    return {
      key: "running",
      label: "Running",
      tone: "info",
      reason: currentTask.batchId ? `Running in batch ${currentTask.batchId}` : "Running in active batch",
      source: ["batch-state"],
    };
  }

  if (currentTask?.status === "failed") {
    return {
      key: "failed",
      label: "Failed",
      tone: "danger",
      reason: "Failed in the active batch",
      source: ["batch-state"],
    };
  }

  if (currentTask?.status === "stalled") {
    return {
      key: "stalled",
      label: "Stalled",
      tone: "warning",
      reason: "Stalled in the active batch",
      source: ["batch-state"],
    };
  }

  if (currentTask?.status === "succeeded") {
    return {
      key: "succeeded",
      label: "Done",
      tone: "success",
      reason: currentTask.batchId ? `Completed in batch ${currentTask.batchId}` : "Completed in the active batch",
      source: ["batch-state"],
    };
  }

  if (currentTask?.status === "skipped") {
    return {
      key: "skipped",
      label: "Skipped",
      tone: "warning",
      reason: "Skipped in the active batch",
      source: ["batch-state"],
    };
  }

  if (currentTask && (currentTask.status === "pending" || currentTask.status === "unknown")) {
    return {
      key: "waiting",
      label: "Queued",
      tone: "neutral",
      reason: currentTask.batchId ? `Queued in batch ${currentTask.batchId}` : "Queued in active batch",
      source: ["batch-state"],
    };
  }

  if (packet?.doneFileFound || /^✅/.test(statusText) || /complete/i.test(statusText)) {
    return {
      key: "succeeded",
      label: "Done",
      tone: "success",
      reason: packet?.doneFileFound ? ".DONE marker present" : "STATUS.md reports completion",
      source: packet?.doneFileFound ? [".DONE", "STATUS.md"] : ["STATUS.md"],
    };
  }

  if (/^❌/.test(statusText) || /failed|error/i.test(statusText)) {
    return {
      key: "failed",
      label: "Failed",
      tone: "danger",
      reason: statusText || "STATUS.md reports failure",
      source: ["STATUS.md"],
    };
  }

  if (/^🚧/.test(statusText) || /blocked/i.test(statusText) || blockedDependencies.length > 0) {
    return {
      key: "blocked",
      label: "Blocked",
      tone: "warning",
      reason: blockedDependencies.length > 0
        ? `Waiting on ${blockedDependencies.length} dependency${blockedDependencies.length === 1 ? "" : "ies"}`
        : (statusText || "Blocked by prerequisites"),
      source: blockedDependencies.length > 0 ? ["PROMPT.md", "STATUS.md"] : ["STATUS.md"],
    };
  }

  if (/in progress/i.test(statusText) || /^🟡/.test(statusText)) {
    return {
      key: "waiting",
      label: "In Progress",
      tone: "info",
      reason: "Packet is already in progress outside the active batch",
      source: ["STATUS.md"],
    };
  }

  return {
    key: "ready",
    label: "Ready",
    tone: "success",
    reason: blockedDependencies.length === 0 ? "All known dependencies satisfied" : null,
    source: ["PROMPT.md", "STATUS.md"],
  };
}

function isDashboardActionBatchBusy(batchState) {
  const phase = batchState?.phase || "";
  return ["launching", "planning", "executing", "merging"].includes(phase);
}

function buildTaskActionContract(item, batchState) {
  const currentTask = item?.execution || {};
  const busy = isDashboardActionBatchBusy(batchState);
  const hasBatch = Boolean(batchState?.batchId);
  const promptPath = item?.navigation?.promptPath || item?.promptPath || null;

  const startReason = busy
    ? `Batch ${batchState.batchId} is ${batchState.phase}`
    : (!item?.readiness?.isReady
      ? (item?.status?.reason || "Task is not ready")
      : (!promptPath ? "PROMPT.md path unavailable" : null));

  const retrySupported = false;
  const retryEnabled = retrySupported
    && Boolean(hasBatch && currentTask?.status && ["failed", "stalled"].includes(currentTask.status) && !busy);
  const retryReason = busy
    ? `Pause or wait for the batch to stop (current phase: ${batchState?.phase || "unknown"})`
    : (!hasBatch
      ? "Retry applies to the current batch only"
      : (!currentTask?.status || !["failed", "stalled"].includes(currentTask.status)
        ? "Only failed or stalled active-batch tasks can be retried"
        : (retrySupported ? null : "Dashboard fallback only — copy this recovery tool call into the operator console")));

  const skipSupported = false;
  const skipEnabled = skipSupported
    && Boolean(hasBatch && currentTask?.status && ["failed", "stalled", "pending"].includes(currentTask.status) && !busy);
  const skipReason = busy
    ? `Pause or wait for the batch to stop (current phase: ${batchState?.phase || "unknown"})`
    : (!hasBatch
      ? "Skip applies to the current batch only"
      : (!currentTask?.status || !["failed", "stalled", "pending"].includes(currentTask.status)
        ? "Only failed, stalled, or pending active-batch tasks can be skipped"
        : (skipSupported ? null : "Dashboard fallback only — copy this recovery tool call into the operator console")));

  return {
    start: {
      id: "start",
      label: "Start task",
      invokeMode: "post",
      enabled: !startReason,
      reason: startReason,
      commandPreview: promptPath ? `/orch ${promptPath}` : null,
      confirmation: !startReason ? `Start a batch for ${item?.taskId}?` : null,
    },
    retry: {
      id: "retry",
      label: "Retry task",
      invokeMode: retrySupported ? "post" : "copy",
      enabled: retryEnabled,
      reason: retryReason,
      commandPreview: item?.taskId ? `orch_retry_task(taskId="${item.taskId}")` : null,
      confirmation: retryEnabled ? `Retry ${item?.taskId} on the next resume cycle?` : null,
    },
    skip: {
      id: "skip",
      label: "Skip task",
      invokeMode: skipSupported ? "post" : "copy",
      enabled: skipEnabled,
      reason: skipReason,
      commandPreview: item?.taskId ? `orch_skip_task(taskId="${item.taskId}")` : null,
      confirmation: skipEnabled ? `Skip ${item?.taskId} and unblock dependents?` : null,
    },
  };
}

function buildBatchActionContract(batchState) {
  if (!batchState) {
    return {
      integrate: {
        id: "integrate",
        label: "Integrate batch",
        invokeMode: "post",
        enabled: false,
        reason: "No active or resumable batch available",
        commandPreview: "/orch-integrate",
        confirmation: null,
      },
    };
  }

  const phase = batchState.phase || "unknown";
  const enabled = phase === "completed";
  return {
    integrate: {
      id: "integrate",
      label: "Integrate batch",
      invokeMode: "post",
      enabled,
      reason: enabled ? null : `Integration is available only after completion (current phase: ${phase})`,
      commandPreview: "/orch-integrate",
      confirmation: enabled ? `Integrate batch ${batchState.batchId}?` : null,
    },
  };
}

function buildBacklogItem(packet, context) {
  const blockedDependencies = Array.isArray(context?.blockedDependencies)
    ? context.blockedDependencies.filter(Boolean)
    : [];
  const completedDependencies = Array.isArray(context?.completedDependencies)
    ? context.completedDependencies.filter(Boolean)
    : [];
  const currentTask = context?.activeTask || null;
  const historyEntry = context?.historyEntry || null;
  const status = buildBacklogDisplayStatus(packet, context);

  const statusTimestamp = packet?.statusData?.updatedAt || null;
  const activeTimestamp = currentTask?.endedAt || currentTask?.startedAt || null;
  const historyTimestamp = historyEntry?.endedAt || historyEntry?.startedAt || null;
  const lastActivityAt = activeTimestamp || statusTimestamp || historyTimestamp || null;
  const lastActivitySummary = currentTask
    ? `Active batch: ${currentTask.status || "unknown"}`
    : (historyEntry
      ? `Last batch ${historyEntry.batchId || "unknown"}: ${historyEntry.status || "unknown"}`
      : status.reason || null);

  const batchScopedWaiting = Boolean(currentTask) && (status.key === "waiting" || status.key === "running");

  const item = {
    taskId: packet.taskId,
    title: packet.title,
    summary: packet.summary || null,
    area: packet.area || null,
    repoId: packet.repoId || null,
    packetPath: packet.taskFolder || null,
    promptPath: packet.promptPath || null,
    statusPath: packet.statusPath || null,
    taskFolder: packet.taskFolder || null,
    status,
    readiness: {
      isReady: status.key === "ready",
      blockedBy: blockedDependencies,
      waitingOn: status.key === "blocked"
        ? "dependencies"
        : (batchScopedWaiting ? "active-batch" : null),
    },
    execution: {
      batchId: currentTask?.batchId || null,
      laneNumber: currentTask?.laneNumber ?? null,
      status: currentTask?.status || null,
    },
    lastActivityAt,
    lastActivitySummary,
    counts: {
      dependencyCount: Array.isArray(packet.dependencies) ? packet.dependencies.length : 0,
      completedDependencyCount: completedDependencies.length,
      reviewCount: packet?.statusData?.reviews || 0,
      artifactCount: packet?.doneFileFound ? 3 : 2,
    },
    detail: {
      mission: packet.mission || packet.summary || null,
      dependencies: Array.isArray(packet.dependencies) ? packet.dependencies : [],
      completedDependencies,
      blockedDependencies,
      fileScope: Array.isArray(packet.fileScope) ? packet.fileScope : [],
      currentStep: packet?.statusData?.currentStep || null,
      statusText: packet?.statusData?.status || null,
      progress: packet?.statusData?.progress ?? null,
      iteration: packet?.statusData?.iteration ?? null,
      reviewLevel: packet?.statusData?.reviewLevel ?? null,
      latestExecution: packet?.statusData?.latestExecution || null,
    },
    navigation: {
      kind: "task",
      id: packet.taskId,
      label: packet.title,
      promptPath: packet.promptPath || null,
      statusPath: packet.statusPath || null,
      taskFolder: packet.taskFolder || null,
    },
    actions: null,
  };

  item.actions = buildTaskActionContract(item, context?.batchState || null);
  return item;
}

function loadHistory(root = getActiveProjectRoot()) {
  try {
    const historyPath = batchHistoryPathForRoot(root);
    if (!fs.existsSync(historyPath)) return [];
    const raw = fs.readFileSync(historyPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** GET /api/history — return list of batch summaries (compact: no per-task detail). */
function serveHistory(req, res) {
  const history = loadHistory();
  // Return compact list for the dropdown (no per-task details)
  const compact = history.map(h => ({
    batchId: h.batchId,
    status: h.status,
    startedAt: h.startedAt,
    endedAt: h.endedAt,
    durationMs: h.durationMs,
    totalWaves: h.totalWaves,
    totalTasks: h.totalTasks,
    succeededTasks: h.succeededTasks,
    failedTasks: h.failedTasks,
    tokens: h.tokens,
  }));
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(compact));
}

/** GET /api/history/:batchId — return full detail for one batch. */
function serveHistoryEntry(req, res, batchId) {
  const history = loadHistory();
  const entry = history.find(h => h.batchId === batchId);
  if (!entry) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Batch not found" }));
    return;
  }
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(entry));
}

/** GET /api/status-md/:taskId — return raw STATUS.md content for a task. */
function serveStatusMd(req, res, taskId) {
  if (!/^[\w-]+$/.test(taskId)) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Invalid task ID");
    return;
  }

  const activeRoot = getActiveProjectRoot();
  const state = loadBatchState(activeRoot);
  if (!state) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No batch state" }));
    return;
  }

  const task = (state.tasks || []).find(t => t.taskId === taskId);
  if (!task) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Task not found" }));
    return;
  }

  const effectiveFolder = resolveTaskFolder(task, state, activeRoot);
  if (!effectiveFolder) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Cannot resolve task folder" }));
    return;
  }

  // Try effective folder, then archive
  const candidates = [effectiveFolder];
  const archiveBase = effectiveFolder.replace(/[/\\]tasks[/\\][^/\\]+$/, "/tasks/archive/" + taskId);
  if (archiveBase !== effectiveFolder) candidates.push(archiveBase);

  for (const folder of candidates) {
    const statusPath = path.join(folder, "STATUS.md");
    try {
      const content = fs.readFileSync(statusPath, "utf-8");
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(content);
      return;
    } catch { continue; }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "STATUS.md not found" }));
}

// ─── Dashboard Preferences ──────────────────────────────────────────────────

function getPreferencesPath(root = getActiveProjectRoot()) {
  return dashboardPreferencesPathForRoot(root);
}

function handleGetPreferences(req, res) {
  const prefsPath = getPreferencesPath();
  let prefs = { theme: "dark" };
  try {
    if (fs.existsSync(prefsPath)) {
      prefs = JSON.parse(fs.readFileSync(prefsPath, "utf8"));
    }
  } catch { /* use defaults */ }
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(prefs));
}

function handlePostPreferences(req, res) {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    try {
      const incoming = JSON.parse(body);
      const prefsPath = getPreferencesPath();
      let existing = {};
      try {
        if (fs.existsSync(prefsPath)) {
          existing = JSON.parse(fs.readFileSync(prefsPath, "utf8"));
        }
      } catch { /* start fresh */ }
      const merged = { ...existing, ...incoming };
      const dir = path.dirname(prefsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(prefsPath, JSON.stringify(merged, null, 2) + "\n");
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(merged));
    } catch (err) {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });
}

function readJsonRequestBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (err) {
      callback(err);
    }
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
}

function resolveDashboardActionRequest(payload, root = getActiveProjectRoot()) {
  const state = loadBatchState(root);
  const history = loadHistory(root);
  const backlog = loadBacklogData(state, history, root);
  const taskId = typeof payload?.taskId === "string" ? payload.taskId : "";
  const actionId = typeof payload?.action === "string" ? payload.action : "";
  const backlogItem = taskId
    ? (Array.isArray(backlog.items) ? backlog.items.find((item) => item.taskId === taskId) || null : null)
    : null;
  const contract = backlogItem?.actions?.[actionId]
    || buildBatchActionContract(state)?.[actionId]
    || null;
  return { state, backlogItem, contract, actionId, taskId };
}

function runDashboardPiPrompt(promptText, callback, root = getActiveProjectRoot()) {
  const rpcWrapperPath = path.join(root, "bin", "rpc-wrapper.mjs");
  const extensionPath = path.join(root, "extensions", "taskplane", "extension.ts");
  if (!fs.existsSync(rpcWrapperPath) || !fs.existsSync(extensionPath)) {
    callback(new Error("Dashboard action runtime is unavailable in this checkout."));
    return;
  }

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const promptPath = path.join(tmpdir(), `taskplane-dashboard-action-${stamp}.md`);
  const sidecarPath = path.join(tmpdir(), `taskplane-dashboard-action-${stamp}.jsonl`);
  const summaryPath = path.join(tmpdir(), `taskplane-dashboard-action-${stamp}.summary.json`);
  fs.writeFileSync(promptPath, `${promptText.trim()}\n`, "utf-8");

  execFile(process.execPath, [
    rpcWrapperPath,
    "--sidecar-path", sidecarPath,
    "--exit-summary-path", summaryPath,
    "--prompt-file", promptPath,
    "--extensions", extensionPath,
  ], {
    cwd: root,
    env: { ...process.env },
    timeout: 120000,
    maxBuffer: 1024 * 1024,
  }, (error, stdout, stderr) => {
    let summary = null;
    try {
      if (fs.existsSync(summaryPath)) {
        summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
      }
    } catch {
      summary = null;
    }

    for (const file of [promptPath, sidecarPath, summaryPath]) {
      try { fs.unlinkSync(file); } catch {}
    }

    if (error) {
      const message = summary?.error || stderr || stdout || error.message;
      callback(new Error(String(message).trim()));
      return;
    }

    callback(null, {
      ok: summary?.error == null,
      exitCode: summary?.exitCode ?? 0,
      stdout: String(stdout || "").trim(),
      stderr: String(stderr || "").trim(),
      summary,
    });
  });
}

function handleDashboardAction(req, res) {
  readJsonRequestBody(req, (err, payload) => {
    if (err) {
      sendJson(res, 400, { error: "Invalid JSON" });
      return;
    }

    const activeRoot = getActiveProjectRoot();
    const { contract, backlogItem, actionId, taskId } = resolveDashboardActionRequest(payload, activeRoot);
    if (!contract) {
      sendJson(res, 404, { error: "Unknown dashboard action", action: actionId, taskId });
      return;
    }

    if (!payload?.confirmed && contract.confirmation) {
      sendJson(res, 409, {
        error: "Confirmation required",
        action: actionId,
        taskId,
        confirmation: contract.confirmation,
        commandPreview: contract.commandPreview || null,
      });
      return;
    }

    if (!contract.enabled) {
      sendJson(res, 409, {
        error: contract.reason || "Action is currently disabled",
        action: actionId,
        taskId,
        supported: contract.invokeMode === "post",
        commandPreview: contract.commandPreview || null,
      });
      return;
    }

    if (contract.invokeMode !== "post") {
      sendJson(res, 501, {
        error: contract.reason || "Direct execution is not supported yet",
        action: actionId,
        taskId,
        supported: false,
        commandPreview: contract.commandPreview || null,
      });
      return;
    }

    const promptText = actionId === "start"
      ? `/orch ${backlogItem?.navigation?.promptPath || backlogItem?.promptPath || ""}`
      : (actionId === "integrate" ? "/orch-integrate" : "");

    if (!promptText.trim()) {
      sendJson(res, 400, { error: "Action is missing a runnable command", action: actionId, taskId });
      return;
    }

    runDashboardPiPrompt(promptText, (runErr, result) => {
      if (runErr) {
        sendJson(res, 500, {
          error: runErr.message,
          action: actionId,
          taskId,
          commandPreview: contract.commandPreview || null,
        });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        action: actionId,
        taskId,
        commandPreview: contract.commandPreview || null,
        summary: result?.summary || null,
        output: result?.stdout || result?.stderr || "Command completed.",
      });
    }, activeRoot);
  });
}

function handleProjectSelection(req, res) {
  readJsonRequestBody(req, (err, payload) => {
    if (err) {
      sendJson(res, 400, { error: "Invalid JSON" });
      return;
    }

    const projectId = typeof payload?.projectId === "string" ? payload.projectId.trim() : "";
    if (!projectId) {
      sendJson(res, 400, { error: "projectId is required" });
      return;
    }

    const registryProjects = loadProjectRegistry();
    const project = registryProjects.find((item) => String(item.id || "").trim() === projectId);
    if (!project || typeof project.rootPath !== "string" || !project.rootPath.trim()) {
      sendJson(res, 404, { error: "Project not found", projectId });
      return;
    }

    SELECTED_PROJECT_ID = projectId;
    SELECTED_PROJECT_ROOT = path.resolve(project.rootPath);
    const recencyUpdated = refreshProjectRecency(projectId, SELECTED_PROJECT_ROOT);
    sendJson(res, 200, {
      ok: true,
      projectId,
      recencyUpdated,
      state: buildDashboardState(SELECTED_PROJECT_ROOT),
    });
  });
}

// ─── HTTP Server ────────────────────────────────────────────────────────────

function createServer() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;

    if (pathname === "/api/stream" && req.method === "GET") {
      handleSSE(req, res);
    } else if (pathname.startsWith("/api/conversation/") && req.method === "GET") {
      const prefix = pathname.slice("/api/conversation/".length);
      serveConversation(req, res, prefix);
    } else if (pathname.startsWith("/api/agent-events/") && req.method === "GET") {
      // TP-107: Serve Runtime V2 agent events (hardened)
      const agentId = decodeURIComponent(pathname.slice("/api/agent-events/".length));
      // Strict validation: same pattern as /api/conversation/:prefix
      if (!/^[\w-]+$/.test(agentId)) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Invalid agent ID");
        return;
      }
      const activeRoot = getActiveProjectRoot();
      const batchState = loadBatchState(activeRoot);
      // Path containment: verify resolved path stays inside runtime dir
      if (batchState?.batchId) {
        const runtimeBase = path.join(activeRoot, ".pi", "runtime", batchState.batchId, "agents");
        const resolvedAgent = path.resolve(runtimeBase, agentId);
        if (!resolvedAgent.startsWith(path.resolve(runtimeBase))) {
          res.writeHead(403, { "Content-Type": "text/plain" });
          res.end("Forbidden");
          return;
        }
      }
      // Optional: ?sinceTs= to return only events after a timestamp
      const reqUrl = new URL(req.url, "http://localhost");
      const sinceTs = parseInt(reqUrl.searchParams.get("sinceTs") || "0", 10);
      let events = loadRuntimeAgentEvents(batchState?.batchId, agentId, 300, activeRoot);
      if (sinceTs > 0) {
        events = events.filter(e => (e.ts || 0) > sinceTs);
      }
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify(events));
    } else if (pathname === "/api/state" && req.method === "GET") {
      const state = buildDashboardState();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(state));
    } else if (pathname === "/api/history" && req.method === "GET") {
      serveHistory(req, res);
    } else if (pathname.startsWith("/api/history/") && req.method === "GET") {
      const batchId = decodeURIComponent(pathname.slice("/api/history/".length));
      serveHistoryEntry(req, res, batchId);
    } else if (pathname.startsWith("/api/status-md/") && req.method === "GET") {
      const taskId = decodeURIComponent(pathname.slice("/api/status-md/".length));
      serveStatusMd(req, res, taskId);
    } else if (pathname === "/api/preferences" && req.method === "GET") {
      handleGetPreferences(req, res);
    } else if (pathname === "/api/preferences" && req.method === "POST") {
      handlePostPreferences(req, res);
    } else if (pathname === "/api/projects/select" && req.method === "POST") {
      handleProjectSelection(req, res);
    } else if (pathname === "/api/task-authoring" && req.method === "GET") {
      handleTaskAuthoringMetadata(req, res);
    } else if (pathname === "/api/task-authoring/preview" && req.method === "POST") {
      handleTaskAuthoringPreview(req, res);
    } else if (pathname === "/api/task-authoring/create" && req.method === "POST") {
      handleTaskAuthoringCreate(req, res);
    } else if (pathname === "/api/actions" && req.method === "POST") {
      handleDashboardAction(req, res);
    } else if (req.method === "OPTIONS") {
      // CORS preflight for POST
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
    } else {
      serveStatic(req, res);
    }
  });

  return server;
}

// ─── Browser Auto-Open ─────────────────────────────────────────────────────

function openBrowser(url) {
  const cmd = process.platform === "win32" ? "start"
    : process.platform === "darwin" ? "open" : "xdg-open";
  exec(`${cmd} ${url}`, () => {}); // fire-and-forget
}

// ─── Main ───────────────────────────────────────────────────────────────────

/** Try to listen on a port. Resolves with the port on success, rejects on EADDRINUSE. */
function tryListen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve(port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

/** Find an available port starting from `start`, trying up to MAX_PORT_ATTEMPTS. */
async function findPort(server, start, explicit) {
  // If the user explicitly passed --port, only try that one
  if (explicit) {
    try {
      return await tryListen(server, start);
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        console.error(`\n  Port ${start} is already in use.`);
        console.error(`  Try: taskplane dashboard --port ${start + 1}\n`);
        process.exit(1);
      }
      throw err;
    }
  }
  // Auto-scan for an available port
  for (let port = start; port < start + MAX_PORT_ATTEMPTS; port++) {
    try {
      return await tryListen(server, port);
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        // Close the server so we can retry on the next port
        server.close();
        server = createServer();
        continue;
      }
      throw err;
    }
  }
  console.error(`\n  No available port found in range ${start}-${start + MAX_PORT_ATTEMPTS - 1}.\n`);
  process.exit(1);
}

async function main() {
  const opts = parseArgs();

  // Resolve project root: --root flag > cwd.
  // In workspace mode this is the workspace root. Runtime sidecar files
  // (batch-state, lane-state, conversation logs, batch-history) live at
  // <REPO_ROOT>/.pi/ and are NOT affected by taskplane-pointer.json.
  // Backlog discovery now reads task-area config, so config lookup follows the
  // pointer-aware resolution chain while runtime state remains rooted here.
  REPO_ROOT = path.resolve(opts.root || process.cwd());
  BATCH_STATE_PATH = path.join(REPO_ROOT, ".pi", "batch-state.json");
  BATCH_HISTORY_PATH = path.join(REPO_ROOT, ".pi", "batch-history.json");
  SELECTED_PROJECT_ROOT = REPO_ROOT;
  const initialProject = loadProjectRegistry().find((project) => normalizeProjectRoot(project.rootPath) === normalizeProjectRoot(REPO_ROOT));
  SELECTED_PROJECT_ID = initialProject?.id || `current:${normalizeProjectRoot(REPO_ROOT)}`;

  const server = createServer();
  const explicitPort = process.argv.slice(2).includes("--port");
  const port = await findPort(server, opts.port, explicitPort);

  console.log(`\n  Orchestrator Dashboard → http://localhost:${port}\n`);

  // Broadcast state to all SSE clients on interval
  const pollTimer = setInterval(broadcastState, POLL_INTERVAL);

  // Also watch batch-state.json for immediate push on change
  try {
    const batchDir = path.dirname(BATCH_STATE_PATH);
    if (fs.existsSync(batchDir)) {
      let debounce = null;
      fs.watch(batchDir, (eventType, filename) => {
        if (filename === "batch-state.json") {
          clearTimeout(debounce);
          debounce = setTimeout(broadcastState, 200);
        }
      });
    }
  } catch {
    // fs.watch not supported — polling is sufficient
  }

  // Auto-open browser
  if (opts.open) {
    setTimeout(() => openBrowser(`http://localhost:${port}`), 500);
  }

  // Graceful shutdown
  function cleanup() {
    clearInterval(pollTimer);
    for (const client of sseClients) {
      try { client.end(); } catch {}
    }
    server.close();
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main();
