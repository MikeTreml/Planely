import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readDashboard(file: string): string {
	return readFileSync(join(__dirname, "..", "..", "dashboard", file), "utf-8").replace(/\r\n/g, "\n");
}

describe("TP-187 dashboard project sidebar", () => {
	it("ships a project sidebar shell in dashboard markup and styles", () => {
		const html = readDashboard("public/index.html");
		const css = readDashboard("public/style.css");

		expect(html).toContain('id="project-sidebar"');
		expect(html).toContain('id="project-sidebar-body"');
		expect(html).toContain('id="project-sidebar-subtitle"');
		expect(html).toContain('id="workspace-layout"');
		expect(css).toContain(".workspace-layout");
		expect(css).toContain(".project-sidebar");
		expect(css).toContain(".project-row.selected");
	});

	it("renders sidebar data and project-switch behavior through dedicated helpers", () => {
		const app = readDashboard("public/app.js");

		expect(app).toContain("function renderProjectSidebar(data)");
		expect(app).toContain("function clearProjectScopedUiState(nextData)");
		expect(app).toContain("async function selectProject(projectId)");
		expect(app).toContain('fetch("/api/projects/select"');
		expect(app).toContain("$projectSidebarBody?.addEventListener");
		expect(app).toContain("renderProjectSidebar(data);");
	});

	it("adds server support for project sidebar state and switching", () => {
		const server = readDashboard("server.cjs");

		expect(server).toContain("function buildProjectSidebar(root = getActiveProjectRoot(), state = null)");
		expect(server).toContain("projectSidebar: buildProjectSidebar");
		expect(server).toContain("function handleProjectSelection(req, res)");
		expect(server).toContain("function refreshProjectRecency(projectId, rootPath)");
		expect(server).toContain('pathname === "/api/projects/select" && req.method === "POST"');
		expect(server).toContain("SELECTED_PROJECT_ROOT = path.resolve(project.rootPath);");
		expect(server).toContain("const recencyUpdated = refreshProjectRecency(projectId, SELECTED_PROJECT_ROOT);");
	});
});
