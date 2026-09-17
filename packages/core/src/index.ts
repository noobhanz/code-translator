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
  computeDependencyGraphStatistics,
  computeSourceAnalysisStatistics,
  computeStatistics,
  emptyDependencyGraph,
  emptyDependencyGraphStatistics,
  emptyFileImportance,
  emptySourceAnalysisStatistics,
} from "./pipeline/statistics";
export {
  dependencyGraphStatisticsSchema,
  fileImportanceSchema,
  graphEdgeSchema,
  graphNodeSchema,
  moduleResolutionSchema,
  repositoryDependencyGraphSchema,
  resolutionEvidenceSchema,
  type DependencyGraphStatistics,
  type FileImportance,
  type GraphEdge,
  type GraphEdgeType,
  type GraphNode,
  type GraphNodeType,
  type ModuleResolution,
  type ModuleResolutionKind,
  type RepositoryDependencyGraph,
  type ResolutionEvidence,
  type ResolutionStrategy,
} from "./schema/graph";
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
export {
  applicationAreaSchema,
  applicationCapabilitySchema,
  applicationEvidenceSchema,
  applicationModelSchema,
  applicationSummarySchema,
  dataStoreDetectionSchema,
  externalServiceDetectionSchema,
  frameworkDetectionSchema,
  userFacingSurfaceSchema,
  type ApplicationArea,
  type ApplicationAreaCategory,
  type ApplicationCapability,
  type ApplicationEntrypoint,
  type ApplicationEvidence,
  type ApplicationFlow,
  type ApplicationModel,
  type ApplicationPrimaryType,
  type ApplicationRelationship,
  type ApplicationSummary,
  type DataStoreCategory,
  type DataStoreDetection,
  type DetectionBasis,
  type ExternalServiceCategory,
  type ExternalServiceDetection,
  type FrameworkDetection,
  type UserFacingSurface,
} from "./schema/application";
export { resolveOutputFilePath, writeRepositoryAnalysis } from "./pipeline/write-output";
export type { RepositorySnapshot, RepositorySource, SnapshotFile } from "./types/snapshot";
