import { describe, expect, it } from "vitest";
import type { SnapshotFile } from "@codetranslate/core";
import {
  javaScriptAnalyzer,
  jsxAnalyzer,
  tsxAnalyzer,
  typeScriptAnalyzer,
} from "../languages/javascript";
import { createDefaultParserRegistry } from "./registry";

function file(path: string, extension: string): SnapshotFile {
  return {
    path,
    absolutePath: `/tmp/${path}`,
    extension,
    sizeBytes: 10,
    hash: "x",
    binary: false,
    category: "source",
    ignored: false,
  };
}

describe("parser registry", () => {
  const registry = createDefaultParserRegistry();

  it("selects analyzers by extension", () => {
    expect(registry.findForFile(file("a.js", ".js"))?.language).toBe("javascript");
    expect(registry.findForFile(file("a.mjs", ".mjs"))?.language).toBe("javascript");
    expect(registry.findForFile(file("a.cjs", ".cjs"))?.language).toBe("javascript");
    expect(registry.findForFile(file("a.jsx", ".jsx"))?.language).toBe("jsx");
    expect(registry.findForFile(file("a.ts", ".ts"))?.language).toBe("typescript");
    expect(registry.findForFile(file("a.tsx", ".tsx"))?.language).toBe("tsx");
  });

  it("does not select a parser for unsupported files", () => {
    expect(registry.findForFile(file("a.py", ".py"))).toBeUndefined();
    expect(registry.findForFile(file("a.css", ".css"))).toBeUndefined();
    expect(registry.findForFile(file("a.md", ".md"))).toBeUndefined();
  });

  it("exposes stable analyzer ids", () => {
    expect(javaScriptAnalyzer.id).toBe("tree-sitter-javascript");
    expect(jsxAnalyzer.id).toBe("tree-sitter-javascript/jsx");
    expect(typeScriptAnalyzer.id).toBe("tree-sitter-typescript/typescript");
    expect(tsxAnalyzer.id).toBe("tree-sitter-typescript/tsx");
  });
});
