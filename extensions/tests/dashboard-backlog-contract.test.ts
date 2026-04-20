import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractFunctionBlock(source: string, signature: string, nextMarker: string): string {
	const start = source.indexOf(signature);
	if (start < 0) throw new Error(`Missing signature: ${signature}`);
	const end = source.indexOf(nextMarker, start);
	if (end < 0) throw new Error(`Missing marker: ${nextMarker}`);
	return source.slice(start, end).trim();
}

describe("TP-182 dashboard backlog contract", () => {
	const source = readFileSync(
		join(__dirname, "..", "..", "dashboard", "server.cjs"),
		"utf-8",
	).replace(/\r\n/g, "\n");

	const fnBlock = extractFunctionBlock(
		source,
		"function buildBacklogDisplayStatus(packet, context)",
		"function loadHistory()",
	);

	const { buildBacklogDisplayStatus, buildBacklogItem } = vm.runInNewContext(
		`${fnBlock}; ({ buildBacklogDisplayStatus, buildBacklogItem });`,
		{},
	) as {
		buildBacklogDisplayStatus: (packet: any, context: any) => any;
		buildBacklogItem: (packet: any, context: any) => any;
	};

	it("maps dependency blockers to a blocked backlog status", () => {
		const packet = {
			taskId: "TP-100",
			title: "Blocked task",
			statusData: { status: "🟡 In Progress", reviews: 1 },
		};

		const status = buildBacklogDisplayStatus(packet, {
			blockedDependencies: [{ kind: "task", id: "TP-099", label: "TP-099", exists: true }],
		});

		expect(status.key).toBe("blocked");
		expect(status.label).toBe("Blocked");
		expect(status.reason).toContain("dependency");
	});

	it("maps active batch execution to running", () => {
		const packet = {
			taskId: "TP-101",
			title: "Running task",
			statusData: { status: "🟡 In Progress", reviews: 0 },
		};

		const status = buildBacklogDisplayStatus(packet, {
			activeTask: { batchId: "batch-7", status: "running", laneNumber: 2 },
		});

		expect(status.key).toBe("running");
		expect(status.reason).toContain("batch-7");
	});

	it("maps done markers to succeeded", () => {
		const packet = {
			taskId: "TP-102",
			title: "Completed task",
			doneFileFound: true,
			statusData: { status: "✅ Complete", reviews: 3 },
		};

		const status = buildBacklogDisplayStatus(packet, {});
		expect(status.key).toBe("succeeded");
		expect(status.source).toContain(".DONE");
	});

	it("builds backlog rows with readiness, activity, and navigation metadata", () => {
		const packet = {
			taskId: "TP-103",
			title: "Ready task",
			summary: "Short summary",
			area: "general",
			repoId: "planely",
			taskFolder: "taskplane-tasks/TP-103-ready-task",
			promptPath: "taskplane-tasks/TP-103-ready-task/PROMPT.md",
			statusPath: "taskplane-tasks/TP-103-ready-task/STATUS.md",
			dependencies: [],
			statusData: {
				status: "⬜ Not Started",
				reviews: 2,
				updatedAt: 1710000000000,
			},
		};

		const item = buildBacklogItem(packet, {
			completedDependencies: [],
			blockedDependencies: [],
			historyEntry: { batchId: "batch-old", status: "completed", endedAt: 1700000000000 },
		});

		expect(item.status.key).toBe("ready");
		expect(item.readiness.isReady).toBe(true);
		expect(item.lastActivityAt).toBe(1710000000000);
		expect(item.counts.reviewCount).toBe(2);
		expect(item.navigation.id).toBe("TP-103");
		expect(item.navigation.promptPath).toContain("PROMPT.md");
		expect(item.navigation.statusPath).toContain("STATUS.md");
		expect(item.navigation.taskFolder).toContain("TP-103-ready-task");
	});
});
