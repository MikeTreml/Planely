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

describe("TP-184 dashboard task authoring contract", () => {
	const source = readFileSync(
		join(__dirname, "..", "..", "dashboard", "server.cjs"),
		"utf-8",
	).replace(/\r\n/g, "\n");

	const helperBlock = extractBlock(
		source,
		"function readDashboardJsonConfig(root)",
		"function extractBacklogSection(content, heading)",
	);

	it("loads task authoring metadata from configured task areas", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-meta-"));
		try {
			mkdirSync(join(root, ".pi"), { recursive: true });
			mkdirSync(join(root, "taskplane-tasks"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				taskRunner: {
					taskAreas: {
						general: {
							path: "taskplane-tasks",
							prefix: "TP",
							context: "taskplane-tasks/CONTEXT.md",
							repoId: "planely",
						},
					},
				},
			}, null, 2));
			writeFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "**Next Task ID:** TP-321\n");

			const context = {
				fs,
				path,
				process,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
			};

			const { loadTaskAuthoringMetadata } = vm.runInNewContext(
				`${helperBlock}; ({ loadTaskAuthoringMetadata });`,
				context,
			) as { loadTaskAuthoringMetadata: (root?: string) => any };

			const metadata = loadTaskAuthoringMetadata(root);
			expect(metadata.defaultAreaId).toBe("general");
			expect(metadata.areas).toHaveLength(1);
			expect(metadata.areas[0].id).toBe("general");
			expect(metadata.areas[0].path).toBe("taskplane-tasks");
			expect(metadata.areas[0].prefix).toBe("TP");
			expect(metadata.areas[0].nextTaskId).toBe("TP-321");
			expect(metadata.areas[0].contextPath).toBe("taskplane-tasks/CONTEXT.md");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("builds canonical preview markdown with rubric-derived assessment and status scaffolding", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-preview-"));
		try {
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
			writeFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "# General\n\n**Next Task ID:** TP-322\n");

			const context = {
				fs,
				path,
				process,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
			};

			const { buildTaskAuthoringPreview } = vm.runInNewContext(
				`${helperBlock}; ({ buildTaskAuthoringPreview });`,
				context,
			) as { buildTaskAuthoringPreview: (payload: any, root?: string) => any };

			const preview = buildTaskAuthoringPreview({
				areaId: "general",
				title: "Task creation form and packet preview",
				mission: "Add a dashboard authoring flow that previews canonical task packets before write.",
				size: "L",
				reviewLevel: 2,
				complexity: {
					blastRadius: 1,
					patternNovelty: 2,
					security: 0,
					reversibility: 1,
				},
				dependencies: ["TP-180", "External: operator dashboard available"],
				contextRefs: ["docs/specifications/operator-console/view-models.md — contract reference"],
				fileScope: ["dashboard/server.cjs", "dashboard/public/app.js"],
			}, root);

			expect(preview.ok).toBe(true);
			expect(preview.errors).toHaveLength(0);
			expect(preview.derived.taskId).toBe("TP-322");
			expect(preview.derived.slug).toBe("task-creation-form-and-packet-preview");
			expect(preview.derived.folderName).toBe("TP-322-task-creation-form-and-packet-preview");
			expect(preview.derived.relativeFolderPath).toBe("taskplane-tasks/TP-322-task-creation-form-and-packet-preview");
			expect(preview.derived.reviewLevel).toBe(2);
			expect(preview.derived.reviewLabel).toBe("Plan + Code");
			expect(preview.derived.scoreTotal).toBe(4);
			expect(preview.derived.scoreBreakdown.blastRadius).toBe(1);
			expect(preview.derived.scoreBreakdown.patternNovelty).toBe(2);
			expect(preview.derived.scoreBreakdown.security).toBe(0);
			expect(preview.derived.scoreBreakdown.reversibility).toBe(1);
			expect(preview.derived.contextPath).toBe("taskplane-tasks/CONTEXT.md");
			expect(preview.preview.promptMarkdown).toContain("# Task: TP-322 - Task creation form and packet preview");
			expect(preview.preview.promptMarkdown).toContain("## Review Level: 2 (Plan + Code)");
			expect(preview.preview.promptMarkdown).toContain("**Assessment:**");
			expect(preview.preview.promptMarkdown).toContain("**Score:** 4/8 — Blast radius: 1, Pattern novelty: 2, Security: 0, Reversibility: 1");
			expect(preview.preview.promptMarkdown).toContain("taskplane-tasks/TP-322-task-creation-form-and-packet-preview/");
			expect(preview.preview.promptMarkdown).toContain("- **Task:** TP-180");
			expect(preview.preview.promptMarkdown).toContain("- **External:** operator dashboard available");
			expect(preview.preview.promptMarkdown).toContain("- `taskplane-tasks/CONTEXT.md`");
			expect(preview.preview.promptMarkdown).toContain("- `docs/specifications/operator-console/view-models.md` — contract reference");
			expect(preview.preview.promptMarkdown).toContain("- `dashboard/server.cjs`");
			expect(preview.preview.statusMarkdown).toContain("# TP-322: Task creation form and packet preview — Status");
			expect(preview.preview.statusMarkdown).toContain("**Review Level:** 2");
			expect(preview.preview.statusMarkdown).toContain("Generated from the dashboard task authoring preview.");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("returns field errors when rubric scores and explicit review level disagree", () => {
		const root = mkdtempSync(join(tmpdir(), "tp-184-authoring-errors-"));
		try {
			mkdirSync(join(root, ".pi"), { recursive: true });
			mkdirSync(join(root, "taskplane-tasks"), { recursive: true });
			writeFileSync(join(root, ".pi", "taskplane-config.json"), JSON.stringify({
				taskRunner: {
					taskAreas: {
						general: {
							path: "taskplane-tasks",
							context: "taskplane-tasks/CONTEXT.md",
						},
					},
				},
			}, null, 2));
			writeFileSync(join(root, "taskplane-tasks", "CONTEXT.md"), "**Next Task ID:** TP-323\n");

			const context = {
				fs,
				path,
				process,
				REPO_ROOT: root,
				getActiveProjectRoot: () => root,
			};

			const { buildTaskAuthoringPreview } = vm.runInNewContext(
				`${helperBlock}; ({ buildTaskAuthoringPreview });`,
				context,
			) as { buildTaskAuthoringPreview: (payload: any, root?: string) => any };

			const preview = buildTaskAuthoringPreview({
				areaId: "general",
				title: "Mismatch test",
				mission: "Catch invalid review level combinations.",
				size: "M",
				reviewLevel: 3,
				complexity: {
					blastRadius: 0,
					patternNovelty: 1,
					security: 0,
					reversibility: 0,
				},
			}, root);

			expect(preview.ok).toBe(false);
			expect(preview.preview.promptMarkdown).toContain("# Task: TP-323 - Mismatch test");
			expect(preview.errors.some((error: any) => error.field === "reviewLevel")).toBe(true);
			expect(preview.errors.find((error: any) => error.field === "reviewLevel")?.message).toContain("rubric-derived level 0");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("wires task authoring metadata and preview endpoints into the dashboard server", () => {
		expect(source).toContain('pathname === "/api/task-authoring" && req.method === "GET"');
		expect(source).toContain('pathname === "/api/task-authoring/preview" && req.method === "POST"');
		expect(source).toContain("function handleTaskAuthoringPreview(req, res)");
		expect(source).toContain("function loadTaskAuthoringMetadata(root = getActiveProjectRoot())");
	});
});
