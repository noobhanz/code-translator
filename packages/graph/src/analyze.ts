import type {
  Diagnostic,
  FileImportance,
  FileNode,
  ManifestSummary,
  ModuleResolution,
  RepositoryDependencyGraph,
} from "@codetranslate/core";
import { compareLocations } from "./location";
import { buildDependencyGraph } from "./graph/builder";
import { computeFileImportance } from "./ranking/importance";
import { buildResolverIndex, resolveSpecifier } from "./resolution/resolver";

export interface AnalyzeDependenciesInput {
  repositoryId: string;
  files: readonly FileNode[];
  manifests: readonly ManifestSummary[];
  readText: (path: string) => Promise<string>;
}

export interface AnalyzeDependenciesResult {
  resolutions: ModuleResolution[];
  graph: RepositoryDependencyGraph;
  fileImportance: FileImportance[];
  diagnostics: Diagnostic[];
}

export async function analyzeDependencies(
  input: AnalyzeDependenciesInput,
): Promise<AnalyzeDependenciesResult> {
  const { index, diagnostics } = await buildResolverIndex(input);
  const resolutions: ModuleResolution[] = [];

  for (const file of input.files) {
    if (file.ignored || !file.analysis) {
      continue;
    }
    for (const declaration of file.analysis.imports) {
      if (!declaration.source) {
        continue;
      }
      const resolved = resolveSpecifier(index, {
        importer: file,
        specifier: declaration.source,
        sourceImportId: declaration.id,
        location: declaration.location,
      });
      resolutions.push(resolved.resolution);
      diagnostics.push(...resolved.diagnostics);
    }
    for (const declaration of file.analysis.exports) {
      if (!declaration.source) {
        continue;
      }
      const resolved = resolveSpecifier(index, {
        importer: file,
        specifier: declaration.source,
        sourceExportId: declaration.id,
        location: declaration.location,
      });
      resolutions.push(resolved.resolution);
      diagnostics.push(...resolved.diagnostics);
    }
  }

  resolutions.sort((a, b) => {
    const fileA = index.filesById.get(a.importerFileId)?.path ?? a.importerFileId;
    const fileB = index.filesById.get(b.importerFileId)?.path ?? b.importerFileId;
    if (fileA !== fileB) {
      return fileA.localeCompare(fileB);
    }
    const locA = locationOf(input.files, a);
    const locB = locationOf(input.files, b);
    if (locA && locB) {
      const byLocation = compareLocations(locA, locB);
      if (byLocation !== 0) {
        return byLocation;
      }
    }
    return a.specifier.localeCompare(b.specifier) || a.id.localeCompare(b.id);
  });

  const graph = buildDependencyGraph(input.files, resolutions, index);
  const fileImportance = computeFileImportance(input.files, graph);

  return {
    resolutions,
    graph: graph.serialize(),
    fileImportance,
    diagnostics,
  };
}

function locationOf(files: readonly FileNode[], resolution: ModuleResolution) {
  const file = files.find((item) => item.id === resolution.importerFileId);
  if (resolution.sourceImportId) {
    return file?.analysis?.imports.find((item) => item.id === resolution.sourceImportId)?.location;
  }
  if (resolution.sourceExportId) {
    return file?.analysis?.exports.find((item) => item.id === resolution.sourceExportId)?.location;
  }
  return undefined;
}
