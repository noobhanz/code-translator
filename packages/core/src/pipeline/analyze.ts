import { SCHEMA_VERSION } from "@codetranslate/shared";
import type { RepositoryAnalysis } from "../schema/analysis";
import { repositoryAnalysisSchema } from "../schema/analysis";
import type { BasicTechnologyDetection, ManifestSummary } from "../schema/manifests";
import type { Diagnostic } from "../schema/diagnostics";
import type { FileAnalysis } from "../schema/source";
import type { FileImportance, ModuleResolution, RepositoryDependencyGraph } from "../schema/graph";
import type { ApplicationModel } from "../schema/application";
import type { RepositorySnapshot } from "../types/snapshot";
import { snapshotFileToNode, sortFileNodes } from "./file-nodes";
import {
  computeDependencyGraphStatistics,
  computeStatistics,
  emptyDependencyGraph,
  emptyFileImportance,
} from "./statistics";

export interface AnalyzeSnapshotInput {
  snapshot: RepositorySnapshot;
  manifests: ManifestSummary[];
  detectedTechnologies: BasicTechnologyDetection[];
  extraDiagnostics?: Diagnostic[];
  packageManager?: string;
  fileAnalyses?: ReadonlyMap<string, FileAnalysis>;
  resolutions?: ModuleResolution[];
  graph?: RepositoryDependencyGraph;
  fileImportance?: FileImportance[];
  application?: ApplicationModel;
}

export function buildRepositoryAnalysis(input: AnalyzeSnapshotInput): RepositoryAnalysis {
  const files = sortFileNodes(
    input.snapshot.files.map((file) =>
      snapshotFileToNode(input.snapshot.metadata.id, file, input.fileAnalyses?.get(file.path)),
    ),
  );

  const diagnostics = [...input.snapshot.diagnostics, ...(input.extraDiagnostics ?? [])];
  const resolutions = input.resolutions ?? [];
  const graph = input.graph ?? emptyDependencyGraph();
  const fileImportance = input.fileImportance ?? emptyFileImportance();
  const statistics = computeStatistics(files);
  statistics.dependencyGraph = computeDependencyGraphStatistics(graph, resolutions);

  const analysis: RepositoryAnalysis = {
    schemaVersion: SCHEMA_VERSION,
    repository: input.snapshot.metadata,
    files,
    manifests: input.manifests,
    detectedTechnologies: input.detectedTechnologies,
    diagnostics,
    statistics,
    resolutions,
    graph,
    fileImportance,
  };

  if (input.application) {
    analysis.application = input.application;
  }

  if (input.packageManager) {
    analysis.packageManager = input.packageManager;
  }

  return repositoryAnalysisSchema.parse(analysis);
}
