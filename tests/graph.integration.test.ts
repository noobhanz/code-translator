import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DiagnosticCode } from "@codetranslate/core";
import { inspectRepository } from "@codetranslate/ingest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("module resolution fixtures", () => {
  it("resolves relative imports, indexes, explicit extensions, require, and dynamic import", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/resolution-relative"));
    const bySpec = Object.fromEntries(analysis.resolutions.map((item) => [item.specifier, item]));
    expect(bySpec["./lib/foo"]?.kind).toBe("internal");
    expect(bySpec["./lib/foo"]?.resolutionStrategy).toBe("relative");
    expect(analysis.files.find((file) => file.id === bySpec["./lib/foo"]?.targetFileId)?.path).toBe(
      "src/lib/foo.ts",
    );
    expect(analysis.files.find((file) => file.id === bySpec["../util"]?.targetFileId)?.path).toBe(
      "util.ts",
    );
    expect(analysis.files.find((file) => file.id === bySpec["./dir"]?.targetFileId)?.path).toBe(
      "src/dir/index.ts",
    );
    expect(
      analysis.files.find((file) => file.id === bySpec["./exact.js"]?.targetFileId)?.path,
    ).toBe("src/exact.js");
    expect(bySpec["./missing-relative"]?.kind).toBe("unresolved");
    expect(analysis.graph.edges.some((edge) => edge.type === "requires")).toBe(true);
    expect(analysis.graph.edges.some((edge) => edge.type === "dynamic-imports")).toBe(true);
  });

  it("resolves tsconfig aliases including JSONC configs", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/resolution-alias"));
    const alias = analysis.resolutions.find((item) => item.specifier === "@/lib/db");
    expect(alias?.kind).toBe("internal");
    expect(alias?.resolutionStrategy).toBe("alias");
    expect(analysis.files.find((file) => file.id === alias?.targetFileId)?.path).toBe(
      "src/lib/db.ts",
    );
    expect(alias?.evidence.some((item) => item.type === "tsconfig-path")).toBe(true);
  });

  it("classifies packages as external and node: specifiers as builtins", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/resolution-external"));
    const bySpec = Object.fromEntries(analysis.resolutions.map((item) => [item.specifier, item]));
    expect(bySpec.react?.kind).toBe("external");
    expect(bySpec.react?.packageName).toBe("react");
    expect(bySpec.stripe?.kind).toBe("external");
    expect(bySpec["node:fs"]?.kind).toBe("builtin");
    expect(bySpec["node:fs"]?.packageName).toBe("node:fs");
    expect(bySpec.path?.kind).toBe("builtin");
    expect(bySpec.path?.packageName).toBe("node:path");
    expect(bySpec["lodash/fp"]?.kind).toBe("external");
    expect(bySpec["lodash/fp"]?.packageName).toBe("lodash");
    expect(
      analysis.graph.nodes.some((node) => node.type === "package" && node.label === "react"),
    ).toBe(true);
  });

  it("keeps missing relative imports unresolved without failing the scan", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/resolution-unresolved"));
    expect(analysis.resolutions.some((item) => item.kind === "unresolved")).toBe(true);
    expect(
      analysis.diagnostics.some((item) => item.code === DiagnosticCode.IMPORT_UNRESOLVED),
    ).toBe(true);
    expect(analysis.schemaVersion).toBe("0.3");
  });

  it("creates re-export graph edges", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/resolution-reexport"));
    expect(analysis.graph.edges.some((edge) => edge.type === "re-exports")).toBe(true);
    const index = analysis.files.find((file) => file.path === "src/index.ts");
    const foo = analysis.files.find((file) => file.path === "src/foo.ts");
    expect(
      analysis.graph.edges.some((edge) => edge.from === index?.id && edge.to === foo?.id),
    ).toBe(true);
  });

  it("resolves workspace packages internally", async () => {
    const { analysis } = await inspectRepository(path.join(root, "fixtures/resolution-workspace"));
    const resolved = analysis.resolutions.find((item) => item.specifier === "@acme/ui");
    expect(resolved?.kind).toBe("internal");
    expect(resolved?.resolutionStrategy).toBe("workspace");
    expect(analysis.files.find((file) => file.id === resolved?.targetFileId)?.path).toBe(
      "packages/ui/src/index.ts",
    );
  });

  it("keeps graph IDs and ordering stable across runs", async () => {
    const fixture = path.join(root, "fixtures/resolution-relative");
    const first = await inspectRepository(fixture);
    const second = await inspectRepository(fixture);
    expect(first.analysis.resolutions.map((item) => item.id)).toEqual(
      second.analysis.resolutions.map((item) => item.id),
    );
    expect(first.analysis.graph.nodes.map((node) => node.id)).toEqual(
      second.analysis.graph.nodes.map((node) => node.id),
    );
    expect(first.analysis.graph.edges.map((edge) => edge.id)).toEqual(
      second.analysis.graph.edges.map((edge) => edge.id),
    );
    expect(first.analysis.fileImportance.map((item) => item.score)).toEqual(
      second.analysis.fileImportance.map((item) => item.score),
    );
    expect(first.analysis.repository.analyzedAt).not.toBe(second.analysis.repository.analyzedAt);
  });
});
