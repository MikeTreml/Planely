import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractBlock(source: string, signature: string, nextMarker: string): string {
	const start = source.indexOf(signature);
	if (start < 0) throw new Error(`Missing signature: ${signature}`);
	const end = source.indexOf(nextMarker, start);
	if (end < 0) throw new Error(`Missing marker: ${nextMarker}`);
	return source.slice(start, end).trim();
}

function writeTaskPacket(root: string, folderName: string, prompt: string, status?: string, done = false) {
	const folder = join(root, "taskplane-tasks", folderName);
	mkdirSync(folder, { recursive: true });
	writeFileSync(join(folder, "PROMPT.md"), prompt);
	if (status) writeFileSync(join(folder, "STATUS.md"), status);
	if (done) writeFileSync(join(folder, ".DONE"), "");
	return folder;
}

describe("TP-182 dashboard backlog loading", () => {
	const source = readFileSync(
		join(__dirname, "..", "..", "dashboard", "server.cjs"),
		"utf-8",
	).replace(/\r\n/g, "\n");

	const helperBlock = extractBlock(
		source,
		"function readDashboardJsonConfig(root)",
		"function loadHistory(root = getActiveProjectRoot())",
	);

	it("loads backlog packets from task areas and reports malformed packets as partial", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-182-backlog-"));
		try {
			mkdirSync(join(root, ".pi"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				taskRunner: {
					taskAreas: {
						general: { path: "taskplane-tasks", repoId: "planely" },
					},
				},
			}, null, 2));

			writeTaskPacket(
				root,
				"TP-199-done-task",
				"# Task: TP-199 - Done task\n\n## Mission\nDone task mission.\n",
				"**Status:** ✅ Complete\n",
				true,
			);
			writeTaskPacket(
				root,
				"TP-200-ready-task",
				"# Task: TP-200 - Ready task\n\n## Mission\nReady task mission.\n\n## Dependencies\n- TP-199\n",
				"**Status:** ⬜ Not Started\n",
			);
			writeTaskPacket(
				root,
				"TP-201-running-task",
				"# Task: TP-201 - Running task\n\n## Mission\nRunning task mission.\n",
				"**Status:** 🟡 In Progress\n",
			);
			writeTaskPacket(
				root,
				"misc-bad-packet",
				"# Not a valid task heading\n",
			);

			const context = {
				fs,
				path,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
				parseStatusMd(taskFolder: string) {
					const statusPath = join(taskFolder, "STATUS.md");
					if (!existsSync(statusPath)) return null;
					const content = readFileSync(statusPath, "utf-8");
					const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
					return {
						status: statusMatch ? statusMatch[1].trim() : "Unknown",
						reviews: 0,
						updatedAt: statSync(statusPath).mtimeMs,
					};
				},
				checkDoneFile(taskFolder: string) {
					return existsSync(join(taskFolder, ".DONE"));
				},
			};

			const { loadBacklogData } = vm.runInNewContext(
				`${helperBlock}; ({ loadBacklogData });`,
				context,
			) as { loadBacklogData: (state: any, history: any[]) => any };

			const backlog = loadBacklogData({
				mode: "workspace",
				tasks: [
					{ taskId: "TP-201", status: "running", batchId: "batch-1", laneNumber: 2, resolvedRepoId: "planely" },
				],
			}, []);

			expect(backlog.items).toHaveLength(3);
			expect(backlog.loadState.kind).toBe("partial");
			expect(backlog.errors).toHaveLength(1);
			expect(backlog.scope.mode).toBe("workspace");
			expect(backlog.scope.repoIds).toContain("planely");
			expect(backlog.summary.running).toBe(1);

			const readyItem = backlog.items.find((item: any) => item.taskId === "TP-200");
			expect(readyItem.status.key).toBe("ready");
			expect(readyItem.readiness.isReady).toBe(true);

			const runningItem = backlog.items.find((item: any) => item.taskId === "TP-201");
			expect(runningItem.status.key).toBe("running");
			expect(runningItem.execution.batchId).toBe("batch-1");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("falls back to legacy task-runner.yaml when JSON config is absent", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-182-backlog-yaml-"));
		try {
			mkdirSync(join(root, ".pi"), { recursive: true });
			writeFileSync(join(root, ".pi", "task-runner.yaml"), [
				"task_areas:",
				"  general:",
				"    path: taskplane-tasks",
				"    prefix: TP",
				"    repo_id: planely",
			].join("\n"));

			writeTaskPacket(
				root,
				"TP-250-yaml-task",
				"# Task: TP-250 - YAML task\n\n## Mission\nLegacy config fallback.\n",
				"**Status:** ⬜ Not Started\n",
			);

			const context = {
				fs,
				path,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
				parseStatusMd(taskFolder: string) {
					const statusPath = join(taskFolder, "STATUS.md");
					if (!existsSync(statusPath)) return null;
					const content = readFileSync(statusPath, "utf-8");
					const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
					return {
						status: statusMatch ? statusMatch[1].trim() : "Unknown",
						reviews: 0,
						updatedAt: statSync(statusPath).mtimeMs,
					};
				},
				checkDoneFile(taskFolder: string) {
					return existsSync(join(taskFolder, ".DONE"));
				},
			};

			const { loadBacklogData } = vm.runInNewContext(
				`${helperBlock}; ({ loadBacklogData });`,
				context,
			) as { loadBacklogData: (state: any, history: any[]) => any };

			const backlog = loadBacklogData(null, []);
			expect(backlog.items).toHaveLength(1);
			expect(backlog.items[0].taskId).toBe("TP-250");
			expect(backlog.scope.repoIds).toContain("planely");
			expect(backlog.loadState.kind).toBe("ready");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("prefers taskplane-config.json over stale legacy YAML when both exist", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-182-backlog-precedence-"));
		try {
			mkdirSync(join(root, ".pi"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				taskRunner: { taskAreas: {} },
			}, null, 2));
			writeFileSync(join(root, ".pi", "task-runner.yaml"), [
				"task_areas:",
				"  legacy:",
				"    path: taskplane-tasks",
				"    prefix: TP",
			].join("\n"));

			writeTaskPacket(
				root,
				"TP-260-should-stay-hidden",
				"# Task: TP-260 - Hidden task\n\n## Mission\nJSON config is authoritative.\n",
				"**Status:** ⬜ Not Started\n",
			);

			const context = {
				fs,
				path,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
				parseStatusMd(taskFolder: string) {
					const statusPath = join(taskFolder, "STATUS.md");
					if (!existsSync(statusPath)) return null;
					const content = readFileSync(statusPath, "utf-8");
					const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
					return {
						status: statusMatch ? statusMatch[1].trim() : "Unknown",
						reviews: 0,
						updatedAt: statSync(statusPath).mtimeMs,
					};
				},
				checkDoneFile(taskFolder: string) {
					return existsSync(join(taskFolder, ".DONE"));
				},
			};

			const { loadBacklogData } = vm.runInNewContext(
				`${helperBlock}; ({ loadBacklogData });`,
				context,
			) as { loadBacklogData: (state: any, history: any[]) => any };

			const backlog = loadBacklogData(null, []);
			expect(backlog.items).toHaveLength(0);
			expect(backlog.loadState.kind).toBe("empty");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("loads backlog config from a pointer-resolved workspace config root", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-182-backlog-pointer-"));
		try {
			const configRepo = join(root, "config-repo");
			mkdirSync(join(root, ".pi"), { recursive: true });
			mkdirSync(join(configRepo, ".taskplane"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				workspace: {
					repos: {
						config: { path: configRepo.replace(/\\/g, "/") },
					},
					routing: { defaultRepo: "config" },
				},
			}, null, 2));
			writeFileSync(join(root, ".pi", "taskplane-pointer.json"), JSON.stringify({
				config_repo: "config",
				config_path: ".taskplane",
			}, null, 2));
			writeFileSync(join(configRepo, ".taskplane", "taskplane-config.json"), JSON.stringify({
				taskRunner: {
					taskAreas: {
						general: { path: "taskplane-tasks", repoId: "planely" },
					},
				},
			}, null, 2));

			writeTaskPacket(
				configRepo,
				"TP-270-pointer-task",
				"# Task: TP-270 - Pointer task\n\n## Mission\nPointer-resolved config.\n",
				"**Status:** ⬜ Not Started\n",
			);

			const context = {
				fs,
				path,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
				parseStatusMd(taskFolder: string) {
					const statusPath = join(taskFolder, "STATUS.md");
					if (!existsSync(statusPath)) return null;
					const content = readFileSync(statusPath, "utf-8");
					const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
					return {
						status: statusMatch ? statusMatch[1].trim() : "Unknown",
						reviews: 0,
						updatedAt: statSync(statusPath).mtimeMs,
					};
				},
				checkDoneFile(taskFolder: string) {
					return existsSync(join(taskFolder, ".DONE"));
				},
			};

			const { loadBacklogData } = vm.runInNewContext(
				`${helperBlock}; ({ loadBacklogData });`,
				context,
			) as { loadBacklogData: (state: any, history: any[]) => any };

			const backlog = loadBacklogData(null, []);
			expect(backlog.items).toHaveLength(1);
			expect(backlog.items[0].taskId).toBe("TP-270");
			expect(backlog.scope.mode).toBe("workspace");
			expect(backlog.scope.configuredRepoIds).toContain("config");
			expect(backlog.loadState.kind).toBe("ready");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("treats JSON workspace metadata as authoritative over legacy workspace YAML", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-182-backlog-ws-precedence-"));
		try {
			const configRepo = join(root, "config-repo");
			mkdirSync(join(root, ".pi"), { recursive: true });
			mkdirSync(join(configRepo, ".taskplane"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				workspace: { repos: {}, routing: { defaultRepo: "config" } },
			}, null, 2));
			writeFileSync(join(root, ".pi", "taskplane-workspace.yaml"), [
				"repos:",
				"  config:",
				`    path: ${configRepo.replace(/\\/g, "/")}`,
				"routing:",
				"  default_repo: config",
			].join("\n"));
			writeFileSync(join(root, ".pi", "taskplane-pointer.json"), JSON.stringify({
				config_repo: "config",
				config_path: ".taskplane",
			}, null, 2));
			writeFileSync(join(configRepo, ".taskplane", "taskplane-config.json"), JSON.stringify({
				taskRunner: {
					taskAreas: {
						general: { path: "taskplane-tasks", repoId: "planely" },
					},
				},
			}, null, 2));
			writeTaskPacket(
				configRepo,
				"TP-280-should-not-load",
				"# Task: TP-280 - Hidden pointer task\n\n## Mission\nJSON workspace metadata wins.\n",
				"**Status:** ⬜ Not Started\n",
			);

			const context = {
				fs,
				path,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
				parseStatusMd(taskFolder: string) {
					const statusPath = join(taskFolder, "STATUS.md");
					if (!existsSync(statusPath)) return null;
					const content = readFileSync(statusPath, "utf-8");
					const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
					return {
						status: statusMatch ? statusMatch[1].trim() : "Unknown",
						reviews: 0,
						updatedAt: statSync(statusPath).mtimeMs,
					};
				},
				checkDoneFile(taskFolder: string) {
					return existsSync(join(taskFolder, ".DONE"));
				},
			};

			const { loadBacklogData } = vm.runInNewContext(
				`${helperBlock}; ({ loadBacklogData });`,
				context,
			) as { loadBacklogData: (state: any, history: any[]) => any };

			const backlog = loadBacklogData(null, []);
			expect(backlog.items).toHaveLength(0);
			expect(backlog.scope.mode).toBe("repo");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("re-reads task packet status changes on subsequent backlog loads", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-189-backlog-refresh-"));
		try {
			mkdirSync(join(root, ".pi"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				taskRunner: {
					taskAreas: {
						general: { path: "taskplane-tasks", repoId: "planely" },
					},
				},
			}, null, 2));

			const taskFolder = writeTaskPacket(
				root,
				"TP-310-refresh-task",
				"# Task: TP-310 - Refresh task\n\n## Mission\nRefresh after edits.\n",
				"**Status:** ⬜ Not Started\n",
			);

			const context = {
				fs,
				path,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
				parseStatusMd(taskFolderPath: string) {
					const statusPath = join(taskFolderPath, "STATUS.md");
					if (!existsSync(statusPath)) return null;
					const content = readFileSync(statusPath, "utf-8");
					const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
					return {
						status: statusMatch ? statusMatch[1].trim() : "Unknown",
						reviews: 0,
						updatedAt: statSync(statusPath).mtimeMs,
					};
				},
				checkDoneFile(taskFolderPath: string) {
					return existsSync(join(taskFolderPath, ".DONE"));
				},
			};

			const { loadBacklogData } = vm.runInNewContext(
				`${helperBlock}; ({ loadBacklogData });`,
				context,
			) as { loadBacklogData: (state: any, history: any[]) => any };

			const initial = loadBacklogData(null, []);
			expect(initial.items[0].status.key).toBe("ready");

			writeFileSync(join(taskFolder, "STATUS.md"), "**Status:** ✅ Complete\n");
			writeFileSync(join(taskFolder, ".DONE"), "");

			const refreshed = loadBacklogData(null, []);
			expect(refreshed.items[0].status.key).toBe("succeeded");
			expect(refreshed.summary.succeeded).toBe(1);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("exposes backlog data from buildDashboardState even when no batch is active", () => {
		const buildStateBlock = extractBlock(
			source,
			"function buildDashboardState(root = getActiveProjectRoot())",
			"// ─── Static File Serving",
		);

		const buildDashboardState = vm.runInNewContext(
			`${buildStateBlock}; buildDashboardState;`,
			{
				getActiveProjectRoot: () => "/tmp/project",
				loadBatchState: () => null,
				getActiveSessions: () => [],
				loadLaneStates: () => ({}),
				loadTelemetryData: () => ({}),
				computeBatchTotalCost: () => 0,
				loadSupervisorData: () => null,
				loadHistory: () => [],
				loadBacklogData: () => ({ items: [{ taskId: "TP-300" }], summary: { total: 1 }, loadState: { kind: "ready" } }),
				buildBatchActionContract: () => ({ integrate: { enabled: false } }),
				buildProjectSidebar: () => ({ selectedProjectId: null, sections: [] }),
				projectDisplayNameFromRoot: () => "Project",
				SELECTED_PROJECT_ID: "current:demo",
				Date,
			},
		) as () => any;

		const state = buildDashboardState();
		expect(state.batch).toBe(null);
		expect(state.backlog.items).toHaveLength(1);
		expect(state.backlog.summary.total).toBe(1);
	});
});
