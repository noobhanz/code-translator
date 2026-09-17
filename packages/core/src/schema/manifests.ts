import { z } from "zod";

export const packageManifestSchema = z.object({
  type: z.literal("package.json"),
  path: z.string().min(1),
  name: z.string().optional(),
  version: z.string().optional(),
  private: z.boolean().optional(),
  packageManager: z.string().optional(),
  scripts: z.array(z.string()),
  dependencies: z.array(z.string()),
  devDependencies: z.array(z.string()),
  peerDependencies: z.array(z.string()),
  engines: z.record(z.string(), z.string()).optional(),
  workspaces: z.array(z.string()).optional(),
});

export const genericManifestTypeSchema = z.enum([
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "composer.json",
]);

export const genericManifestSchema = z.object({
  type: genericManifestTypeSchema,
  path: z.string().min(1),
});

export const manifestSummarySchema = z.union([packageManifestSchema, genericManifestSchema]);

export const technologyCategorySchema = z.enum([
  "framework",
  "library",
  "database",
  "auth",
  "payment",
  "ai",
  "styling",
  "testing",
  "other",
]);

export const technologyEvidenceSchema = z.object({
  type: z.literal("package"),
  packageName: z.string().min(1),
  manifestPath: z.string().min(1),
});

export const basicTechnologyDetectionSchema = z.object({
  name: z.string().min(1),
  category: technologyCategorySchema,
  status: z.literal("installed"),
  confidence: z.number().min(0).max(1),
  evidence: z.array(technologyEvidenceSchema).min(1),
});

export type PackageManifestSummary = z.infer<typeof packageManifestSchema>;
export type GenericManifestSummary = z.infer<typeof genericManifestSchema>;
export type ManifestSummary = z.infer<typeof manifestSummarySchema>;
export type TechnologyCategory = z.infer<typeof technologyCategorySchema>;
export type TechnologyEvidence = z.infer<typeof technologyEvidenceSchema>;
export type BasicTechnologyDetection = z.infer<typeof basicTechnologyDetectionSchema>;
