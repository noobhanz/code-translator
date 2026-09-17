import { describe, expect, it } from "vitest";
import { DiagnosticCode, type RepositorySnapshot, type SnapshotFile } from "@codetranslate/core";
import { analyzeSnapshotSources, isParseCandidate } from "./analyze-snapshot";
import { defaultParserRegistry } from "./registry/registry";

function snapshotFile(partial: Partial<SnapshotFile> & Pick<SnapshotFile, "path">): SnapshotFile {
  return {
    absolutePath: `/tmp/${partial.path}`,
    extension: ".ts",
    sizeBytes: 20,
    hash: "x",
    binary: false,
    category: "source",
    ignored: false,
    ...partial,
  };
}

describe("parse candidates", () => {
  it("skips binary, ignored, vendor, generated, assets, and documentation", () => {
    expect(
      isParseCandidate(snapshotFile({ path: "a.ts", ignored: true }), defaultParserRegistry),
    ).toBe(false);
    expect(
      isParseCandidate(snapshotFile({ path: "a.ts", binary: true }), defaultParserRegistry),
    ).toBe(false);
    expect(
      isParseCandidate(
        snapshotFile({ path: "vendor.ts", category: "vendor" }),
        defaultParserRegistry,
      ),
    ).toBe(false);
    expect(
      isParseCandidate(
        snapshotFile({ path: "out.min.js", extension: ".js", category: "generated" }),
        defaultParserRegistry,
      ),
    ).toBe(false);
    expect(
      isParseCandidate(
        snapshotFile({ path: "icon.svg", extension: ".svg", category: "asset" }),
        defaultParserRegistry,
      ),
    ).toBe(false);
    expect(
      isParseCandidate(
        snapshotFile({ path: "README.md", extension: ".md", category: "documentation" }),
        defaultParserRegistry,
      ),
    ).toBe(false);
    expect(isParseCandidate(snapshotFile({ path: "a.ts" }), defaultParserRegistry)).toBe(true);
    expect(
      isParseCandidate(
        snapshotFile({ path: "next.config.ts", category: "config" }),
        defaultParserRegistry,
      ),
    ).toBe(true);
  });
});

describe("parser size limit", () => {
  it("emits SOURCE_TOO_LARGE_FOR_PARSER and continues", async () => {
    const file = snapshotFile({ path: "huge.ts", sizeBytes: 50 });
    const snapshot: RepositorySnapshot = {
      metadata: {
        id: "repo_x",
        name: "x",
        source: { type: "local", path: "." },
        rootPath: "/tmp",
        analyzedAt: "2026-01-01T00:00:00.000Z",
        analyzerVersion: "0.2.0",
      },
      files: [file],
      diagnostics: [],
      async readText() {
        return "export const x = 1;";
      },
    };

    const result = await analyzeSnapshotSources(snapshot, {
      maxParserFileBytes: 10,
      concurrency: 2,
    });
    expect(result.analyses.size).toBe(0);
    expect(
      result.diagnostics.some((d) => d.code === DiagnosticCode.SOURCE_TOO_LARGE_FOR_PARSER),
    ).toBe(true);
  });
});
