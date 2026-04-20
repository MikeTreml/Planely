import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readDashboard(file: string): string {
	return readFileSync(join(__dirname, "..", "..", "dashboard", "public", file), "utf-8").replace(/\r\n/g, "\n");
}

describe("TP-182 dashboard backlog UI", () => {
	it("adds backlog/live primary navigation and backlog shell controls", () => {
		const html = readDashboard("index.html");
		expect(html).toContain('id="view-tab-backlog"');
		expect(html).toContain('id="view-tab-live"');
		expect(html).toContain('id="backlog-panel"');
		expect(html).toContain('id="backlog-search"');
		expect(html).toContain('id="backlog-status-filter"');
		expect(html).toContain('id="backlog-scope-line"');
		expect(html).toContain('id="backlog-clear-filters"');
	});

	it("renders backlog state through dedicated view/render helpers", () => {
		const app = readDashboard("app.js");
		expect(app).toContain("function syncPrimaryView(data)");
		expect(app).toContain("function applyPrimaryViewVisibility(data)");
		expect(app).toContain("function renderBacklog(backlog)");
		expect(app).toContain("function backlogScopeText(backlog)");
		expect(app).toContain("function backlogCanOpenStatus(item)");
		expect(app).toContain("function backlogSelectionHtml(item, outOfFilter)");
		expect(app).toContain("STATUS viewer available when this task is part of the active batch");
		expect(app).toContain("$backlogClearFilters?.addEventListener");
		expect(app).toContain("renderSummary(null, data.backlog)");
		expect(app).toContain("configuredRepoIds");
	});
});
