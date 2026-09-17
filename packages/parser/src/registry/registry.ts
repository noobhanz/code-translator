import type { SnapshotFile } from "@codetranslate/core";
import {
  javaScriptAnalyzer,
  jsxAnalyzer,
  tsxAnalyzer,
  typeScriptAnalyzer,
} from "../languages/javascript";
import type { LanguageAnalyzer } from "../types";

export class LanguageAnalyzerRegistry {
  private readonly analyzers: LanguageAnalyzer[] = [];

  register(analyzer: LanguageAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  findForFile(file: SnapshotFile): LanguageAnalyzer | undefined {
    return this.analyzers.find((analyzer) => analyzer.supports(file));
  }

  list(): readonly LanguageAnalyzer[] {
    return this.analyzers;
  }
}

export function createDefaultParserRegistry(): LanguageAnalyzerRegistry {
  const registry = new LanguageAnalyzerRegistry();
  registry.register(tsxAnalyzer);
  registry.register(typeScriptAnalyzer);
  registry.register(jsxAnalyzer);
  registry.register(javaScriptAnalyzer);
  return registry;
}

export const defaultParserRegistry = createDefaultParserRegistry();
