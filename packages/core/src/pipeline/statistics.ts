import { FILE_CATEGORY_PRIORITY, type FileNode } from "../schema/files";
import type { RepositoryStatistics } from "../schema/analysis";
import type { SourceAnalysisStatistics } from "../schema/source";
import { symbolKindSchema } from "../schema/source";
import type {
  DependencyGraphStatistics,
  FileImportance,
  ModuleResolution,
  RepositoryDependencyGraph,
} from "../schema/graph";

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sortRecord(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function emptySourceAnalysisStatistics(): SourceAnalysisStatistics {
  const symbolKindCounts: Record<string, number> = {};
  for (const kind of symbolKindSchema.options) {
    symbolKindCounts[kind] = 0;
  }
  return {
    supportedFiles: 0,
    parsedFiles: 0,
    filesWithSyntaxErrors: 0,
    parseFailures: 0,
    symbolCount: 0,
    importCount: 0,
    exportCount: 0,
    symbolKindCounts: sortRecord(symbolKindCounts),
  };
}

export function computeSourceAnalysisStatistics(
  files: readonly FileNode[],
): SourceAnalysisStatistics {
  const stats = emptySourceAnalysisStatistics();

  for (const file of files) {
    const analysis = file.analysis;
    if (!analysis) {
      continue;
    }
    stats.supportedFiles += 1;
    if (analysis.parse.successful) {
      stats.parsedFiles += 1;
    } else {
      stats.parseFailures += 1;
    }
    if (analysis.parse.hasSyntaxErrors) {
      stats.filesWithSyntaxErrors += 1;
    }
    stats.symbolCount += analysis.symbols.length;
    stats.importCount += analysis.imports.length;
    stats.exportCount += analysis.exports.length;
    for (const symbol of analysis.symbols) {
      increment(stats.symbolKindCounts, symbol.kind);
    }
  }

  stats.symbolKindCounts = sortRecord(stats.symbolKindCounts);
  return stats;
}

export function computeStatistics(files: readonly FileNode[]): RepositoryStatistics {
  const categoryCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  const extensionCounts: Record<string, number> = {};

  for (const category of FILE_CATEGORY_PRIORITY) {
    categoryCounts[category] = 0;
  }

  let filesIncluded = 0;
  let filesIgnored = 0;
  let binaryFiles = 0;
  let totalBytes = 0;
  let includedBytes = 0;

  for (const file of files) {
    totalBytes += file.sizeBytes;
    if (file.ignored) {
      filesIgnored += 1;
      continue;
    }

    filesIncluded += 1;
    includedBytes += file.sizeBytes;
    increment(categoryCounts, file.category);
    if (file.language) {
      increment(languageCounts, file.language);
    }
    const extensionKey = file.extension === "" ? "(none)" : file.extension;
    increment(extensionCounts, extensionKey);
    if (file.binary) {
      binaryFiles += 1;
    }
  }

  return {
    filesDiscovered: files.length,
    filesIncluded,
    filesIgnored,
    binaryFiles,
    totalBytes,
    includedBytes,
    categoryCounts: sortRecord(categoryCounts),
    languageCounts: sortRecord(languageCounts),
    extensionCounts: sortRecord(extensionCounts),
    sourceAnalysis: computeSourceAnalysisStatistics(files),
    dependencyGraph: emptyDependencyGraphStatistics(),
  };
}

export function emptyDependencyGraphStatistics(): DependencyGraphStatistics {
  return {
    nodeCount: 0,
    internalFileNodes: 0,
    externalPackageNodes: 0,
    builtinNodes: 0,
    edgeCount: 0,
    internalEdges: 0,
    externalEdges: 0,
    builtinEdges: 0,
    unresolvedImports: 0,
  };
}

export function emptyDependencyGraph(): RepositoryDependencyGraph {
  return { nodes: [], edges: [] };
}

export function computeDependencyGraphStatistics(
  graph: RepositoryDependencyGraph,
  resolutions: readonly ModuleResolution[],
): DependencyGraphStatistics {
  const stats = emptyDependencyGraphStatistics();
  stats.nodeCount = graph.nodes.length;
  stats.edgeCount = graph.edges.length;
  for (const node of graph.nodes) {
    if (node.type === "file") {
      stats.internalFileNodes += 1;
    } else if (node.type === "package") {
      stats.externalPackageNodes += 1;
    } else if (node.type === "builtin") {
      stats.builtinNodes += 1;
    }
  }
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    const target = nodeById.get(edge.to);
    if (target?.type === "file") {
      stats.internalEdges += 1;
    } else if (target?.type === "package") {
      stats.externalEdges += 1;
    } else if (target?.type === "builtin") {
      stats.builtinEdges += 1;
    }
  }
  stats.unresolvedImports = resolutions.filter((item) => item.kind === "unresolved").length;
  return stats;
}

export function emptyFileImportance(): FileImportance[] {
  return [];
}
