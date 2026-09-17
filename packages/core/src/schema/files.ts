import { z } from "zod";
import { fileAnalysisSchema } from "./source";

export const fileCategorySchema = z.enum([
  "source",
  "test",
  "config",
  "asset",
  "documentation",
  "generated",
  "vendor",
  "unknown",
]);

export const fileNodeSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  extension: z.string(),
  language: z.string().optional(),
  category: fileCategorySchema,
  sizeBytes: z.number().int().nonnegative(),
  hash: z.string(),
  binary: z.boolean(),
  ignored: z.boolean(),
  ignoreReason: z.string().optional(),
  analysis: fileAnalysisSchema.optional(),
});

export type FileCategory = z.infer<typeof fileCategorySchema>;
export type FileNode = z.infer<typeof fileNodeSchema>;

/**
 * Category precedence when multiple classifiers match.
 *
 * test > config > documentation > generated > vendor > source > asset > unknown
 */
export const FILE_CATEGORY_PRIORITY: readonly FileCategory[] = [
  "test",
  "config",
  "documentation",
  "generated",
  "vendor",
  "source",
  "asset",
  "unknown",
];
