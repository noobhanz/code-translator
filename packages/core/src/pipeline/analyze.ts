import { SCHEMA_VERSION } from "@codetranslate/shared";
import type { RepositoryAnalysis } from "../schema/analysis";
import { repositoryAnalysisSchema } from "../schema/analysis";
import type { BasicTechnologyDetection, ManifestSummary } from "../schema/manifests";
import type { Diagnostic } from "../schema/diagnostics";
import type { RepositorySnapshot } from "../types/snapshot";
import { snapshotFileToNode, sortFileNodes } from "./file-nodes";
import { computeStatistics } from "./statistics";

export interface AnalyzeSnapshotInput {
  snapshot: RepositorySnapshot;
  manifests: ManifestSummary[];
  detectedTechnologies: BasicTechnologyDetection[];
  extraDiagnostics?: Diagnostic[];
  packageManager?: string;
}

export function buildRepositoryAnalysis(input: AnalyzeSnapshotInput): RepositoryAnalysis {
  const files = sortFileNodes(
    input.snapshot.files.map((file) => snapshotFileToNode(input.snapshot.metadata.id, file)),
  );

  const diagnostics = [...input.snapshot.diagnostics, ...(input.extraDiagnostics ?? [])];

  const analysis: RepositoryAnalysis = {
    schemaVersion: SCHEMA_VERSION,
    repository: input.snapshot.metadata,
    files,
    manifests: input.manifests,
    detectedTechnologies: input.detectedTechnologies,
    diagnostics,
    statistics: computeStatistics(files),
  };

  if (input.packageManager) {
    analysis.packageManager = input.packageManager;
  }

  return repositoryAnalysisSchema.parse(analysis);
}
