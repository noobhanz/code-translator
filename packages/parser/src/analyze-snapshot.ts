import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type FileAnalysis,
  type RepositorySnapshot,
  type SnapshotFile,
} from "@codetranslate/core";
import { fileIdFrom, mapLimit, type Logger } from "@codetranslate/shared";
import { defaultParserRegistry, type LanguageAnalyzerRegistry } from "./registry/registry";

const PARSEABLE_CATEGORIES = new Set(["source", "test", "config"]);

export interface AnalyzeSnapshotSourcesOptions {
  maxParserFileBytes: number;
  concurrency: number;
  registry?: LanguageAnalyzerRegistry;
}

export interface AnalyzeSnapshotSourcesResult {
  analyses: Map<string, FileAnalysis>;
  diagnostics: Diagnostic[];
}

export function isParseCandidate(file: SnapshotFile, registry: LanguageAnalyzerRegistry): boolean {
  if (file.ignored || file.binary) {
    return false;
  }
  if (!PARSEABLE_CATEGORIES.has(file.category)) {
    return false;
  }
  return registry.findForFile(file) !== undefined;
}

export async function analyzeSnapshotSources(
  snapshot: RepositorySnapshot,
  options: AnalyzeSnapshotSourcesOptions,
  logger?: Logger,
): Promise<AnalyzeSnapshotSourcesResult> {
  const registry = options.registry ?? defaultParserRegistry;
  const analyses = new Map<string, FileAnalysis>();
  const diagnostics: Diagnostic[] = [];
  const candidates = snapshot.files.filter((file) => isParseCandidate(file, registry));

  const results = await mapLimit(candidates, options.concurrency, async (file) => {
    return analyzeOneFile(snapshot, file, options, registry, logger);
  });

  for (const result of results) {
    if (result.analysis) {
      analyses.set(result.path, result.analysis);
    }
    diagnostics.push(...result.diagnostics);
  }

  return { analyses, diagnostics };
}

async function analyzeOneFile(
  snapshot: RepositorySnapshot,
  file: SnapshotFile,
  options: AnalyzeSnapshotSourcesOptions,
  registry: LanguageAnalyzerRegistry,
  logger?: Logger,
): Promise<{ path: string; analysis?: FileAnalysis; diagnostics: Diagnostic[] }> {
  const analyzer = registry.findForFile(file);
  if (!analyzer) {
    return { path: file.path, diagnostics: [] };
  }

  if (file.sizeBytes > options.maxParserFileBytes) {
    return {
      path: file.path,
      diagnostics: [
        createDiagnostic(
          "warning",
          DiagnosticCode.SOURCE_TOO_LARGE_FOR_PARSER,
          `Skipped parsing; file exceeds maxParserFileBytes (${options.maxParserFileBytes}).`,
          file.path,
        ),
      ],
    };
  }

  let source: string;
  try {
    source = await snapshot.readText(file.path);
  } catch (error) {
    return {
      path: file.path,
      diagnostics: [
        createDiagnostic(
          "warning",
          DiagnosticCode.SOURCE_READ_FAILED,
          `Could not read source for parsing: ${error instanceof Error ? error.message : String(error)}`,
          file.path,
        ),
      ],
    };
  }

  logger?.debug(`parsing ${file.path} with ${analyzer.id}`);

  try {
    const analysis = analyzer.analyze(file, source, {
      repositoryId: snapshot.metadata.id,
      fileId: fileIdFrom(snapshot.metadata.id, file.path),
    });
    return {
      path: file.path,
      analysis,
      diagnostics: analysis.diagnostics.filter(
        (diagnostic) => diagnostic.code !== DiagnosticCode.SOURCE_SYNTAX_ERROR,
      ),
    };
  } catch (error) {
    return {
      path: file.path,
      diagnostics: [
        createDiagnostic(
          "error",
          DiagnosticCode.SOURCE_PARSE_FAILED,
          `Parser failed: ${error instanceof Error ? error.message : String(error)}`,
          file.path,
        ),
      ],
    };
  }
}
