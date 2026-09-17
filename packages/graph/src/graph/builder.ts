import type {
  FileNode,
  GraphEdge,
  GraphEdgeType,
  GraphNode,
  ModuleResolution,
} from "@codetranslate/core";
import { builtinNodeId, edgeId, packageNodeId } from "../resolution/ids";
import type { ResolverIndex } from "../resolution/resolver";
import { DependencyGraph } from "./dependency-graph";

export function buildDependencyGraph(
  files: readonly FileNode[],
  resolutions: readonly ModuleResolution[],
  index: ResolverIndex,
): DependencyGraph {
  const graph = new DependencyGraph();

  for (const file of files) {
    if (file.ignored) {
      continue;
    }
    if (file.analysis || isTarget(file.id, resolutions)) {
      graph.addNode(fileNode(file));
    }
  }

  for (const resolution of resolutions) {
    const importer = index.filesById.get(resolution.importerFileId);
    if (!importer) {
      continue;
    }
    graph.addNode(fileNode(importer));

    const target = targetNode(resolution, index);
    if (!target) {
      continue;
    }
    graph.addNode(target);

    const type = edgeTypeForResolution(resolution, importer);
    const edge: GraphEdge = {
      id: edgeId({
        from: importer.id,
        to: target.id,
        type,
        sourceImportId: resolution.sourceImportId,
        sourceExportId: resolution.sourceExportId,
      }),
      from: importer.id,
      to: target.id,
      type,
      confidence: resolution.confidence,
    };
    if (resolution.sourceImportId) {
      edge.sourceImportId = resolution.sourceImportId;
    }
    if (resolution.sourceExportId) {
      edge.sourceExportId = resolution.sourceExportId;
    }
    graph.addEdge(edge);
  }

  return graph;
}

function fileNode(file: FileNode): GraphNode {
  return {
    id: file.id,
    type: "file",
    label: file.path,
    fileId: file.id,
  };
}

function targetNode(resolution: ModuleResolution, index: ResolverIndex): GraphNode | undefined {
  if (resolution.kind === "internal" && resolution.targetFileId) {
    const file = index.filesById.get(resolution.targetFileId);
    if (!file) {
      return undefined;
    }
    return fileNode(file);
  }
  if (resolution.kind === "builtin" && resolution.packageName) {
    return {
      id: builtinNodeId(resolution.packageName),
      type: "builtin",
      label: resolution.packageName,
      packageName: resolution.packageName,
    };
  }
  if (resolution.kind === "external" && resolution.packageName) {
    const known = index.knownExternalPackages.get(resolution.packageName);
    const node: GraphNode = {
      id: packageNodeId(resolution.packageName),
      type: "package",
      label: resolution.packageName,
      packageName: resolution.packageName,
      installed: Boolean(known),
    };
    if (known?.versionRange) {
      node.versionRange = known.versionRange;
    }
    return node;
  }
  return undefined;
}

function edgeTypeForResolution(resolution: ModuleResolution, importer: FileNode): GraphEdgeType {
  if (resolution.sourceExportId) {
    return "re-exports";
  }
  const declaration = importer.analysis?.imports.find(
    (item) => item.id === resolution.sourceImportId,
  );
  if (declaration?.kind === "require") {
    return "requires";
  }
  if (declaration?.kind === "dynamic") {
    return "dynamic-imports";
  }
  return "imports";
}

function isTarget(fileId: string, resolutions: readonly ModuleResolution[]): boolean {
  return resolutions.some((item) => item.targetFileId === fileId);
}

export function edgeTypeForImportKind(kind: "static" | "dynamic" | "require"): GraphEdgeType {
  if (kind === "require") {
    return "requires";
  }
  if (kind === "dynamic") {
    return "dynamic-imports";
  }
  return "imports";
}
