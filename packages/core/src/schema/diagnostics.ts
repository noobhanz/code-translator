import { z } from "zod";

export const diagnosticSeveritySchema = z.enum(["info", "warning", "error"]);

export const diagnosticSchema = z.object({
  severity: diagnosticSeveritySchema,
  code: z.string().min(1),
  message: z.string().min(1),
  path: z.string().optional(),
});

export type Diagnostic = z.infer<typeof diagnosticSchema>;
export type DiagnosticSeverity = z.infer<typeof diagnosticSeveritySchema>;
