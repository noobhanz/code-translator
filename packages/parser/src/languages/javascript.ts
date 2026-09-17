import type { FileAnalysis, SnapshotFile } from "@codetranslate/core";
import { extractEcmascriptFile } from "../extraction/ecmascript";
import type { AnalyzeContext, LanguageAnalyzer } from "../types";

function analyzeWith(
  language: LanguageAnalyzer["language"],
  parserId: string,
  file: SnapshotFile,
  source: string,
  context: AnalyzeContext,
): FileAnalysis {
  return extractEcmascriptFile({
    language,
    parserId,
    source,
    filePath: file.path,
    context,
  });
}

export const javaScriptAnalyzer: LanguageAnalyzer = {
  id: "tree-sitter-javascript",
  language: "javascript",
  supports(file: SnapshotFile): boolean {
    return file.extension === ".js" || file.extension === ".mjs" || file.extension === ".cjs";
  },
  analyze(file, source, context) {
    return analyzeWith("javascript", this.id, file, source, context);
  },
};

export const jsxAnalyzer: LanguageAnalyzer = {
  id: "tree-sitter-javascript/jsx",
  language: "jsx",
  supports(file: SnapshotFile): boolean {
    return file.extension === ".jsx";
  },
  analyze(file, source, context) {
    return analyzeWith("jsx", this.id, file, source, context);
  },
};

export const typeScriptAnalyzer: LanguageAnalyzer = {
  id: "tree-sitter-typescript/typescript",
  language: "typescript",
  supports(file: SnapshotFile): boolean {
    return file.extension === ".ts" || file.extension === ".mts" || file.extension === ".cts";
  },
  analyze(file, source, context) {
    return analyzeWith("typescript", this.id, file, source, context);
  },
};

export const tsxAnalyzer: LanguageAnalyzer = {
  id: "tree-sitter-typescript/tsx",
  language: "tsx",
  supports(file: SnapshotFile): boolean {
    return file.extension === ".tsx";
  },
  analyze(file, source, context) {
    return analyzeWith("tsx", this.id, file, source, context);
  },
};
