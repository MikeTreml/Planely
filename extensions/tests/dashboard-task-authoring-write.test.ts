import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
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

function createContext(root: string, fsImpl: any = fs) {
	return {
		fs: fsImpl,
		path,
		process,
		REPO_ROOT: root,
		getActiveProjectRoot: () => root,
	};
}

describe("TP-184 dashboard task authoring write flow", () => {
	const source = readFileSync(
		join(__dirname, "..", "..", "dashboard", "server.cjs"),
		"utf-8",
	).replace(/\r\n/g, "\n");

	const helperBlock = extractBlock(
		source,
		"function readDashboardJsonConfig(root)",
		"function extractBacklogSection(content, heading)",
	);

	function writeConfig(root: string, nextTaskId = "TP-400") {
		mkdirSync(join(root, ".pi"), { recursive: true });
		mkdirSync(join(root, "taskplane-tasks"), { recursive: true });
		writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
			taskRunner: {
				taskAreas: {
					general: {
						path: "taskplane-tasks",
						prefix: "TP",
						context: "taskplane-tasks/CONTEXT.md",
					},
				},
			},
		}, null, 2));
		writeFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), `# General\n\n**Next Task ID:** ${nextTaskId}\n`);
	}

	function authoringPayload() {
		return {
			areaId: "general",
			title: "Create task packet from dashboard",
			mission: "Persist a canonical Taskplane packet from the dashboard authoring flow.",
			size: "M",
			reviewLevel: 2,
			complexity: {
				blastRadius: 1,
				patternNovelty: 2,
				security: 0,
				reversibility: 1,
			},
			dependencies: ["TP-180"],
			contextRefs: ["docs/specifications/operator-console/view-models.md — contract reference"],
			fileScope: ["dashboard/server.cjs", "dashboard/public/app.js"],
		};
	}

	it("creates packet files and increments Next Task ID from the shared preview generator", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-create-"));
		try {
			writeConfig(root, "TP-400");
			const context = createContext(root);
			const { createTaskAuthoringPacket } = vm.runInNewContext(
				`${helperBlock}; ({ createTaskAuthoringPacket });`,
				context,
			) as { createTaskAuthoringPacket: (payload: any, root?: string) => any };

			const result = createTaskAuthoringPacket(authoringPayload(), root);
			expect(result.ok).toBe(true);
			expect(result.statusCode).toBe(201);
			expect(result.created.taskId).toBe("TP-400");
			expect(result.created.nextTaskId).toBe("TP-401");
			expect(result.created.folderPath).toBe("taskplane-tasks/TP-400-create-task-packet-from-dashboard");

			const promptPath = join(root, result.created.promptPath);
			const statusPath = join(root, result.created.statusPath);
			expect(existsSync(promptPath)).toBe(true);
			expect(existsSync(statusPath)).toBe(true);
			expect(existsSync(join(root, result.created.folderPath, ".reviews"))).toBe(true);
			expect(readFileSync(promptPath, "utf-8")).toBe(`${result.preview.preview.promptMarkdown.trimEnd()}\n`);
			expect(readFileSync(statusPath, "utf-8")).toBe(`${result.preview.preview.statusMarkdown.trimEnd()}\n`);
			expect(readFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "utf-8")).toContain("**Next Task ID:** TP-401");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("blocks duplicate task IDs or folders without mutating CONTEXT.md", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-duplicate-"));
		try {
			writeConfig(root, "TP-400");
			mkdirSync(join(root, "taskplane-tasks", "TP-400-existing-task"), { recursive: true });
			const before = readFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "utf-8");
			const context = createContext(root);
			const { createTaskAuthoringPacket } = vm.runInNewContext(
				`${helperBlock}; ({ createTaskAuthoringPacket });`,
				context,
			) as { createTaskAuthoringPacket: (payload: any, root?: string) => any };

			const result = createTaskAuthoringPacket(authoringPayload(), root);
			expect(result.ok).toBe(false);
			expect(result.statusCode).toBe(409);
			expect(result.error.code).toBe("TASK_ID_CONFLICT");
			expect(readFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "utf-8")).toBe(before);
			expect(existsSync(join(root, "taskplane-tasks", "TP-400-create-task-packet-from-dashboard"))).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("returns a conflict when the target folder is claimed during rename without deleting it", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-race-"));
		try {
			writeConfig(root, "TP-400");
			const finalFolder = join(root, "taskplane-tasks", "TP-400-create-task-packet-from-dashboard");
			const fsImpl = {
				...fs,
				renameSync(oldPath: fs.PathLike, newPath: fs.PathLike) {
					mkdirSync(String(newPath), { recursive: true });
					writeFileSync(join(String(newPath), "PROMPT.md"), "other request\n");
					const err: any = new Error("folder exists");
					err.code = "EEXIST";
					throw err;
				},
			};
			const context = createContext(root, fsImpl);
			const { createTaskAuthoringPacket } = vm.runInNewContext(
				`${helperBlock}; ({ createTaskAuthoringPacket });`,
				context,
			) as { createTaskAuthoringPacket: (payload: any, root?: string) => any };

			const result = createTaskAuthoringPacket(authoringPayload(), root);
			expect(result.ok).toBe(false);
			expect(result.statusCode).toBe(409);
			expect(result.error.code).toBe("TASK_FOLDER_CLAIMED");
			expect(existsSync(finalFolder)).toBe(true);
			expect(readFileSync(join(finalFolder, "PROMPT.md"), "utf-8")).toBe("other request\n");
			expect(readFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "utf-8")).toContain("**Next Task ID:** TP-400");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("rolls back the new task folder when CONTEXT.md update fails", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-rollback-"));
		try {
			writeConfig(root, "TP-400");
			const fsImpl = {
				...fs,
				writeFileSync(targetPath: fs.PathOrFileDescriptor, data: string, options?: any) {
					if (String(targetPath).replace(/\\/g, "/").endsWith("taskplane-tasks/CONTEXT.md")) {
						throw new Error("disk full");
					}
					return fs.writeFileSync(targetPath, data, options);
				},
			};
			const context = createContext(root, fsImpl);
			const { createTaskAuthoringPacket } = vm.runInNewContext(
				`${helperBlock}; ({ createTaskAuthoringPacket });`,
				context,
			) as { createTaskAuthoringPacket: (payload: any, root?: string) => any };

			const result = createTaskAuthoringPacket(authoringPayload(), root);
			expect(result.ok).toBe(false);
			expect(result.statusCode).toBe(500);
			expect(result.error.code).toBe("CONTEXT_WRITE_FAILED");
			expect(result.error.recoverable).toBe(true);
			expect(result.error.rollbackSucceeded).toBe(true);
			expect(existsSync(join(root, "taskplane-tasks", "TP-400-create-task-packet-from-dashboard"))).toBe(false);
			expect(readFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "utf-8")).toContain("**Next Task ID:** TP-400");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("wires the task authoring create endpoint into the dashboard server", () => {
		expect(source).toContain('pathname === "/api/task-authoring/create" && req.method === "POST"');
		expect(source).toContain("function handleTaskAuthoringCreate(req, res)");
		expect(source).toContain("function createTaskAuthoringPacket(payload, root = getActiveProjectRoot())");
	});
});
