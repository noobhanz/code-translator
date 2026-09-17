import { z } from "zod";

export const moduleResolutionKindSchema = z.enum(["internal", "external", "builtin", "unresolved"]);

export const resolutionStrategySchema = z.enum([
  "relative",
  "alias",
  "workspace",
  "package",
  "builtin",
  "baseUrl",
  "unresolved",
]);

export const resolutionEvidenceTypeSchema = z.enum([
  "exact-path",
  "extension-probe",
  "index-file",
  "tsconfig-path",
  "package-manifest",
  "node-builtin",
  "workspace-package",
]);

export const resolutionEvidenceSchema = z.object({
  type: resolutionEvidenceTypeSchema,
  value: z.string().optional(),
});

export const moduleResolutionSchema = z.object({
  id: z.string().min(1),
  importerFileId: z.string().min(1),
  specifier: z.string(),
  kind: moduleResolutionKindSchema,
  targetFileId: z.string().optional(),
  packageName: z.string().optional(),
  resolutionStrategy: resolutionStrategySchema,
  confidence: z.number().min(0).max(1),
  candidates: z.array(z.string()).optional(),
  evidence: z.array(resolutionEvidenceSchema),
  sourceImportId: z.string().optional(),
  sourceExportId: z.string().optional(),
});

export const graphNodeTypeSchema = z.enum(["file", "package", "builtin"]);

export const graphNodeSchema = z.object({
  id: z.string().min(1),
  type: graphNodeTypeSchema,
  label: z.string().min(1),
  fileId: z.string().optional(),
  packageName: z.string().optional(),
  installed: z.boolean().optional(),
  versionRange: z.string().optional(),
});

export const graphEdgeTypeSchema = z.enum(["imports", "requires", "dynamic-imports", "re-exports"]);

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  type: graphEdgeTypeSchema,
  sourceImportId: z.string().optional(),
  sourceExportId: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const repositoryDependencyGraphSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export const fileImportanceReasonsSchema = z.object({
  incomingDependencies: z.number().int().nonnegative(),
  outgoingDependencies: z.number().int().nonnegative(),
  exports: z.number().int().nonnegative(),
  symbols: z.number().int().nonnegative(),
});

export const fileImportanceSchema = z.object({
  fileId: z.string().min(1),
  path: z.string().min(1),
  score: z.number().min(0).max(1),
  reasons: fileImportanceReasonsSchema,
});

export const dependencyGraphStatisticsSchema = z.object({
  nodeCount: z.number().int().nonnegative(),
  internalFileNodes: z.number().int().nonnegative(),
  externalPackageNodes: z.number().int().nonnegative(),
  builtinNodes: z.number().int().nonnegative(),
  edgeCount: z.number().int().nonnegative(),
  internalEdges: z.number().int().nonnegative(),
  externalEdges: z.number().int().nonnegative(),
  builtinEdges: z.number().int().nonnegative(),
  unresolvedImports: z.number().int().nonnegative(),
});

export type ModuleResolutionKind = z.infer<typeof moduleResolutionKindSchema>;
export type ResolutionStrategy = z.infer<typeof resolutionStrategySchema>;
export type ResolutionEvidence = z.infer<typeof resolutionEvidenceSchema>;
export type ModuleResolution = z.infer<typeof moduleResolutionSchema>;
export type GraphNodeType = z.infer<typeof graphNodeTypeSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdgeType = z.infer<typeof graphEdgeTypeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type RepositoryDependencyGraph = z.infer<typeof repositoryDependencyGraphSchema>;
export type FileImportance = z.infer<typeof fileImportanceSchema>;
export type DependencyGraphStatistics = z.infer<typeof dependencyGraphStatisticsSchema>;
