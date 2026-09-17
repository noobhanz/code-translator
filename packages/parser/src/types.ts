import type { FileAnalysis, SnapshotFile } from "@codetranslate/core";

export type SupportedParserLanguage = "javascript" | "jsx" | "typescript" | "tsx";

export interface AnalyzeContext {
  repositoryId: string;
  fileId: string;
}

export interface LanguageAnalyzer {
  readonly id: string;
  readonly language: SupportedParserLanguage;
  supports(file: SnapshotFile): boolean;
  analyze(file: SnapshotFile, source: string, context: AnalyzeContext): FileAnalysis;
}
