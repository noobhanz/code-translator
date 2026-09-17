import { compactId } from "@codetranslate/shared";
import type { SourceLocation } from "@codetranslate/core";

export function resolutionId(input: {
  repositoryId: string;
  importerFileId: string;
  specifier: string;
  location?: SourceLocation;
}): string {
  const loc = input.location ? `${input.location.startLine}:${input.location.startColumn}` : "0:0";
  return compactId(
    "resolution",
    `${input.repositoryId}:${input.importerFileId}:${input.specifier}:${loc}`,
  );
}

export function packageNodeId(packageName: string): string {
  return `package:${packageName}`;
}

export function builtinNodeId(canonicalName: string): string {
  return `builtin:${canonicalName}`;
}

export function edgeId(input: {
  from: string;
  to: string;
  type: string;
  sourceImportId?: string;
  sourceExportId?: string;
}): string {
  return compactId(
    "edge",
    `${input.from}:${input.to}:${input.type}:${input.sourceImportId ?? ""}:${input.sourceExportId ?? ""}`,
  );
}
