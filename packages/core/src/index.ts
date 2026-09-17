export { InspectError } from "./errors";
export { DiagnosticCode } from "./diagnostics/codes";
export { createDiagnostic } from "./diagnostics/create";
export {
  basicTechnologyDetectionSchema,
  genericManifestSchema,
  genericManifestTypeSchema,
  manifestSummarySchema,
  packageManifestSchema,
  technologyCategorySchema,
  technologyEvidenceSchema,
  type BasicTechnologyDetection,
  type GenericManifestSummary,
  type ManifestSummary,
  type PackageManifestSummary,
  type TechnologyCategory,
  type TechnologyEvidence,
} from "./schema/manifests";
export {
  diagnosticSchema,
  diagnosticSeveritySchema,
  type Diagnostic,
  type DiagnosticSeverity,
} from "./schema/diagnostics";
export {
  FILE_CATEGORY_PRIORITY,
  fileCategorySchema,
  fileNodeSchema,
  type FileCategory,
  type FileNode,
} from "./schema/files";
export { DEFAULT_SCAN_OPTIONS, scanOptionsSchema, type ScanOptions } from "./schema/scan-options";
export {
  repositoryAnalysisSchema,
  repositoryMetadataSchema,
  repositorySourceSchema,
  repositoryStatisticsSchema,
  schemaVersionSchema,
  type RepositoryAnalysis,
  type RepositoryMetadata,
  type RepositorySourceInfo,
  type RepositoryStatistics,
} from "./schema/analysis";
export { buildRepositoryAnalysis, type AnalyzeSnapshotInput } from "./pipeline/analyze";
export { snapshotFileToNode, sortFileNodes } from "./pipeline/file-nodes";
export { parseAnalysisJson, serializeAnalysis } from "./pipeline/serialize";
export { computeStatistics } from "./pipeline/statistics";
export { resolveOutputFilePath, writeRepositoryAnalysis } from "./pipeline/write-output";
export type { RepositorySnapshot, RepositorySource, SnapshotFile } from "./types/snapshot";
