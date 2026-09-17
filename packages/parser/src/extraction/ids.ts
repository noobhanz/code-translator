import { compactId } from "@codetranslate/shared";
import type { SourceLocation, SymbolKind } from "@codetranslate/core";

export function symbolId(input: {
  repositoryId: string;
  fileId: string;
  kind: SymbolKind;
  qualifiedName: string;
  location: SourceLocation;
}): string {
  return compactId(
    "symbol",
    `${input.repositoryId}:${input.fileId}:${input.kind}:${input.qualifiedName}:${input.location.startLine}:${input.location.startColumn}`,
  );
}

export function importId(input: {
  fileId: string;
  kind: string;
  source: string;
  location: SourceLocation;
}): string {
  return compactId(
    "import",
    `${input.fileId}:${input.kind}:${input.source}:${input.location.startLine}:${input.location.startColumn}`,
  );
}

export function exportId(input: {
  fileId: string;
  type: string;
  names: string[];
  source: string | undefined;
  location: SourceLocation;
}): string {
  return compactId(
    "export",
    `${input.fileId}:${input.type}:${input.names.join(",")}:${input.source ?? ""}:${input.location.startLine}:${input.location.startColumn}`,
  );
}
