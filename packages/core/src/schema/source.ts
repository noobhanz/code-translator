import { z } from "zod";
import { diagnosticSchema } from "./diagnostics";

/**
 * Source coordinates in the Codebase IR are 1-based lines and 1-based columns.
 * Tree-sitter's 0-based positions are converted at the parser boundary.
 */
export const sourceLocationSchema = z.object({
  startLine: z.number().int().positive(),
  startColumn: z.number().int().positive(),
  endLine: z.number().int().positive(),
  endColumn: z.number().int().positive(),
});

export const symbolKindSchema = z.enum([
  "function",
  "class",
  "method",
  "variable",
  "constant",
  "interface",
  "type",
  "enum",
  "component",
  "hook",
]);

export const symbolMetadataSchema = z.object({
  heuristic: z.boolean().optional(),
});

export const symbolNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  qualifiedName: z.string().min(1).optional(),
  kind: symbolKindSchema,
  fileId: z.string().min(1),
  location: sourceLocationSchema,
  exported: z.boolean(),
  defaultExport: z.boolean(),
  async: z.boolean(),
  signature: z.string().optional(),
  documentation: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
  metadata: symbolMetadataSchema.optional(),
});

export const importSpecifierTypeSchema = z.enum(["default", "named", "namespace", "side-effect"]);

export const importSpecifierSchema = z.object({
  type: importSpecifierTypeSchema,
  imported: z.string().optional(),
  local: z.string().optional(),
});

export const importKindSchema = z.enum(["static", "dynamic", "require"]);

export const importDeclarationSchema = z.object({
  id: z.string().min(1),
  fileId: z.string().min(1),
  source: z.string(),
  location: sourceLocationSchema,
  kind: importKindSchema,
  specifiers: z.array(importSpecifierSchema),
});

export const exportTypeSchema = z.enum(["named", "default", "re-export", "export-all"]);

export const exportDeclarationSchema = z.object({
  id: z.string().min(1),
  fileId: z.string().min(1),
  location: sourceLocationSchema,
  type: exportTypeSchema,
  names: z.array(z.string()),
  source: z.string().optional(),
});

export const fileAnalysisParserSchema = z.object({
  language: z.string().min(1),
  parserId: z.string().min(1),
});

export const fileParseStatusSchema = z.object({
  successful: z.boolean(),
  hasSyntaxErrors: z.boolean(),
});

export const fileAnalysisSchema = z.object({
  parser: fileAnalysisParserSchema,
  symbols: z.array(symbolNodeSchema),
  imports: z.array(importDeclarationSchema),
  exports: z.array(exportDeclarationSchema),
  diagnostics: z.array(diagnosticSchema),
  parse: fileParseStatusSchema,
});

export const sourceAnalysisStatisticsSchema = z.object({
  supportedFiles: z.number().int().nonnegative(),
  parsedFiles: z.number().int().nonnegative(),
  filesWithSyntaxErrors: z.number().int().nonnegative(),
  parseFailures: z.number().int().nonnegative(),
  symbolCount: z.number().int().nonnegative(),
  importCount: z.number().int().nonnegative(),
  exportCount: z.number().int().nonnegative(),
  symbolKindCounts: z.record(z.string(), z.number().int().nonnegative()),
});

export type SourceLocation = z.infer<typeof sourceLocationSchema>;
export type SymbolKind = z.infer<typeof symbolKindSchema>;
export type SymbolNode = z.infer<typeof symbolNodeSchema>;
export type ImportSpecifier = z.infer<typeof importSpecifierSchema>;
export type ImportKind = z.infer<typeof importKindSchema>;
export type ImportDeclaration = z.infer<typeof importDeclarationSchema>;
export type ExportType = z.infer<typeof exportTypeSchema>;
export type ExportDeclaration = z.infer<typeof exportDeclarationSchema>;
export type FileAnalysis = z.infer<typeof fileAnalysisSchema>;
export type SourceAnalysisStatistics = z.infer<typeof sourceAnalysisStatisticsSchema>;
