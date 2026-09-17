import { z } from "zod";
import { diagnosticSchema } from "./diagnostics";

export const detectionBasisSchema = z.enum(["observed", "inferred"]);

export const confidenceBandSchema = z.enum(["high", "medium", "low"]);

export const applicationEvidenceTypeSchema = z.enum([
  "file",
  "symbol",
  "package",
  "import",
  "export",
  "graph-edge",
  "framework-convention",
  "configuration",
  "path",
  "inference",
]);

export const applicationEvidenceSchema = z.object({
  type: applicationEvidenceTypeSchema,
  fileId: z.string().optional(),
  symbolId: z.string().optional(),
  packageName: z.string().optional(),
  graphEdgeId: z.string().optional(),
  description: z.string().optional(),
  weight: z.number().optional(),
});

export const applicationPrimaryTypeSchema = z.enum([
  "fullstack-web-application",
  "frontend-application",
  "backend-api",
  "cli",
  "library",
  "package",
  "monorepo",
  "unknown",
]);

export const applicationSummarySchema = z.object({
  primaryType: applicationPrimaryTypeSchema,
  primaryFramework: z.string().optional(),
  headline: z.string().min(1),
  pageCount: z.number().int().nonnegative(),
  apiEndpointCount: z.number().int().nonnegative(),
  mainAreaIds: z.array(z.string()),
  externalServiceCount: z.number().int().nonnegative(),
  dataStoreCount: z.number().int().nonnegative(),
});

export const frameworkDetectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  basis: detectionBasisSchema,
  evidence: z.array(applicationEvidenceSchema),
});

export const applicationEntrypointTypeSchema = z.enum([
  "web",
  "server",
  "api",
  "cli",
  "worker",
  "unknown",
]);

export const applicationEntrypointSchema = z.object({
  id: z.string().min(1),
  type: applicationEntrypointTypeSchema,
  name: z.string().min(1),
  fileId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.array(applicationEvidenceSchema),
});

export const userFacingSurfaceTypeSchema = z.enum([
  "page",
  "api-endpoint",
  "layout",
  "middleware",
  "entrypoint",
  "unknown",
]);

export const userFacingSurfaceSchema = z.object({
  id: z.string().min(1),
  type: userFacingSurfaceTypeSchema,
  name: z.string().min(1),
  route: z.string().optional(),
  fileId: z.string().min(1),
  methods: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(applicationEvidenceSchema),
});

export const applicationAreaCategorySchema = z.enum([
  "authentication",
  "payments",
  "ai",
  "database",
  "file-handling",
  "email",
  "analytics",
  "search",
  "user-management",
  "dashboard",
  "settings",
  "api",
  "frontend",
  "admin",
  "other",
]);

export const applicationAreaSchema = z.object({
  id: z.string().min(1),
  category: applicationAreaCategorySchema,
  name: z.string().min(1),
  description: z.string().min(1),
  confidence: z.number().min(0).max(1),
  basis: detectionBasisSchema,
  primaryFileIds: z.array(z.string()),
  supportingFileIds: z.array(z.string()),
  symbolIds: z.array(z.string()),
  relatedServiceIds: z.array(z.string()),
  evidence: z.array(applicationEvidenceSchema),
});

export const applicationCapabilityCategorySchema = z.enum([
  "user-authentication",
  "payment-processing",
  "ai-processing",
  "data-persistence",
  "file-upload",
  "email-sending",
  "analytics-tracking",
  "search",
  "other",
]);

export const applicationCapabilitySchema = z.object({
  id: z.string().min(1),
  category: applicationCapabilityCategorySchema,
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  relatedAreaIds: z.array(z.string()),
  evidence: z.array(applicationEvidenceSchema),
});

export const externalServiceCategorySchema = z.enum([
  "auth",
  "payments",
  "ai",
  "email",
  "analytics",
  "database",
  "storage",
  "error-monitoring",
  "other",
]);

export const externalServiceDetectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: externalServiceCategorySchema,
  confidence: z.number().min(0).max(1),
  fileIds: z.array(z.string()),
  evidence: z.array(applicationEvidenceSchema),
});

export const dataStoreCategorySchema = z.enum([
  "relational-database",
  "document-database",
  "hosted-backend",
  "local-database",
  "data-access-layer",
  "unknown",
]);

export const dataStoreDetectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: dataStoreCategorySchema,
  confidence: z.number().min(0).max(1),
  evidence: z.array(applicationEvidenceSchema),
});

export const applicationRelationshipTypeSchema = z.enum([
  "uses",
  "depends-on",
  "connects-to",
  "stores-with",
]);

export const applicationRelationshipSchema = z.object({
  id: z.string().min(1),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  type: applicationRelationshipTypeSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.array(applicationEvidenceSchema),
});

export const applicationFlowStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const applicationFlowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  steps: z.array(applicationFlowStepSchema),
  evidence: z.array(applicationEvidenceSchema),
});

export const applicationModelSchema = z.object({
  summary: applicationSummarySchema,
  frameworks: z.array(frameworkDetectionSchema),
  entrypoints: z.array(applicationEntrypointSchema),
  surfaces: z.array(userFacingSurfaceSchema),
  areas: z.array(applicationAreaSchema),
  capabilities: z.array(applicationCapabilitySchema),
  externalServices: z.array(externalServiceDetectionSchema),
  dataStores: z.array(dataStoreDetectionSchema),
  relationships: z.array(applicationRelationshipSchema),
  flows: z.array(applicationFlowSchema),
  diagnostics: z.array(diagnosticSchema),
});

export type DetectionBasis = z.infer<typeof detectionBasisSchema>;
export type ApplicationEvidence = z.infer<typeof applicationEvidenceSchema>;
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export type FrameworkDetection = z.infer<typeof frameworkDetectionSchema>;
export type ApplicationEntrypoint = z.infer<typeof applicationEntrypointSchema>;
export type UserFacingSurface = z.infer<typeof userFacingSurfaceSchema>;
export type ApplicationArea = z.infer<typeof applicationAreaSchema>;
export type ApplicationCapability = z.infer<typeof applicationCapabilitySchema>;
export type ExternalServiceDetection = z.infer<typeof externalServiceDetectionSchema>;
export type DataStoreDetection = z.infer<typeof dataStoreDetectionSchema>;
export type ApplicationRelationship = z.infer<typeof applicationRelationshipSchema>;
export type ApplicationFlow = z.infer<typeof applicationFlowSchema>;
export type ApplicationModel = z.infer<typeof applicationModelSchema>;
export type ApplicationPrimaryType = z.infer<typeof applicationPrimaryTypeSchema>;
export type ApplicationAreaCategory = z.infer<typeof applicationAreaCategorySchema>;
export type ExternalServiceCategory = z.infer<typeof externalServiceCategorySchema>;
export type DataStoreCategory = z.infer<typeof dataStoreCategorySchema>;
