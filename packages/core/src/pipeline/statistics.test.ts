import { describe, expect, it } from "vitest";
import type { FileNode } from "../schema/files";
import { computeStatistics } from "./statistics";
import { serializeAnalysis, parseAnalysisJson } from "./serialize";
import { repositoryAnalysisSchema } from "../schema/analysis";
import { SCHEMA_VERSION } from "@codetranslate/shared";

function file(partial: Partial<FileNode> & Pick<FileNode, "path" | "category">): FileNode {
  return {
    id: `file_${partial.path}`,
    extension: ".ts",
    sizeBytes: 10,
    hash: "abc",
    binary: false,
    ignored: false,
    ...partial,
  };
}

describe("statistics", () => {
  it("counts included, ignored, binary, and languages deterministically", () => {
    const stats = computeStatistics([
      file({ path: "b.ts", category: "source", language: "TypeScript", sizeBytes: 20 }),
      file({ path: "a.test.ts", category: "test", language: "TypeScript", sizeBytes: 5 }),
      file({ path: "icon.png", category: "asset", extension: ".png", binary: true, sizeBytes: 40 }),
      file({ path: "skip.log", category: "unknown", ignored: true, sizeBytes: 7 }),
    ]);

    expect(stats.filesDiscovered).toBe(4);
    expect(stats.filesIncluded).toBe(3);
    expect(stats.filesIgnored).toBe(1);
    expect(stats.binaryFiles).toBe(1);
    expect(stats.totalBytes).toBe(72);
    expect(stats.includedBytes).toBe(65);
    expect(stats.languageCounts).toEqual({ TypeScript: 2 });
    expect(stats.categoryCounts.source).toBe(1);
    expect(stats.categoryCounts.test).toBe(1);
    expect(stats.categoryCounts.asset).toBe(1);
    expect(stats.extensionCounts[".png"]).toBe(1);
  });
});

describe("JSON serialization", () => {
  it("pretty-prints valid schema-versioned JSON", () => {
    const analysis = repositoryAnalysisSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      repository: {
        id: "repo_abc",
        name: "demo",
        source: { type: "local", path: "./demo" },
        rootPath: "/tmp/demo",
        analyzedAt: "2026-01-01T00:00:00.000Z",
        analyzerVersion: "0.1.0",
      },
      files: [
        file({
          id: "file_1",
          path: "src/index.ts",
          category: "source",
          language: "TypeScript",
        }),
      ],
      manifests: [],
      detectedTechnologies: [],
      diagnostics: [],
      resolutions: [],
      graph: { nodes: [], edges: [] },
      fileImportance: [],
      statistics: computeStatistics([
        file({
          id: "file_1",
          path: "src/index.ts",
          category: "source",
          language: "TypeScript",
        }),
      ]),
    });

    const json = serializeAnalysis(analysis);
    expect(json.startsWith("{")).toBe(true);
    expect(json.includes("\n  ")).toBe(true);
    expect(json.endsWith("\n")).toBe(true);

    const parsed = parseAnalysisJson(json);
    expect(parsed.schemaVersion).toBe("0.3");
    expect(parsed.statistics.sourceAnalysis.symbolCount).toBe(0);
    expect(parsed.files[0]?.path).toBe("src/index.ts");
  });
});
