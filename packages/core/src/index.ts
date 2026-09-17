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
export {
  computeSourceAnalysisStatistics,
  computeStatistics,
  emptySourceAnalysisStatistics,
} from "./pipeline/statistics";
export {
  exportDeclarationSchema,
  exportTypeSchema,
  fileAnalysisSchema,
  importDeclarationSchema,
  importKindSchema,
  importSpecifierSchema,
  sourceAnalysisStatisticsSchema,
  sourceLocationSchema,
  symbolKindSchema,
  symbolNodeSchema,
  type ExportDeclaration,
  type ExportType,
  type FileAnalysis,
  type ImportDeclaration,
  type ImportKind,
  type ImportSpecifier,
  type SourceAnalysisStatistics,
  type SourceLocation,
  type SymbolKind,
  type SymbolNode,
} from "./schema/source";
export { resolveOutputFilePath, writeRepositoryAnalysis } from "./pipeline/write-output";
export type { RepositorySnapshot, RepositorySource, SnapshotFile } from "./types/snapshot";
