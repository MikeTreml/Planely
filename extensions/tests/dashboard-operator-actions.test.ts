import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readDashboard(file: string): string {
	return readFileSync(join(__dirname, "..", "..", "dashboard", file), "utf-8").replace(/\r\n/g, "\n");
}

describe("TP-183 dashboard operator actions", () => {
	it("ships the task detail shell in the dashboard markup", () => {
		const html = readDashboard("public/index.html");
		expect(html).toContain('id="task-detail-panel"');
		expect(html).toContain('id="task-detail-title"');
		expect(html).toContain('id="task-detail-body"');
	});

	it("renders task detail and action helpers in the frontend", () => {
		const app = readDashboard("public/app.js");
		expect(app).toContain("function renderTaskDetail()");
		expect(app).toContain("const dashboardActionState");
		expect(app).toContain("function taskActionButtonHtml(action, taskId, batchScoped)");
		expect(app).toContain('fetch("/api/actions"');
		expect(app).toContain('action.invokeMode === "copy"');
		expect(app).toContain("data-dashboard-action");
	});

	it("adds server support for dashboard actions", () => {
		const server = readDashboard("server.cjs");
		expect(server).toContain("function buildTaskActionContract(item, batchState)");
		expect(server).toContain("function buildBatchActionContract(batchState)");
		expect(server).toContain("function handleDashboardAction(req, res)");
		expect(server).toContain("function runDashboardPiPrompt(promptText, callback");
		expect(server).toContain('pathname === "/api/actions" && req.method === "POST"');
	});
});
