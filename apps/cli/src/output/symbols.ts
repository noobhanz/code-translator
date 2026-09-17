import type { RepositoryAnalysis, SymbolNode } from "@codetranslate/core";
import type { Logger } from "@codetranslate/shared";

const KIND_ORDER = [
  "component",
  "hook",
  "function",
  "class",
  "method",
  "interface",
  "type",
  "enum",
  "constant",
  "variable",
] as const;

export function printSymbols(analysis: RepositoryAnalysis, logger: Logger): void {
  logger.info("Symbols");
  logger.info("");

  const files = analysis.files.filter((file) => file.analysis && file.analysis.symbols.length > 0);
  if (files.length === 0) {
    logger.info("No symbols found.");
    return;
  }

  for (const file of files) {
    const analysisForFile = file.analysis;
    if (!analysisForFile) {
      continue;
    }
    logger.info(file.path);
    const symbols = [...analysisForFile.symbols].sort(compareSymbols);
    for (const symbol of symbols) {
      const line = `line ${symbol.location.startLine}`;
      logger.info(`  ${padKind(symbol.kind)} ${symbol.qualifiedName ?? symbol.name}    ${line}`);
    }
    logger.info("");
  }
}

export function serializeSymbolsJson(analysis: RepositoryAnalysis): string {
  const files = analysis.files
    .filter((file) => file.analysis)
    .map((file) => ({
      path: file.path,
      fileId: file.id,
      parser: file.analysis?.parser,
      parse: file.analysis?.parse,
      symbols: file.analysis?.symbols ?? [],
      imports: file.analysis?.imports ?? [],
      exports: file.analysis?.exports ?? [],
      diagnostics: file.analysis?.diagnostics ?? [],
    }));

  return `${JSON.stringify(
    {
      schemaVersion: analysis.schemaVersion,
      repository: {
        id: analysis.repository.id,
        name: analysis.repository.name,
      },
      files,
    },
    null,
    2,
  )}\n`;
}

function compareSymbols(a: SymbolNode, b: SymbolNode): number {
  const kindDelta = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
  if (kindDelta !== 0) {
    return kindDelta;
  }
  if (a.location.startLine !== b.location.startLine) {
    return a.location.startLine - b.location.startLine;
  }
  return a.name.localeCompare(b.name);
}

function padKind(kind: string): string {
  return kind.padEnd(12, " ");
}
