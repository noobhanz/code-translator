import { z } from "zod";
import { SCHEMA_VERSION } from "@codetranslate/shared";
import { diagnosticSchema } from "./diagnostics";
import { fileNodeSchema } from "./files";
import { basicTechnologyDetectionSchema, manifestSummarySchema } from "./manifests";
import { sourceAnalysisStatisticsSchema } from "./source";

export const schemaVersionSchema = z.literal(SCHEMA_VERSION);

export const repositorySourceSchema = z.object({
  type: z.literal("local"),
  path: z.string().min(1),
});

export const repositoryMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: repositorySourceSchema,
  rootPath: z.string().min(1),
  analyzedAt: z.string().min(1),
  analyzerVersion: z.string().min(1),
});

export const repositoryStatisticsSchema = z.object({
  filesDiscovered: z.number().int().nonnegative(),
  filesIncluded: z.number().int().nonnegative(),
  filesIgnored: z.number().int().nonnegative(),
  binaryFiles: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative(),
  includedBytes: z.number().int().nonnegative(),
  categoryCounts: z.record(z.string(), z.number().int().nonnegative()),
  languageCounts: z.record(z.string(), z.number().int().nonnegative()),
  extensionCounts: z.record(z.string(), z.number().int().nonnegative()),
  sourceAnalysis: sourceAnalysisStatisticsSchema,
});

export const repositoryAnalysisSchema = z.object({
  schemaVersion: schemaVersionSchema,
  repository: repositoryMetadataSchema,
  files: z.array(fileNodeSchema),
  manifests: z.array(manifestSummarySchema),
  detectedTechnologies: z.array(basicTechnologyDetectionSchema),
  diagnostics: z.array(diagnosticSchema),
  statistics: repositoryStatisticsSchema,
  packageManager: z.string().optional(),
});

export type RepositoryMetadata = z.infer<typeof repositoryMetadataSchema>;
export type RepositoryStatistics = z.infer<typeof repositoryStatisticsSchema>;
export type RepositoryAnalysis = z.infer<typeof repositoryAnalysisSchema>;
export type RepositorySourceInfo = z.infer<typeof repositorySourceSchema>;
