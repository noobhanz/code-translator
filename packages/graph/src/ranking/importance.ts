import type { FileImportance, FileNode } from "@codetranslate/core";
import type { DependencyGraph } from "../graph/dependency-graph";

/**
 * Structural importance, not business or architectural importance.
 *
 * score =
 *   normalizedIncoming * 0.60 +
 *   normalizedOutgoing * 0.15 +
 *   normalizedExports * 0.15 +
 *   normalizedSymbols * 0.10
 *
 * Incoming/outgoing counts are unique neighboring files/packages.
 * Normalization is max-value in this repository (0 if the max is 0).
 */
export function computeFileImportance(
  files: readonly FileNode[],
  graph: DependencyGraph,
): FileImportance[] {
  const rows: Array<{
    file: FileNode;
    incoming: number;
    outgoing: number;
    exports: number;
    symbols: number;
  }> = [];

  for (const file of files) {
    if (file.ignored || !graph.nodes.has(file.id)) {
      continue;
    }
    const incoming = uniqueCount(graph.getIncoming(file.id).map((edge) => edge.from));
    const outgoing = uniqueCount(graph.getOutgoing(file.id).map((edge) => edge.to));
    rows.push({
      file,
      incoming,
      outgoing,
      exports: file.analysis?.exports.length ?? 0,
      symbols: file.analysis?.symbols.length ?? 0,
    });
  }

  const maxIncoming = maxOf(rows.map((row) => row.incoming));
  const maxOutgoing = maxOf(rows.map((row) => row.outgoing));
  const maxExports = maxOf(rows.map((row) => row.exports));
  const maxSymbols = maxOf(rows.map((row) => row.symbols));

  const result: FileImportance[] = rows.map((row) => ({
    fileId: row.file.id,
    path: row.file.path,
    score: round4(
      normalize(row.incoming, maxIncoming) * 0.6 +
        normalize(row.outgoing, maxOutgoing) * 0.15 +
        normalize(row.exports, maxExports) * 0.15 +
        normalize(row.symbols, maxSymbols) * 0.1,
    ),
    reasons: {
      incomingDependencies: row.incoming,
      outgoingDependencies: row.outgoing,
      exports: row.exports,
      symbols: row.symbols,
    },
  }));

  result.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return result;
}

function uniqueCount(ids: string[]): number {
  return new Set(ids).size;
}

function maxOf(values: number[]): number {
  return values.reduce((max, value) => (value > max ? value : max), 0);
}

function normalize(value: number, max: number): number {
  return max === 0 ? 0 : value / max;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
