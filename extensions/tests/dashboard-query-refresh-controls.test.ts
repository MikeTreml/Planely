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

describe("TP-189 dashboard query and refresh controls", () => {
	const appSource = readFileSync(
		join(__dirname, "..", "..", "dashboard", "public", "app.js"),
		"utf-8",
	).replace(/\r\n/g, "\n");
	const serverSource = readFileSync(
		join(__dirname, "..", "..", "dashboard", "server.cjs"),
		"utf-8",
	).replace(/\r\n/g, "\n");

	it("defines pending/all query helpers around terminal backlog states", () => {
		const fnBlock = extractFunctionBlock(
			appSource,
			"function isTerminalBacklogStatus(statusKey)",
			"function projectBadgeHtml(badge)",
		);
		const { isTerminalBacklogStatus, backlogMatchesQueryMode } = vm.runInNewContext(
			`${fnBlock}; ({ isTerminalBacklogStatus, backlogMatchesQueryMode });`,
			{},
		) as {
			isTerminalBacklogStatus: (statusKey: string) => boolean;
			backlogMatchesQueryMode: (item: any, queryMode: string) => boolean;
		};

		expect(isTerminalBacklogStatus("succeeded")).toBe(true);
		expect(isTerminalBacklogStatus("skipped")).toBe(true);
		expect(isTerminalBacklogStatus("failed")).toBe(false);
		expect(backlogMatchesQueryMode({ status: { key: "ready" } }, "pending")).toBe(true);
		expect(backlogMatchesQueryMode({ status: { key: "failed" } }, "pending")).toBe(true);
		expect(backlogMatchesQueryMode({ status: { key: "succeeded" } }, "pending")).toBe(false);
		expect(backlogMatchesQueryMode({ status: { key: "succeeded" } }, "all")).toBe(true);
	});

	it("marks state responses as non-cacheable for manual refreshes", () => {
		expect(serverSource).toContain('pathname === "/api/state" && req.method === "GET"');
		expect(serverSource).toContain('"Cache-Control": "no-store"');
	});
});
