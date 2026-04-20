import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readDashboard(file: string): string {
	return readFileSync(join(__dirname, "..", "..", "dashboard", "public", file), "utf-8").replace(/\r\n/g, "\n");
}

describe("TP-184 dashboard task authoring UI", () => {
	it("adds create-task form and preview shell to backlog view", () => {
		const html = readDashboard("index.html");
		expect(html).toContain('id="task-authoring-shell"');
		expect(html).toContain('id="task-authoring-form"');
		expect(html).toContain('id="task-authoring-area"');
		expect(html).toContain('id="task-authoring-title"');
		expect(html).toContain('id="task-authoring-mission"');
		expect(html).toContain('id="task-authoring-preview-button"');
		expect(html).toContain('id="task-authoring-create-button"');
		expect(html).toContain('id="task-authoring-prompt-preview"');
		expect(html).toContain('id="task-authoring-status-preview"');
	});

	it("wires metadata, preview, and create interactions in the dashboard app", () => {
		const app = readDashboard("app.js");
		expect(app).toContain("const taskAuthoringState = {");
		expect(app).toContain("function ensureTaskAuthoringMetadata(force = false)");
		expect(app).toContain("function requestTaskAuthoringPreview()");
		expect(app).toContain("function submitTaskAuthoringCreate()");
		expect(app).toContain('fetch("/api/task-authoring")');
		expect(app).toContain('fetch("/api/task-authoring/preview"');
		expect(app).toContain('fetch("/api/task-authoring/create"');
		expect(app).toContain("selectedBacklogTaskId = result.created?.taskId || selectedBacklogTaskId;");
	});

	it("styles authoring cards, feedback, and preview panes", () => {
		const css = readDashboard("style.css");
		expect(css).toContain(".task-authoring-grid {");
		expect(css).toContain(".task-authoring-card {");
		expect(css).toContain(".task-authoring-feedback.tone-success {");
		expect(css).toContain(".task-authoring-preview-grid {");
		expect(css).toContain(".task-authoring-code {");
	});
});
