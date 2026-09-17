import type { Diagnostic, DiagnosticSeverity } from "../schema/diagnostics";

export function createDiagnostic(
  severity: DiagnosticSeverity,
  code: string,
  message: string,
  path?: string,
): Diagnostic {
  return path === undefined ? { severity, code, message } : { severity, code, message, path };
}
