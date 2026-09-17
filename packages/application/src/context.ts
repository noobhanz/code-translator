import type {
  FileImportance,
  FileNode,
  GraphEdge,
  GraphNode,
  ModuleResolution,
  RepositoryAnalysis,
  SymbolNode,
} from "@codetranslate/core";

export interface ApplicationDetectionContext {
  analysis: RepositoryAnalysis;
  filesById: Map<string, FileNode>;
  filesByPath: Map<string, FileNode>;
  includedFiles: FileNode[];
  symbolsByFile: Map<string, SymbolNode[]>;
  incomingEdgesByFile: Map<string, GraphEdge[]>;
  outgoingEdgesByFile: Map<string, GraphEdge[]>;
  resolutionsByFile: Map<string, ModuleResolution[]>;
  packagesByName: Map<string, GraphNode>;
  packageNames: Set<string>;
  importedPackagesByFile: Map<string, Set<string>>;
  filesImportingPackage: Map<string, string[]>;
  importanceByFile: Map<string, FileImportance>;
}

export function buildDetectionContext(analysis: RepositoryAnalysis): ApplicationDetectionContext {
  const filesById = new Map<string, FileNode>();
  const filesByPath = new Map<string, FileNode>();
  const includedFiles: FileNode[] = [];
  const symbolsByFile = new Map<string, SymbolNode[]>();

  for (const file of analysis.files) {
    filesById.set(file.id, file);
    filesByPath.set(file.path, file);
    if (!file.ignored) {
      includedFiles.push(file);
    }
    if (file.analysis) {
      symbolsByFile.set(file.id, file.analysis.symbols);
    }
  }

  const incomingEdgesByFile = new Map<string, GraphEdge[]>();
  const outgoingEdgesByFile = new Map<string, GraphEdge[]>();
  for (const edge of analysis.graph.edges) {
    const outgoing = outgoingEdgesByFile.get(edge.from) ?? [];
    outgoing.push(edge);
    outgoingEdgesByFile.set(edge.from, outgoing);
    const incoming = incomingEdgesByFile.get(edge.to) ?? [];
    incoming.push(edge);
    incomingEdgesByFile.set(edge.to, incoming);
  }

  const resolutionsByFile = new Map<string, ModuleResolution[]>();
  for (const resolution of analysis.resolutions) {
    const list = resolutionsByFile.get(resolution.importerFileId) ?? [];
    list.push(resolution);
    resolutionsByFile.set(resolution.importerFileId, list);
  }

  const packagesByName = new Map<string, GraphNode>();
  for (const node of analysis.graph.nodes) {
    if ((node.type === "package" || node.type === "builtin") && node.packageName) {
      packagesByName.set(node.packageName, node);
    }
  }

  const packageNames = new Set<string>();
  for (const manifest of analysis.manifests) {
    if (manifest.type !== "package.json") {
      continue;
    }
    for (const name of [
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    ]) {
      packageNames.add(name);
    }
  }
  for (const name of packagesByName.keys()) {
    packageNames.add(name);
  }

  const importedPackagesByFile = new Map<string, Set<string>>();
  const filesImportingPackage = new Map<string, string[]>();
  for (const resolution of analysis.resolutions) {
    if (!resolution.packageName) {
      continue;
    }
    const set = importedPackagesByFile.get(resolution.importerFileId) ?? new Set<string>();
    set.add(resolution.packageName);
    importedPackagesByFile.set(resolution.importerFileId, set);
    const files = filesImportingPackage.get(resolution.packageName) ?? [];
    if (!files.includes(resolution.importerFileId)) {
      files.push(resolution.importerFileId);
    }
    filesImportingPackage.set(resolution.packageName, files);
  }

  const importanceByFile = new Map<string, FileImportance>();
  for (const item of analysis.fileImportance) {
    importanceByFile.set(item.fileId, item);
  }

  return {
    analysis,
    filesById,
    filesByPath,
    includedFiles,
    symbolsByFile,
    incomingEdgesByFile,
    outgoingEdgesByFile,
    resolutionsByFile,
    packagesByName,
    packageNames,
    importedPackagesByFile,
    filesImportingPackage,
    importanceByFile,
  };
}

export function hasPackage(context: ApplicationDetectionContext, name: string): boolean {
  return context.packageNames.has(name) || context.packagesByName.has(name);
}

export function filesImportingAny(
  context: ApplicationDetectionContext,
  names: readonly string[],
): string[] {
  const ids = new Set<string>();
  for (const name of names) {
    for (const fileId of context.filesImportingPackage.get(name) ?? []) {
      ids.add(fileId);
    }
  }
  return [...ids];
}

export function filePathLooksLike(file: FileNode, pattern: RegExp): boolean {
  return pattern.test(file.path);
}
