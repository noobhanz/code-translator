export type { AnalyzeContext, LanguageAnalyzer, SupportedParserLanguage } from "./types";
export {
  LanguageAnalyzerRegistry,
  createDefaultParserRegistry,
  defaultParserRegistry,
} from "./registry/registry";
export {
  javaScriptAnalyzer,
  jsxAnalyzer,
  typeScriptAnalyzer,
  tsxAnalyzer,
} from "./languages/javascript";
export {
  analyzeSnapshotSources,
  isParseCandidate,
  type AnalyzeSnapshotSourcesOptions,
  type AnalyzeSnapshotSourcesResult,
} from "./analyze-snapshot";
export { extractEcmascriptFile } from "./extraction/ecmascript";
export { parseSource } from "./tree-sitter/parse";
